'use client';
import { useState } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';

export default function NewsLayout({ children }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = () => {
    // Placeholder for refresh functionality
    console.log('Refreshing news...');
  };

  const handleFilter = () => {
    // Placeholder for filter functionality
    console.log('Opening filter options...');
  };

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary">
      <div className="max-w-7xl p-6 mx-auto rounded-lg shadow-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-mbold">Новости</h1>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 rounded-md font-msemibold transition-colors bg-primary hover:bg-[#0055c3] text-white dark:bg-dark-primary dark:hover:bg-blue-600"
          >
            <RefreshCw size={16} className="mr-2" />
            Обновить
          </button>
        </div>
        <div className="flex items-center mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск новостей..."
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
            />
            <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
          </div>
          <button
            onClick={handleFilter}
            className="ml-4 px-4 py-2 rounded-lg font-msemibold transition-colors bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:bg-light-border dark:hover:bg-dark-border"
          >
            <Filter size={16} className="inline-block mr-2" />
            Фильтр
          </button>
        </div>
        <div className="p-6 rounded-lg shadow-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border">
          {children}
        </div>
      </div>
    </div>
  );
}