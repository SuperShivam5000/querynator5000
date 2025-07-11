import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Database, Plus, Trash2, ChevronDown, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface DatabaseInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastModified: number;
}

interface DatabaseSelectorProps {
  databases: DatabaseInfo[];
  currentDbId: string;
  onCreateDatabase: (name: string, description?: string) => void;
  onSwitchDatabase: (dbId: string) => void;
  onDeleteDatabase: (dbId: string) => void;
  showCreateForm?: boolean;
  onCloseCreateForm?: () => void;
  onOpenCreateForm?: () => void;
}

export const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
  databases,
  currentDbId,
  onCreateDatabase,
  onSwitchDatabase,
  onDeleteDatabase,
  showCreateForm = false,
  onCloseCreateForm = () => {},
  onOpenCreateForm = () => {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [newDbName, setNewDbName] = useState('');
  const [newDbDescription, setNewDbDescription] = useState('');

  const currentDb = databases.find(db => db.id === currentDbId);

  const handleCreateDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDbName.trim()) {
      onCreateDatabase(newDbName.trim(), newDbDescription.trim() || undefined);
      setNewDbName('');
      setNewDbDescription('');
      onCloseCreateForm();
      setIsOpen(false);
    }
  };

  const handleCloseCreateForm = () => {
    onCloseCreateForm();
    setNewDbName('');
    setNewDbDescription('');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleDeleteClick = (dbId: string) => {
    setShowDeleteModal(dbId);
  };

  const handleConfirmDelete = () => {
    if (showDeleteModal) {
      onDeleteDatabase(showDeleteModal);
      setShowDeleteModal(null);
    }
  };

  return (
    <>
      <div className="relative">
        <div className="flex items-center space-x-2">
          {/* Create Database Button */}
          <button
            onClick={onOpenCreateForm}
            className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            title="Create New Database"
          >
            <Plus size={18} />
          </button>

          {/* Database Selector */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between min-w-48 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Database className="text-blue-600 dark:text-blue-400" size={20} />
                <Sparkles className="absolute -top-1 -right-1 text-purple-500" size={10} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentDb?.name || 'Select Database'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {databases.length} database{databases.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            <ChevronDown 
              className={clsx(
                'text-gray-400 transition-transform duration-200',
                isOpen && 'transform rotate-180'
              )} 
              size={16} 
            />
          </button>
        </div>

        {/* Database Dropdown */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[9999] max-h-80 overflow-y-auto backdrop-blur-lg">
            <div className="p-2">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Available Databases</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Select a database to work with</p>
              </div>
              
              {databases.map((db) => (
                <div
                  key={db.id}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-lg transition-colors',
                    db.id === currentDbId
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <button
                    onClick={() => {
                      onSwitchDatabase(db.id);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Database className="text-blue-600 dark:text-blue-400" size={16} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{db.name}</p>
                        {db.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{db.description}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Created {formatDate(db.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {db.id !== 'default' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(db.id);
                      }}
                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Delete Database"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Database Modal */}
      {showCreateForm && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                  <Database className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Create New Database
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Set up a new database workspace
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleCreateDatabase} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Database Name *
                  </label>
                  <input
                    type="text"
                    value={newDbName}
                    onChange={(e) => setNewDbName(e.target.value)}
                    placeholder="Enter database name"
                    id="new-database-name"
                    name="databaseName"
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newDbDescription}
                    onChange={(e) => setNewDbDescription(e.target.value)}
                    placeholder="Enter database description"
                    id="new-database-description"
                    name="databaseDescription"
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseCreateForm}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newDbName.trim()}
                    className={clsx(
                      'px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg',
                      newDbName.trim()
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-xl hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    Create Database
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Delete Database Modal */}
      {showDeleteModal && (() => {
        const dbToDelete = databases.find(db => db.id === showDeleteModal);
        if (!dbToDelete) return null;

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
                      Confirm Database Deletion
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the database{' '}
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      "{dbToDelete.name}"
                    </span>
                    ? All tables, data, and saved queries will be permanently lost.
                  </p>
                  {dbToDelete.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Description: {dbToDelete.description}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
                  >
                    Delete Database
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </>
  );
};