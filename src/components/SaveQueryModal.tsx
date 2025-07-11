import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Save } from 'lucide-react';
import { clsx } from 'clsx';

interface SaveQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => void;
}

export const SaveQueryModal: React.FC<SaveQueryModalProps> = ({ isOpen, onClose, onSave }) => {
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Save className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Save Query
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add a description for your query (optional)
              </p>
            </div>
          </div>
          <form
            onSubmit={e => {
              e.preventDefault();
              onSave(description.trim());
              setDescription('');
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter query description"
                id="query-description"
                name="queryDescription"
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setDescription('');
                  onClose();
                }}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={clsx(
                  'px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg',
                  'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105'
                )}
              >
                Save Query
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
