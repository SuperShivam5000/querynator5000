import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Database, Table, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { CreateTableModal } from './CreateTableModal';

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

interface DatabaseSchemaProps {
  tables: TableSchema[];
  onTableSelect: (tableName: string) => void;
  onCreateTable: (sql: string) => Promise<void>;
  onDropTable: (tableName: string) => Promise<void>;
  selectedTable: string | null;
  setSelectedTable?: (tableName: string | null) => void;
  showDeleteModal?: boolean;
  onCloseDeleteModal?: () => void;
  onConfirmDelete?: () => void;
  deleteTarget?: { type: 'table'; name: string } | null;
}

export const DatabaseSchema: React.FC<DatabaseSchemaProps> = ({
  tables,
  onTableSelect,
  onCreateTable,
  onDropTable,
  selectedTable,
  setSelectedTable = () => {},
  showDeleteModal = false,
  onCloseDeleteModal = () => {},
  onConfirmDelete = () => {},
  deleteTarget = null
}) => {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [localDeleteModal, setLocalDeleteModal] = useState<{ type: 'table'; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const handleDeleteClick = (tableName: string) => {
    setLocalDeleteModal({ type: 'table', name: tableName });
  };

  const handleConfirmDelete = async () => {
    if (localDeleteModal) {
      setIsDeleting(true);
      try {
        await onDropTable(localDeleteModal.name);
      } catch (error) {
        console.error('Failed to delete table:', error);
      } finally {
        setIsDeleting(false);
      }
      setLocalDeleteModal(null);
    }
  };

  const handleCreateTable = async (sql: string) => {
    await onCreateTable(sql);
    setShowCreateModal(false);
  };

  const DeleteConfirmationModal = () => {
    const modalData = localDeleteModal || deleteTarget;
    const isOpen = localDeleteModal !== null || showDeleteModal;
    
    if (!isOpen || !modalData) return null;

    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                <Trash2 className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the table{' '}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  "{modalData.name}"
                </span>
                ? All data in this table will be permanently lost.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setLocalDeleteModal(null);
                  onCloseDeleteModal();
                }}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (localDeleteModal) {
                    handleConfirmDelete();
                  } else {
                    onConfirmDelete();
                  }
                }}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
              >
                {isDeleting ? 'Deleting...' : 'Delete Table'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };
  return (
    <>
      <div className="h-full flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Database className="text-blue-600 dark:text-blue-400" size={20} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Database Schema</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Create Table"
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto min-h-0">
        {tables.length === 0 ? (
          <div className="p-6 text-center h-full flex flex-col justify-center">
            <Database className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No tables found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm shadow-lg hover:shadow-xl"
            >
              Create First Table
            </button>
          </div>
        ) : (
          <div className="p-2">
            {tables.map((table) => (
              <div key={table.name} className="mb-2">
                <div
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200',
                    selectedTable === table.name
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 shadow-md'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                  onClick={() => {
                    setSelectedTable(table.name);
                    onTableSelect(table.name);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTable(table.name);
                      }}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {expandedTables.has(table.name) ? (
                        <EyeOff size={16} className="text-gray-500" />
                      ) : (
                        <Eye size={16} className="text-gray-500" />
                      )}
                    </button>
                    <Table size={16} className="text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{table.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {table.columns.length} columns • {table.rowCount} rows
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(table.name);
                    }}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    title="Drop Table"
                  >
                    <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                  </button>
                </div>
                
                {expandedTables.has(table.name) && (
                  <div className="ml-8 mt-2 space-y-1">
                    {table.columns.map((column, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="font-semibold text-gray-900 dark:text-white min-w-0 flex-shrink-0">
                            {column.name}
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md font-mono border border-blue-200 dark:border-blue-700">
                            {column.type}
                          </span>
                          {column.primaryKey && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md font-medium border border-yellow-200 dark:border-yellow-700">
                              PK
                            </span>
                          )}
                          {!column.nullable && !column.primaryKey && (
                            <span className="w-2 h-2 bg-red-500 rounded-full" title="NOT NULL"></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
      
      <DeleteConfirmationModal />
     <CreateTableModal
       isOpen={showCreateModal}
       onClose={() => setShowCreateModal(false)}
       onCreateTable={handleCreateTable}
     />
    </>
  );
};