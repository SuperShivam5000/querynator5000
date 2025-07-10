import React, { useState } from 'react';
import { Send, Sparkles, Loader2, Zap, Code } from 'lucide-react';
import { clsx } from 'clsx';

interface NaturalLanguageInputProps {
  onSubmit: (input: string) => void;
  isGenerating: boolean;
  lastGeneratedQuery?: string;
  placeholder?: string;
}

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  onSubmit,
  isGenerating,
  lastGeneratedQuery,
  placeholder = "Use QueryGenie to explore or manipulate your data using natural language...."
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 border-b border-white/20 dark:border-gray-700/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <Sparkles className="text-purple-600 dark:text-purple-400" size={28} />
            <Zap className="absolute -top-1 -right-1 text-yellow-500" size={14} />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI-Powered Query Generation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Describe what you want to do, and QueryGenie will create and execute the perfect SQL query
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="relative mb-4">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              id="natural-language-input"
              name="naturalLanguageQuery"
              className="w-full p-4 pr-14 border-2 border-purple-200 dark:border-purple-700/50 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none shadow-lg"
              rows={3}
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className={clsx(
                'absolute right-3 bottom-3 p-3 rounded-xl transition-all duration-200 shadow-lg',
                input.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              )}
            >
              {isGenerating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </form>

        {/* Display Last Generated Query */}
        {lastGeneratedQuery && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-purple-200 dark:border-purple-700/50 p-4 shadow-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Code className="text-purple-600 dark:text-purple-400" size={16} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generated & Executed Query:</span>
            </div>
            <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded border font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
              {lastGeneratedQuery}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};