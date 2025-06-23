'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useData } from '../../lib/dataContext';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function NewsLayout({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { refreshData } = useData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Инициализация поискового запроса из URL параметров
  useEffect(() => {
    const query = searchParams.get('search') || '';
    setSearchQuery(query);
    setIsSearchActive(!!query);
  }, [searchParams]);

  const handleRefresh = async () => {
    const cityKey = localStorage.getItem('selectedCity') || 'default';
    try {
      await refreshData('news', cityKey); 
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleFilter = () => {
    // Placeholder for filter functionality
    console.log('Opening filter options...');
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    updateSearchParams(query);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateSearchParams(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    updateSearchParams('');
  };

  const updateSearchParams = (query) => {
    const params = new URLSearchParams(searchParams);
    
    if (query.trim()) {
      params.set('search', query.trim());
      setIsSearchActive(true);
    } else {
      params.delete('search');
      setIsSearchActive(false);
    }
    
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary">
      <div className="max-w-7xl mx-auto rounded-lg border border-light-border dark:border-dark-border p-6">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-mbold">Новости</h1>
            {isSearchActive && (
              <div className="ml-4 flex items-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <span className="mr-2">Поиск:</span>
                <span className="px-2 py-1 bg-primary/10 dark:bg-dark-primary/10 rounded-md font-mmedium">
                  "{searchQuery}"
                </span>

              </div>
            )}
          </div>
          <div className="flex space-x-4">
            <Link
              href="/dashboard/news/create"
              className="flex items-center px-3 py-2 rounded-md font-msemibold transition-colors bg-primary hover:bg-[#0055c3] text-white dark:bg-dark-primary dark:hover:bg-blue-600"
            >
              <Plus size={16} />
            </Link>
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 rounded-md font-msemibold transition-colors bg-primary hover:bg-[#0055c3] text-white dark:bg-dark-primary dark:hover:bg-blue-600"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Поиск"
              className="w-full px-4 py-2 pr-10 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
            />
            <button
              type={searchQuery ? 'button' : 'submit'}
              onClick={searchQuery ? clearSearch : undefined}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary transition-colors"
            >
              {searchQuery ? <X size={16} /> : <Search size={20} />}
            </button>
          </div>
          <button
            type="button"
            onClick={handleFilter}
            className="ml-4 px-4 py-2 rounded-lg font-msemibold transition-colors bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:bg-light-border dark:hover:bg-dark-border"
          >
            <Filter size={16} className="inline-block" />
          </button>
        </form>
     
        {children}
        
      </div>
    </div>
  );
}