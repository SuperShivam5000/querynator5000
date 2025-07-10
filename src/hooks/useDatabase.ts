import { useState, useEffect, useCallback } from 'react';
import initSqlJs from 'sql.js';
import { openDB, IDBPDatabase } from 'idb';
import toast from 'react-hot-toast';

interface QueryResult {
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTime: number;
}

interface TableSchema {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
  }>;
  rowCount: number;
}

interface SavedQuery {
  id: string;
  query: string;
  timestamp: number;
  description?: string;
  isFavorite?: boolean;
  databaseId: string;
}

interface DatabaseInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastModified: number;
}

const DB_NAME = 'QueryGenieDB';
const DB_VERSION = 3;
const DATABASE_STORE = 'databases';
const QUERIES_STORE = 'queries';
const METADATA_STORE = 'metadata';
const LAST_DB_KEY = 'lastOpenedDatabase';

export const useDatabase = () => {
  const [SQL, setSQL] = useState<any>(null);
  const [currentDb, setCurrentDb] = useState<any>(null);
  const [currentDbId, setCurrentDbId] = useState<string>('');
  const [idb, setIdb] = useState<IDBPDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [queryHistory, setQueryHistory] = useState<SavedQuery[]>([]);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);

  // Initialize SQL.js and IndexedDB
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // Initialize SQL.js
        const sqlModule = await initSqlJs({
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        setSQL(sqlModule);

        // Initialize IndexedDB
        const indexedDB = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db, oldVersion) {
            if (oldVersion < 1) {
              if (!db.objectStoreNames.contains(DATABASE_STORE)) {
                db.createObjectStore(DATABASE_STORE, { keyPath: 'id' });
              }
              if (!db.objectStoreNames.contains(QUERIES_STORE)) {
                db.createObjectStore(QUERIES_STORE, { keyPath: 'id' });
              }
            }
            if (oldVersion < 2) {
              if (!db.objectStoreNames.contains(METADATA_STORE)) {
                db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
              }
            }
          },
        });
        setIdb(indexedDB);

        // Load database list
        await loadDatabaseList(indexedDB, sqlModule);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        toast.error('Failed to initialize database');
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // Save last opened database to localStorage
  const saveLastOpenedDatabase = useCallback((dbId: string) => {
    localStorage.setItem(LAST_DB_KEY, dbId);
  }, []);

  // Get last opened database from localStorage
  const getLastOpenedDatabase = useCallback(() => {
    return localStorage.getItem(LAST_DB_KEY);
  }, []);
  const loadDatabaseList = useCallback(async (indexedDB: IDBPDatabase, sqlModule?: any) => {
    try {
      const allDatabases = await indexedDB.getAll(DATABASE_STORE);
      const enhancedDbList: DatabaseInfo[] = [];

      for (const dbData of allDatabases) {
        try {
          const database = new sqlModule.Database(new Uint8Array(dbData.data));
          
          // Create database_info table if it doesn't exist
          database.run(`
            CREATE TABLE IF NOT EXISTS database_info (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              created_at INTEGER NOT NULL,
              last_modified INTEGER NOT NULL
            )
          `);

          // Try to get database info from SQL
          const result = database.exec('SELECT * FROM database_info WHERE id = ?', [dbData.id]);
          
          if (result.length > 0 && result[0].values.length > 0) {
            const row = result[0].values[0];
            enhancedDbList.push({
              id: row[0] as string,
              name: row[1] as string,
              description: row[2] as string || undefined,
              createdAt: row[3] as number,
              lastModified: row[4] as number
            });
          }
          
          database.close();
        } catch (error) {
          console.error(`Failed to load database ${dbData.id}:`, error);
        }
      }

      // Filter out any sample or default databases and sort by last modified
      const filteredDatabases = enhancedDbList
        .filter(db => db.id !== 'default' && db.id !== 'sample' && !db.name.toLowerCase().includes('sample'))
        .sort((a, b) => b.lastModified - a.lastModified);
      
      setDatabases(filteredDatabases);
      
      // Handle database selection logic
      if (filteredDatabases.length === 0) {
        // No databases available - clear everything
        setCurrentDbId('');
        setCurrentDb(null);
        setTables([]);
        setQueryHistory([]);
      } else {
        // Databases are available
        const lastOpenedDbId = getLastOpenedDatabase();
        let targetDbId = null;
        
        // Try to use last opened database if it still exists
        if (lastOpenedDbId && filteredDatabases.find(db => db.id === lastOpenedDbId)) {
          targetDbId = lastOpenedDbId;
        }
        // If current database is still valid, keep it
        else if (currentDbId && filteredDatabases.find(db => db.id === currentDbId)) {
          targetDbId = currentDbId;
        }
        // Otherwise, use the most recently modified database
        else {
          targetDbId = filteredDatabases[0].id;
        }
        
        // Only load if we need to switch databases
        if (targetDbId && targetDbId !== currentDbId) {
          await loadDatabase(indexedDB, sqlModule, targetDbId);
        }
      }
    } catch (error) {
      console.error('Failed to load database list:', error);
    }
  }, [currentDbId, getLastOpenedDatabase]);

  const loadDatabase = useCallback(async (indexedDB: IDBPDatabase, sqlModule: any, dbId: string) => {
    try {
      const existingData = await indexedDB.get(DATABASE_STORE, dbId);
      if (!existingData || !existingData.data) {
        throw new Error('Database not found');
      }

      const database = new sqlModule.Database(new Uint8Array(existingData.data));
      
      setCurrentDb(database);
      setCurrentDbId(dbId);
      saveLastOpenedDatabase(dbId);
      await loadTables(database);
      await loadQueryHistory(indexedDB, dbId);
      
    } catch (error) {
      console.error('Failed to load database:', error);
      toast.error('Failed to load database');
    }
  }, [saveLastOpenedDatabase]);

  const loadTables = useCallback(async (database: any) => {
    try {
      const result = database.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'database_info'
        ORDER BY name
      `);

      if (result.length === 0) {
        setTables([]);
        return;
      }

      const tableNames = result[0].values.map((row: any) => row[0]);
      const tableSchemas: TableSchema[] = [];

      for (const tableName of tableNames) {
        const schemaResult = database.exec(`PRAGMA table_info(${tableName})`);
        const countResult = database.exec(`SELECT COUNT(*) FROM ${tableName}`);
        
        const columns = schemaResult[0]?.values.map((row: any) => ({
          name: row[1],
          type: row[2],
          nullable: row[3] === 0,
          primaryKey: row[5] === 1
        })) || [];

        const rowCount = countResult[0]?.values[0][0] || 0;

        tableSchemas.push({
          name: tableName,
          columns,
          rowCount
        });
      }

      setTables(tableSchemas);
    } catch (error) {
      console.error('Failed to load tables:', error);
      toast.error('Failed to load database schema');
    }
  }, []);

  const loadQueryHistory = useCallback(async (indexedDB: IDBPDatabase, dbId: string) => {
    try {
      const allQueries = await indexedDB.getAll(QUERIES_STORE);
      const dbQueries = allQueries.filter(q => q.databaseId === dbId);
      setQueryHistory(dbQueries.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to load query history:', error);
    }
  }, []);

  const saveDatabase = useCallback(async (indexedDB: IDBPDatabase, database: any, dbId: string) => {
    try {
      const data = database.export();
      await indexedDB.put(DATABASE_STORE, { id: dbId, data: Array.from(data) });
      
      // Update last_modified in database_info table
      database.run(`
        UPDATE database_info SET last_modified = ? WHERE id = ?
      `, [Date.now(), dbId]);
      
      // Save again with updated timestamp
      const updatedData = database.export();
      await indexedDB.put(DATABASE_STORE, { id: dbId, data: Array.from(updatedData) });
    } catch (error) {
      console.error('Failed to save database:', error);
      toast.error('Failed to save database');
    }
  }, []);

  const createNewDatabase = useCallback(async (name: string, description?: string) => {
    if (!SQL || !idb) return;

    try {
      const dbId = `db_${Date.now()}`;
      const database = new SQL.Database();
      
      // Create database_info table and insert metadata
      database.run(`
        CREATE TABLE database_info (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at INTEGER NOT NULL,
          last_modified INTEGER NOT NULL
        )
      `);
      
      const now = Date.now();
      database.run(`
        INSERT INTO database_info (id, name, description, created_at, last_modified)
        VALUES (?, ?, ?, ?, ?)
      `, [dbId, name, description || null, now, now]);
      
      // Save the new database
      await saveDatabase(idb, database, dbId);
      
      // Reload database list
      await loadDatabaseList(idb, SQL);
      
      // Switch to new database
      await switchDatabase(dbId);
      
      toast.success(`Database "${name}" created successfully`);
    } catch (error) {
      console.error('Failed to create database:', error);
      toast.error('Failed to create database');
    }
  }, [SQL, idb, loadDatabaseList, saveDatabase]);

  const switchDatabase = useCallback(async (dbId: string) => {
    if (!SQL || !idb) return;

    try {
      await loadDatabase(idb, SQL, dbId);
      toast.success('Database switched successfully');
    } catch (error) {
      console.error('Failed to switch database:', error);
      toast.error('Failed to switch database');
    }
  }, [SQL, idb, loadDatabase]);

  const deleteDatabase = useCallback(async (dbId: string) => {
    if (!idb) return;

    try {
      // Delete database data
      await idb.delete(DATABASE_STORE, dbId);
      
      // Delete related queries
      const allQueries = await idb.getAll(QUERIES_STORE);
      const queriesToDelete = allQueries.filter(q => q.databaseId === dbId);
      for (const query of queriesToDelete) {
        await idb.delete(QUERIES_STORE, query.id);
      }
      
      // Clear from localStorage if it was the last opened database
      if (getLastOpenedDatabase() === dbId) {
        localStorage.removeItem(LAST_DB_KEY);
      }
      
      // Reload database list
      await loadDatabaseList(idb, SQL);
      
      // If current database was deleted, the loadDatabaseList will handle switching
      if (currentDbId === dbId) {
        // loadDatabaseList will automatically switch to another database if available
        // or clear the state if no databases remain
      }
      
      toast.success('Database deleted successfully');
    } catch (error) {
      console.error('Failed to delete database:', error);
      toast.error('Failed to delete database');
    }
  }, [idb, currentDbId, loadDatabaseList, SQL, getLastOpenedDatabase]);

  const executeQuery = useCallback(async (query: string): Promise<QueryResult> => {
    if (!currentDb) throw new Error('No database selected');

    const startTime = Date.now();
    
    try {
      // Check if this is an ATTACH DATABASE command
      const attachMatch = query.match(/ATTACH\s+DATABASE\s+['"]([^'"]+)['"]\s+AS\s+(\w+)/i);
      
      const result = currentDb.exec(query);
      const executionTime = Date.now() - startTime;

      // If this was an ATTACH command, create a new database entry
      if (attachMatch && idb && SQL) {
        const [, dbPath, dbAlias] = attachMatch;
        
        // Create a new database with the attached name
        const newDbId = `db_${Date.now()}`;
        const newDatabase = new SQL.Database();
        
        // Create database_info table and insert metadata
        newDatabase.run(`
          CREATE TABLE database_info (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at INTEGER NOT NULL,
            last_modified INTEGER NOT NULL
          )
        `);
        
        const now = Date.now();
        newDatabase.run(`
          INSERT INTO database_info (id, name, description, created_at, last_modified)
          VALUES (?, ?, ?, ?, ?)
        `, [newDbId, dbAlias, `Attached from ${dbPath}`, now, now]);
        
        // Save the new database
        await saveDatabase(idb, newDatabase, newDbId);
        
        // Reload database list
        await loadDatabaseList(idb, SQL);
        
        newDatabase.close();
      }

      if (result.length === 0) {
        // Query executed successfully but returned no results (e.g., INSERT, UPDATE, DELETE)
        // For DDL operations (CREATE, DROP, ALTER), we need to save the database and reload schema
        const isDDL = /^\s*(CREATE|DROP|ALTER)\s+/i.test(query.trim());
        
        if (isDDL && idb) {
          // Save database state immediately after DDL operations
          await saveDatabase(idb, currentDb, currentDbId);
          // Reload tables schema since structure changed
          await loadTables(currentDb);
          // Reload database list in case database info was updated
          if (SQL) {
            await loadDatabaseList(idb, SQL);
          }
        }
        
        return {
          columns: [],
          values: [],
          rowCount: 0,
          executionTime
        };
      }

      const queryResult = {
        columns: result[0].columns,
        values: result[0].values,
        rowCount: result[0].values.length,
        executionTime
      };

      // Save database state after successful query
      if (idb) {
        await saveDatabase(idb, currentDb, currentDbId);
      }
      
      // Reload tables schema in case structure changed
      await loadTables(currentDb);
      
      // Reload database list in case database info was updated
      if (SQL) {
        await loadDatabaseList(idb!, SQL);
      }

      return queryResult;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Query execution failed');
    }
  }
  )

  const saveQuery = useCallback(async (query: string, description?: string) => {
    if (!idb || !currentDbId) return;

    try {
      const savedQuery: SavedQuery = {
        id: Date.now().toString(),
        query,
        timestamp: Date.now(),
        description,
        isFavorite: false,
        databaseId: currentDbId
      };

      await idb.put(QUERIES_STORE, savedQuery);
      await loadQueryHistory(idb, currentDbId);
      toast.success('Query saved successfully');
    } catch (error) {
      console.error('Failed to save query:', error);
      toast.error('Failed to save query');
    }
  }, [idb, currentDbId, loadQueryHistory]);

  const deleteQuery = useCallback(async (queryId: string) => {
    if (!idb) return;

    try {
      await idb.delete(QUERIES_STORE, queryId);
      await loadQueryHistory(idb, currentDbId);
      toast.success('Query deleted successfully');
    } catch (error) {
      console.error('Failed to delete query:', error);
      toast.error('Failed to delete query');
    }
  }, [idb, currentDbId, loadQueryHistory]);

  const toggleFavorite = useCallback(async (queryId: string) => {
    if (!idb) return;

    try {
      const query = await idb.get(QUERIES_STORE, queryId);
      if (query) {
        query.isFavorite = !query.isFavorite;
        await idb.put(QUERIES_STORE, query);
        await loadQueryHistory(idb, currentDbId);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update query');
    }
  }, [idb, currentDbId, loadQueryHistory]);

  return {
    isLoading,
    tables,
    queryHistory,
    databases,
    currentDbId,
    executeQuery,
    saveQuery,
    deleteQuery,
    toggleFavorite,
    createNewDatabase,
    switchDatabase,
    deleteDatabase,
    loadTables: () => currentDb ? loadTables(currentDb) : Promise.resolve(),
    saveDatabase: () => idb && currentDb ? saveDatabase(idb, currentDb, currentDbId) : Promise.resolve()
  };
};