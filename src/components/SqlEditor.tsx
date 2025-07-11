import React, { useRef } from 'react';
import { Play, Save, History, Code2 } from 'lucide-react';
import { clsx } from 'clsx';

interface SqlEditorProps {
  query: string;
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  onSave: () => void;
  onLoadHistory: () => void;
  theme?: 'light' | 'dark'; // Optional, not used
}

export const SqlEditor: React.FC<SqlEditorProps> = ({
  query,
  onQueryChange,
  onExecute,
  isExecuting,
  onSave,
  onLoadHistory,
  // theme
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onExecute();
      return;
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onExecute();
      return;
    }
    
    // Handle tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Insert tab character
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onQueryChange(newValue);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
            <Code2 className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Manual SQL Editor
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Write and execute custom SQL queries
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onLoadHistory}
            className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg backdrop-blur-sm"
            title="Query History"
          >
            <History size={18} />
          </button>
          <button
            onClick={onSave}
            className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg backdrop-blur-sm"
            title="Save Query"
          >
            <Save size={18} />
          </button>
          <button
            onClick={onExecute}
            disabled={isExecuting || !query.trim()}
            className={clsx(
              'flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg',
              isExecuting || !query.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105'
            )}
          >
            <Play size={16} />
            <span>{isExecuting ? 'Executing...' : 'Execute'}</span>
          </button>
        </div>
      </div>
      
      {/* Editor - Using textarea instead of Monaco for faster loading */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          id="sql-editor"
          name="sqlQuery"
          className={clsx(
            'w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
            'placeholder-gray-500 dark:placeholder-gray-400'
          )}
          placeholder="-- Write your SQL query here
SELECT * FROM table_name LIMIT 10;"
          spellCheck={false}
          style={{
            paddingLeft: `${Math.max(2, query.split('\n').length.toString().length) * 8 + 24}px`
          }}
        />
        
        {/* Line numbers overlay */}
        <div className="absolute left-0 top-0 p-4 pointer-events-none select-none">
          <div className="font-mono text-sm text-gray-400 dark:text-gray-600 leading-5">
            {query.split('\n').map((_, index) => (
              <div key={index} className="h-5">
                {index + 1}
              </div>
            ))}
          </div>
        </div>
        
      </div>
      
    </div>
  );
};