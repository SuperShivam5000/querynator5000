import React, { useState } from 'react';
import { History, Star, Trash2, Play, Search, X } from 'lucide-react';
import { clsx } from 'clsx';

interface SavedQuery {
  id: string;
  query: string;
  timestamp: number;
  description?: string;
  isFavorite?: boolean;
}

interface QueryHistoryProps {
  queries: SavedQuery[];
  onQuerySelect: (query: string) => void;
  onDeleteQuery: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({
  queries,
  onQuerySelect,
  onDeleteQuery,
  onToggleFavorite,
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'favorites' && query.isFavorite);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateQuery = (query: string, maxLength: number = 100) => {
    return query.length > maxLength ? query.substring(0, maxLength) + '...' : query;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <History className="text-blue-600 dark:text-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Query History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="query-search"
                name="querySearch"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 p-1">
              <button
                onClick={() => setFilter('all')}
                className={clsx(
                  'px-4 py-2 text-sm rounded-md transition-all',
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={clsx(
                  'px-4 py-2 text-sm rounded-md transition-all',
                  filter === 'favorites'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                Favorites
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {filteredQueries.length === 0 ? (
            <div className="p-8 text-center">
              <History className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No queries match your search' : 'No saved queries found'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredQueries.map((query) => (
                <div
                  key={query.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {query.description && (
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {query.description}
                        </p>
                      )}
                      <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 p-2 rounded border overflow-x-auto">
                        {truncateQuery(query.query)}
                      </pre>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatDate(query.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => onToggleFavorite(query.id)}
                        className={clsx(
                          'p-2 rounded-lg transition-colors',
                          query.isFavorite
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'
                        )}
                        title={query.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star size={16} fill={query.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => {
                          onQuerySelect(query.query);
                          onClose();
                        }}
                        className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        title="Use this query"
                      >
                        <Play size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteQuery(query.id)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Delete query"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};