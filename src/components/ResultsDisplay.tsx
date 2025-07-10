import React, { useState } from 'react';
import { Download, Copy, Table, BarChart3, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface QueryResult {
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTime: number;
}

interface ResultsDisplayProps {
  results: QueryResult | null;
  error: string | null;
  isExecuting: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  error,
  isExecuting
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'json' | 'raw'>('table');
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [jsonExpanded, setJsonExpanded] = useState<Set<number>>(new Set());

  const copyToClipboard = async () => {
    if (!results) return;
    
    let text = '';
    if (viewMode === 'table') {
      text = results.values.map(row => row.join('\t')).join('\n');
    } else if (viewMode === 'json') {
      // Copy paginated JSON data
      const paginatedResults = {
        ...results,
        values: paginatedData,
        page: currentPage,
        totalPages,
        entriesPerPage
      };
      text = JSON.stringify(paginatedResults, null, 2);
    } else {
      // Copy full raw JSON
      text = JSON.stringify(results, null, 2);
    }
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCSV = () => {
    if (!results) return;
    
    const csv = [
      results.columns.join(','),
      ...results.values.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination logic
  const totalEntries = results?.rowCount || 0;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const paginatedData = results?.values.slice(startIndex, endIndex) || [];

  // Reset to first page when results change
  React.useEffect(() => {
    setCurrentPage(1);
    setJsonExpanded(new Set());
  }, [results]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleEntriesPerPageChange = (newEntriesPerPage: number) => {
    setEntriesPerPage(newEntriesPerPage);
    setCurrentPage(1); // Reset to first page
    setJsonExpanded(new Set()); // Reset expanded state
  };

  const toggleJsonRow = (index: number) => {
    const newExpanded = new Set(jsonExpanded);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setJsonExpanded(newExpanded);
  };

  const formatJsonValue = (value: any): string => {
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    return JSON.stringify(value);
  };

  if (isExecuting) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Executing query...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-6 overflow-auto">
        <div className="bg-red-100 dark:bg-red-800/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Query Error</h3>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 dark:text-gray-400">No results to display</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Execute a query to see results here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Query Results</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              {totalEntries > 0 ? `${startIndex + 1}-${endIndex} of ${totalEntries}` : '0'} rows
            </span>
            <span>•</span>
            <span>{results.executionTime}ms</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Entries per page selector */}
          {totalEntries > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Show:</span>
              <select
                value={entriesPerPage}
                onChange={(e) => handleEntriesPerPageChange(Number(e.target.value))}
                id="entries-per-page"
                name="entriesPerPage"
                className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={totalEntries}>All</option>
              </select>
            </div>
          )}
          
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 p-1">
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md transition-all flex items-center space-x-1',
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Table size={16} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md transition-all flex items-center space-x-1',
                viewMode === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <span>JSON</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-md transition-all flex items-center space-x-1',
                viewMode === 'raw'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <span>Raw</span>
            </button>
          </div>
          
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <CheckCircle size={18} className="text-green-600" /> : <Copy size={18} />}
          </button>
          
          <button
            onClick={downloadCSV}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Download as CSV"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto min-h-0">
        {viewMode === 'table' && (
          <div className="h-full overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  {results.columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedData.map((row, rowIndex) => (
                  <tr key={startIndex + rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                      >
                        {cell === null ? (
                          <span className="text-gray-400 italic">NULL</span>
                        ) : (
                          String(cell)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {viewMode === 'json' && (
          <div className="p-6 h-full overflow-auto">
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Query Metadata</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Total Rows:</span>
                    <div className="font-mono text-blue-600 dark:text-blue-400 font-medium">{results.rowCount}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Execution Time:</span>
                    <div className="font-mono text-green-600 dark:text-green-400 font-medium">{results.executionTime}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Current Page:</span>
                    <div className="font-mono text-purple-600 dark:text-purple-400 font-medium">{currentPage}/{totalPages}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Showing:</span>
                    <div className="font-mono text-orange-600 dark:text-orange-400 font-medium">{startIndex + 1}-{endIndex}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Columns ({results.columns.length})</h4>
                <div className="flex flex-wrap gap-3">
                  {results.columns.map((column, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm font-mono border border-blue-200 dark:border-blue-700"
                    >
                      {column}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Data Rows
                  </h4>
                </div>
                <div className="max-h-96 overflow-auto">
                  {paginatedData.map((row, rowIndex) => {
                    const actualRowIndex = startIndex + rowIndex;
                    const isExpanded = jsonExpanded.has(actualRowIndex);
                    
                    return (
                      <div
                        key={actualRowIndex}
                        className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <button
                          onClick={() => toggleJsonRow(actualRowIndex)}
                          className="w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                            Row {actualRowIndex + 1}
                          </span>
                          <span className="text-gray-400">
                            {isExpanded ? '−' : '+'}
                          </span>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4">
                            <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-600 p-4">
                              <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
{`{
${results.columns.map((column, colIndex) => 
  `  "${column}": ${formatJsonValue(row[colIndex])}`
).join(',\n')}
}`}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {viewMode === 'raw' && (
          <div className="p-8 h-full overflow-auto">
            <div className="mb-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> This view shows all {results.rowCount} rows and may impact performance with large datasets.
                </p>
              </div>
            </div>
            <pre className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      {/* Pagination Controls */}
      {totalEntries > 0 && totalPages > 1 && viewMode !== 'raw' && (
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'p-2 rounded-lg transition-all duration-200',
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={clsx(
                      'px-3 py-1.5 text-sm rounded-lg transition-all duration-200',
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={clsx(
                'p-2 rounded-lg transition-all duration-200',
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};