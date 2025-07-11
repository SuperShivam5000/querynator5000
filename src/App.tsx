import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import { SqlEditor } from './components/SqlEditor';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { ResultsDisplay } from './components/ResultsDisplay';
import { DatabaseSchema } from './components/DatabaseSchema';
import { DatabaseSelector } from './components/DatabaseSelector';
import { QueryHistory } from './components/QueryHistory';
import { useDatabase } from './hooks/useDatabase';
import { generateSQLQuery } from './services/pollinations';
import toast from 'react-hot-toast';

interface QueryResult {
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTime: number;
}

function App() {
  const [theme] = useState<'light' | 'dark'>('light');
  const [currentQuery, setCurrentQuery] = useState('-- Write your SQL query here\nSELECT 1;');
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [lastGeneratedQuery, setLastGeneratedQuery] = useState<string>('');
  const [showCreateDatabaseModal, setShowCreateDatabaseModal] = useState(false);

  // Reset UI state when switching databases
  const handleSwitchDatabase = async (dbId: string) => {
    // Call the hook's switchDatabase
    await switchDatabase(dbId);
    // Reset all UI state
    setCurrentQuery('-- Write your SQL query here\nSELECT 1;');
    setQueryResults(null);
    setQueryError(null);
    setSelectedTable(null);
    setShowHistory(false);
    setLastGeneratedQuery('');
    setIsExecuting(false);
    setIsGenerating(false);
    setShowCreateDatabaseModal(false);
  };

  const {
    isLoading,
    tables,
    queryHistory,
    databases,
    currentDbId,
    executeQuery,
    saveQuery,
    toggleFavorite,
    loadTables,
    // Wrap createNewDatabase and deleteDatabase to reset UI after auto-switch
    createNewDatabase: originalCreateNewDatabase,
    switchDatabase,
    deleteDatabase: originalDeleteDatabase,
    deleteQuery
  } = useDatabase();

  // Wrap createNewDatabase to reset UI after auto-switch
  const createNewDatabase = async (name: string, description?: string) => {
    await originalCreateNewDatabase(name, description);
    // After auto-switch, reset UI
    setCurrentQuery('-- Write your SQL query here\nSELECT 1;');
    setQueryResults(null);
    setQueryError(null);
    setSelectedTable(null);
    setShowHistory(false);
    setLastGeneratedQuery('');
    setIsExecuting(false);
    setIsGenerating(false);
    setShowCreateDatabaseModal(false);
  };

  // Wrap deleteDatabase to reset UI after auto-switch
  const deleteDatabase = async (dbId: string) => {
    await originalDeleteDatabase(dbId);
    // After auto-switch, reset UI
    setCurrentQuery('-- Write your SQL query here\nSELECT 1;');
    setQueryResults(null);
    setQueryError(null);
    setSelectedTable(null);
    setShowHistory(false);
    setLastGeneratedQuery('');
    setIsExecuting(false);
    setIsGenerating(false);
    setShowCreateDatabaseModal(false);
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleExecuteQuery = async (queryToExecute?: string) => {
    const query = queryToExecute || currentQuery;
    if (!query.trim()) return;

    setIsExecuting(true);
    setQueryError(null);
    setQueryResults(null);

    try {
      const result = await executeQuery(query);
      setQueryResults(result);
      
      // Refresh schema after query execution (in case tables were created/modified)
      await loadTables();
      
      if (result.rowCount > 0) {
        toast.success(`Query executed successfully! ${result.rowCount} rows returned.`);
      } else {
        toast.success('Query executed successfully!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setQueryError(errorMessage);
      toast.error('Query execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleNaturalLanguageQuery = async (input: string) => {
    if (!currentDbId) {
      toast.error('Please create or select a database first');
      return;
    }

    setIsGenerating(true);
    
    try {
      const sqlQuery = await generateSQLQuery(input, tables);
      setLastGeneratedQuery(sqlQuery);
      
      // Automatically execute the generated query without updating manual editor
      await handleExecuteQuery(sqlQuery);
      
      toast.success('SQL query generated and executed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate SQL query';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuery = async () => {
    if (!currentQuery.trim()) return;
    
    const description = prompt('Enter a description for this query (optional):');
    await saveQuery(currentQuery, description || undefined);
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    const query = `SELECT * FROM ${tableName}`;
    // Execute the query directly without updating the manual editor
    handleExecuteQuery(query);
  };

  const handleDropTable = async (tableName: string): Promise<void> => {
    try {
      const query = `DROP TABLE ${tableName}`;
      await executeQuery(query);
      
      // Clear selected table if it was the one being deleted
      if (selectedTable === tableName) {
        setSelectedTable(null);
      }
      
      // Clear results if they were from the deleted table
      setQueryResults(null);
      setQueryError(null);
      
      toast.success(`Table "${tableName}" deleted successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete table';
      toast.error(errorMessage);
      throw error; // Re-throw to handle loading state in component
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Initializing Querynator5000...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Setting up your intelligent database companion</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300 flex flex-col">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-white/20 dark:border-gray-700/50 relative z-40 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/querynator5000logo.png" 
                alt="Querynator5000 Logo" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Querynator5000
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Natural Language SQL Interface</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Database Selector */}
              <DatabaseSelector
                databases={databases}
                currentDbId={currentDbId}
                onCreateDatabase={createNewDatabase}
                onSwitchDatabase={handleSwitchDatabase}
                onDeleteDatabase={deleteDatabase}
                showCreateForm={showCreateDatabaseModal}
                onCloseCreateForm={() => setShowCreateDatabaseModal(false)}
                onOpenCreateForm={() => setShowCreateDatabaseModal(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Natural Language Input */}
      {currentDbId && (
        <div className="flex-shrink-0">
        <NaturalLanguageInput
          onSubmit={handleNaturalLanguageQuery}
          isGenerating={isGenerating}
          lastGeneratedQuery={lastGeneratedQuery}
        />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
          {!currentDbId ? (
            // No Database Selected State
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="relative mb-6">
                  <img 
                    src="/querynator5000logo.png" 
                    alt="Querynator5000 Logo" 
                    className="w-24 h-24 mx-auto"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome to Querynator5000
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first database to start building amazing SQL queries with AI assistance.
                </p>
                <button
                  onClick={() => setShowCreateDatabaseModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
                >
                  Create Your First Database
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
              {/* Database Schema Sidebar */}
              <div className="lg:col-span-1 xl:col-span-1 flex flex-col min-h-0">
                <DatabaseSchema
                  tables={tables}
                  onTableSelect={handleTableSelect}
                  selectedTable={selectedTable}
                  setSelectedTable={setSelectedTable}
                  onCreateTable={handleExecuteQuery}
                  onDropTable={(tableName) => {
                    return handleDropTable(tableName);
                  }}
                />
              </div>

              {/* Query Editor and Results */}
              <div className="lg:col-span-3 xl:col-span-3 flex flex-col space-y-6 min-h-0">
                {/* Results Display */}
                <div className="flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 dark:border-gray-700/50 min-h-0 overflow-hidden">
                  <ResultsDisplay
                    results={queryResults}
                    error={queryError}
                    isExecuting={isExecuting}
                  />
                </div>

                {/* SQL Editor */}
                <div className="flex-shrink-0 h-80">
                  <SqlEditor
                    query={currentQuery}
                    onQueryChange={setCurrentQuery}
                    onExecute={() => handleExecuteQuery()}
                    isExecuting={isExecuting}
                    onSave={handleSaveQuery}
                    onLoadHistory={() => setShowHistory(true)}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <QueryHistory
        queries={queryHistory}
        onQuerySelect={setCurrentQuery}
        onDeleteQuery={deleteQuery}
        onToggleFavorite={toggleFavorite}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}

export default App;