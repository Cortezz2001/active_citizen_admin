'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Plus, X, ChevronDown, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useData } from '../../lib/dataContext';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getDocs, collection } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';

export default function NewsLayout({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    categoryId: 'all',
    dateFrom: '',
    dateTo: '',
    sortOrder: 'newest'
  });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const { refreshData } = useData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Fetch categories for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'news_categories'));
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name?.ru || 'Без названия'
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Initialize search query and filters from URL parameters
  useEffect(() => {
    const query = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const categoryId = searchParams.get('categoryId') || 'all';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const sortOrder = searchParams.get('sortOrder') || 'newest';
    
    setSearchQuery(query);
    setIsSearchActive(!!query);
    setFilters({ status, categoryId, dateFrom, dateTo, sortOrder });
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
    setIsFilterModalOpen(true);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    updateSearchParams({ ...filters, search: query });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateSearchParams({ ...filters, search: searchQuery });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    updateSearchParams({ ...filters, search: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    updateSearchParams({ ...filters, search: searchQuery });
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    const newFilters = {
      status: 'all',
      categoryId: 'all',
      dateFrom: '',
      dateTo: '',
      sortOrder: 'newest'
    };
    setFilters(newFilters);
    updateSearchParams({ ...newFilters, search: searchQuery });
    setIsFilterModalOpen(false);
  };

  const updateSearchParams = ({ search, status, categoryId, dateFrom, dateTo, sortOrder }) => {
    const params = new URLSearchParams(searchParams);
    
    if (search?.trim()) {
      params.set('search', search.trim());
      setIsSearchActive(true);
    } else {
      params.delete('search');
      setIsSearchActive(false);
    }

    if (status !== 'all') params.set('status', status);
    else params.delete('status');

    if (categoryId !== 'all') params.set('categoryId', categoryId);
    else params.delete('categoryId');

    if (dateFrom) params.set('dateFrom', dateFrom);
    else params.delete('dateFrom');

    if (dateTo) params.set('dateTo', dateTo);
    else params.delete('dateTo');

    if (sortOrder !== 'newest') params.set('sortOrder', sortOrder);
    else params.delete('sortOrder');

    router.replace(`${pathname}?${params.toString()}`);
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'all': return 'Все';
      case 'published': return 'Опубликовано';
      case 'draft': return 'Черновик';
      default: return status;
    }
  };

  const getSortDisplayName = (sortOrder) => {
    switch (sortOrder) {
      case 'newest': return 'Сначала новые';
      case 'oldest': return 'Сначала старые';
      default: return sortOrder;
    }
  };

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary shadow-md">
      <div className="max-w-7xl mx-auto rounded-lg border border-light-border dark:border-dark-border p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-mbold">Новости</h1>
            {isSearchActive && (
              <div className="ml-4 flex items-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <span className="mr-2 font-mregular">Поиск:</span>
                <span className="px-2 py-1 bg-primary/10 dark:bg-dark-primary/10 rounded-md font-sm">
                  "{searchQuery}"
                </span>
              </div>
            )}
            {(filters.status !== 'all' || filters.categoryId !== 'all' || filters.dateFrom || filters.dateTo || filters.sortOrder !== 'newest') && (
              <div className="ml-4 flex items-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <span className="mr-2 font-mregular">Фильтры:</span>
                <span className="px-2 py-1 bg-primary/10 dark:bg-dark-primary/10 rounded-md font-mregular">
                  {filters.status !== 'all' && `Статус: ${filters.status === 'published' ? 'Опубликовано' : 'Черновик'}`}
                  {filters.status !== 'all' && (filters.categoryId !== 'all' || filters.dateFrom || filters.dateTo || filters.sortOrder !== 'newest') && ', '}
                  {filters.categoryId !== 'all' && `Категория: ${categories.find(c => c.id === filters.categoryId)?.name || 'Unknown'}`}
                  {(filters.status !== 'all' || filters.categoryId !== 'all') && (filters.dateFrom || filters.dateTo || filters.sortOrder !== 'newest') && ', '}
                  {(filters.dateFrom || filters.dateTo) && `Дата: ${filters.dateFrom || '∞'} - ${filters.dateTo || '∞'}`}
                  {(filters.dateFrom || filters.dateTo) && filters.sortOrder !== 'newest' && ', '}
                  {filters.sortOrder !== 'newest' && `Сортировка: ${filters.sortOrder === 'oldest' ? 'Сначала старые' : 'Сначала новые'}`}
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

        {/* Filter Modal */}
        {isFilterModalOpen && (
          <div className="fixed inset-0 bg-light-background/90 dark:bg-dark-background/90 flex items-center justify-center z-50">
            <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-mbold">Фильтры</h3>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="text-light-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status Filter - Custom Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-1">Статус:</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular hover:bg-light-border dark:hover:bg-dark-border"
                    >
                      <span>{getStatusDisplayName(filters.status)}</span>
                      <ChevronDown 
                        size={16} 
                        className={`ml-2 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    
                    {isStatusDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg z-50">
                        <button
                          onClick={() => {
                            setFilters(prev => ({ ...prev, status: 'all' }));
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${filters.status === 'all' ? 'bg-light-border dark:bg-dark-border' : ''}`}
                        >
                          Все
                        </button>
                        <button
                          onClick={() => {
                            setFilters(prev => ({ ...prev, status: 'published' }));
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${filters.status === 'published' ? 'bg-light-border dark:bg-dark-border' : ''}`}
                        >
                          Опубликовано
                        </button>
                        <button
                          onClick={() => {
                            setFilters(prev => ({ ...prev, status: 'draft' }));
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${filters.status === 'draft' ? 'bg-light-border dark:bg-dark-border' : ''}`}
                        >
                          Черновик
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Filter - Custom Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-1">Категория:</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular hover:bg-light-border dark:hover:bg-dark-border"
                    >
                      <span>
                        {filters.categoryId === 'all' 
                          ? 'Все' 
                          : categories.find(c => c.id === filters.categoryId)?.name || 'Неизвестно'}
                      </span>
                      <ChevronDown 
                        size={16} 
                        className={`ml-2 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    
                    {isCategoryDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                        <button
                          onClick={() => {
                            setFilters(prev => ({ ...prev, categoryId: 'all' }));
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${filters.categoryId === 'all' ? 'bg-light-border dark:bg-dark-border' : ''}`}
                        >
                          Все
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              setFilters(prev => ({ ...prev, categoryId: category.id }));
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${filters.categoryId === category.id ? 'bg-light-border dark:bg-dark-border' : ''}`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Range Filter (остается без изменений) */}
                <div>
                  <label className="block text-sm font-medium mb-1">Дата:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      name="dateFrom"
                      value={filters.dateFrom}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
                      placeholder="From"
                    />
                    <span className="mx-2">–</span>
                    <input
                      type="date"
                      name="dateTo"
                      value={filters.dateTo}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
                      placeholder="To"
                    />
                  </div>
                </div>

                {/* Sort Order Filter - Custom Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-1">Сортировка:</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular hover:bg-light-border dark:hover:bg-dark-border"
                    >
                      <span>{getSortDisplayName(filters.sortOrder)}</span>
                      <ChevronDown 
                        size={16} 
                        className={`ml-2 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    
                    {isSortDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg z-50">
                        <button
                          onClick={() => {
                            setFilters(prev => ({ ...prev, sortOrder: 'newest' }));
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${filters.sortOrder === 'newest' ? 'bg-light-border dark:bg-dark-border' : ''}`}
                        >
                          Сначала новые
                        </button>
                        <button
                          onClick={() => {
                            setFilters(prev => ({ ...prev, sortOrder: 'oldest' }));
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${filters.sortOrder === 'oldest' ? 'bg-light-border dark:bg-dark-border' : ''}`}
                        >
                          Сначала старые
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-md font-msemibold transition-colors bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Очистить
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-4 py-2 rounded-md font-msemibold transition-colors bg-primary hover:bg-[#0055c3] text-white dark:bg-dark-primary dark:hover:bg-blue-600"
                >
                  Применить
                </button>
              </div>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}