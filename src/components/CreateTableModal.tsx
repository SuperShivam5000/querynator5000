import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Table, Plus, Trash2, X, Key, AlertCircle, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface Column {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue?: string;
}

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTable: (sql: string) => Promise<void>;
}

const SQL_TYPES = [
  'INTEGER',
  'TEXT',
  'REAL',
  'BLOB',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'TIMESTAMP',
  'VARCHAR(255)',
  'DECIMAL(10,2)'
];

export const CreateTableModal: React.FC<CreateTableModalProps> = ({
  isOpen,
  onClose,
  onCreateTable
}) => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Column[]>([
    {
      id: '1',
      name: 'USER_ID',
      type: 'INTEGER',
      nullable: false,
      primaryKey: true,
      defaultValue: ''
    }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const addColumn = () => {
    const newColumn: Column = {
      id: Date.now().toString(),
      name: 'COLUMN_NAME',
      type: 'TEXT',
      nullable: true,
      primaryKey: false,
      defaultValue: ''
    };
    setColumns([...columns, newColumn]);
  };

  const removeColumn = (id: string) => {
    if (columns.length > 1) {
      setColumns(columns.filter(col => col.id !== id));
    }
  };

  const updateColumn = (id: string, field: keyof Column, value: any) => {
    setColumns(columns.map(col => {
      if (col.id === id) {
        const updatedCol = { ...col, [field]: value };
        
        // If setting this column as primary key, remove primary key from all others
        if (field === 'primaryKey' && value === true) {
          // Also set nullable to false for primary keys
          updatedCol.nullable = false;
          return updatedCol;
        }
        
        // If removing primary key, allow nullable to be set
        if (field === 'primaryKey' && value === false) {
          return updatedCol;
        }
        
        // If this is a primary key column, don't allow nullable to be true
        if (field === 'nullable' && col.primaryKey && value === true) {
          return col; // Don't update
        }
        
        return updatedCol;
      }
      
      // If another column is being set as primary key, remove primary key from this one
      if (field === 'primaryKey' && value === true) {
        return { ...col, primaryKey: false };
      }
      
      return col;
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate table name
    if (!tableName.trim()) {
      newErrors.tableName = 'Table name is required';
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName.trim())) {
      newErrors.tableName = 'Table name must start with a letter or underscore and contain only letters, numbers, and underscores';
    }

    // Validate columns
    const columnNames = new Set<string>();

    columns.forEach((col) => {
      const colKey = `column_${col.id}`;
      
      if (!col.name.trim()) {
        newErrors[`${colKey}_name`] = 'Column name is required';
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col.name.trim())) {
        newErrors[`${colKey}_name`] = 'Invalid column name format';
      } else if (columnNames.has(col.name.trim().toLowerCase())) {
        newErrors[`${colKey}_name`] = 'Duplicate column name';
      } else {
        columnNames.add(col.name.trim().toLowerCase());
      }

      if (col.primaryKey) {
        // ...existing code...
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSQL = (): string => {
    const columnDefinitions = columns.map(col => {
      let definition = `${col.name} ${col.type}`;
      
      if (col.primaryKey) {
        definition += ' PRIMARY KEY';
        if (col.type === 'INTEGER') {
          definition += ' AUTOINCREMENT';
        }
      }
      
      if (!col.nullable && !col.primaryKey) {
        definition += ' NOT NULL';
      }
      
      if (col.defaultValue && !col.primaryKey) {
        if (col.type === 'TEXT' || col.type.startsWith('VARCHAR')) {
          definition += ` DEFAULT '${col.defaultValue}'`;
        } else {
          definition += ` DEFAULT ${col.defaultValue}`;
        }
      }
      
      return definition;
    });

    return `CREATE TABLE ${tableName} (\n  ${columnDefinitions.join(',\n  ')}\n);`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    try {
      const sql = generateSQL();
      await onCreateTable(sql);
      
      // Reset form
      setTableName('');
      setColumns([{
        id: '1',
        name: 'USER_ID',
        type: 'INTEGER',
        nullable: false,
        primaryKey: true,
        defaultValue: ''
      }]);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to create table:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setTableName('');
    setColumns([{
      id: '1',
      name: 'USER_ID',
      type: 'INTEGER',
      nullable: false,
      primaryKey: true,
      defaultValue: ''
    }]);
    setErrors({});
    onClose();
  };

  // Check if any column has primary key set
  const hasPrimaryKey = columns.some(col => col.primaryKey);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
              <Table className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create New Table
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Design your table structure visually
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[calc(90vh-80px)]">
          <div className="flex-1 overflow-auto p-6">
            {/* Table Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Table Name *
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Enter table name (e.g., users, products)"
                id="table-name"
                name="tableName"
                className={clsx(
                  'w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                  errors.tableName
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                )}
              />
              {errors.tableName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.tableName}
                </p>
              )}
            </div>

            {/* Columns */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Columns *
                </label>
                <button
                  type="button"
                  onClick={addColumn}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-sm"
                >
                  <Plus size={16} />
                  <span>Add Column</span>
                </button>
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                {columns.map((column) => (
                  <div
                    key={column.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Column {columns.indexOf(column) + 1}
                      </span>
                      {columns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColumn(column.id)}
                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Column Name */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={column.name}
                          onChange={(e) => updateColumn(column.id, 'name', e.target.value)}
                          placeholder="USER_NAME"
                          id={`column-name-${column.id}`}
                          name={`columnName_${column.id}`}
                          className={clsx(
                            'w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200',
                            errors[`column_${column.id}_name`]
                              ? 'border-red-300 dark:border-red-600'
                              : 'border-gray-300 dark:border-gray-600'
                          )}
                        />
                        {errors[`column_${column.id}_name`] && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors[`column_${column.id}_name`]}
                          </p>
                        )}
                      </div>

                      {/* Data Type */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Type
                        </label>
                        <select
                          value={column.type}
                          onChange={(e) => updateColumn(column.id, 'type', e.target.value)}
                          id={`column-type-${column.id}`}
                          name={`columnType_${column.id}`}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        >
                          {SQL_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Default Value */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Default
                        </label>
                        <input
                          type="text"
                          value={column.defaultValue || ''}
                          onChange={(e) => updateColumn(column.id, 'defaultValue', e.target.value)}
                          placeholder="DEFAULT VALUE"
                          disabled={column.primaryKey}
                          id={`column-default-${column.id}`}
                          name={`columnDefault_${column.id}`}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Constraints */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Constraints
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={column.primaryKey}
                              onChange={(e) => updateColumn(column.id, 'primaryKey', e.target.checked)}
                              disabled={hasPrimaryKey && !column.primaryKey}
                              id={`column-pk-${column.id}`}
                              name={`columnPrimaryKey_${column.id}`}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <span className={clsx(
                              "text-xs flex items-center",
                              hasPrimaryKey && !column.primaryKey 
                                ? "text-gray-400 dark:text-gray-500" 
                                : "text-gray-700 dark:text-gray-300"
                            )}>
                              <Key size={12} className="mr-1" />
                              Primary Key
                            </span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={!column.nullable}
                              onChange={(e) => updateColumn(column.id, 'nullable', !e.target.checked)}
                              disabled={column.primaryKey}
                              id={`column-nullable-${column.id}`}
                              name={`columnNullable_${column.id}`}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <span className={clsx(
                              "text-xs",
                              column.primaryKey 
                                ? "text-gray-400 dark:text-gray-500" 
                                : "text-gray-700 dark:text-gray-300"
                            )}>
                              Not Null
                            </span>
                          </label>
                        </div>
                        {errors[`column_${column.id}_pk`] && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {errors[`column_${column.id}_pk`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SQL Preview */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Sparkles className="mr-2 text-purple-500" size={16} />
                Generated SQL Preview
              </label>
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                <pre className="text-sm text-green-400 font-mono overflow-x-auto">
                  {tableName ? generateSQL() : '-- Enter table name and columns to see SQL preview'}
                </pre>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !tableName.trim()}
              className={clsx(
                'px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg',
                isCreating || !tableName.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105'
              )}
            >
              {isCreating ? 'Creating Table...' : 'Create Table'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};