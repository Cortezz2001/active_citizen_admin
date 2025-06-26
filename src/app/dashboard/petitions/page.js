'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/authContext';
import { useData } from '../../lib/dataContext';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getDocs, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { searchPetitions, filterPetitions } from './petitionsService';
import { Pencil, Trash2, ChevronLeft, ChevronRight, Search, Filter, RefreshCw, X, ChevronDown } from 'lucide-react';

export default function PetitionsPage() {
  const { user } = useAuth();
  const { getData, deleteItem, refreshData } = useData();
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    categoryId: 'all',
    dateFrom: '',
    dateTo: '',
    sortOrder: 'newest',
  });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const itemsPerPage = 5;

  // Fetch categories for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'petitions_categories')); // Assuming same categories as surveys
        const categoriesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name?.ru || 'Без названия',
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
      await refreshData('petitions', cityKey);
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
    setFilters((prev) => ({ ...prev, [name]: value }));
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
      sortOrder: 'newest',
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
      case 'all':
        return 'Все';
      case 'Published':
        return 'Опубликовано';
      case 'In progress':
        return 'В процессе';
      case 'Rejected':
        return 'Отклонено';
      case 'Completed':
        return 'Завершено';
      default:
        return status;
    }
  };

  const getSortDisplayName = (sortOrder) => {
    switch (sortOrder) {
      case 'newest':
        return 'Сначала новые';
      case 'oldest':
        return 'Сначала старые';
      default:
        return sortOrder;
    }
  };

  // Get filter parameters from URL
  const filterParams = useMemo(
    () => ({
      status: searchParams.get('status') || 'all',
      categoryId: searchParams.get('categoryId') || 'all',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      sortOrder: searchParams.get('sortOrder') || 'newest',
    }),
    [searchParams]
  );

  useEffect(() => {
    const fetchPetitions = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const cityKey = localStorage.getItem('selectedCity') || '';
        const petitionData = await getData('petitions', cityKey);
        setPetitions(petitionData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPetitions();
  }, [user, getData]);

  // Filter and sort petitions based on search query and filter parameters
  const filteredPetitions = useMemo(() => {
    let filtered = searchPetitions(petitions, searchQuery);
    filtered = filterPetitions(filtered, filterParams);

    // Apply sorting
    return filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate() || new Date(0);
      const dateB = b.createdAt?.toDate() || new Date(0);
      return filterParams.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    }) || [];
  }, [petitions, searchQuery, filterParams]);

  // Reset page when filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterParams]);

  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      const cityKey = localStorage.getItem('selectedCity') || '';
      await deleteItem('petitions', itemToDelete, cityKey);

      // Create admin log entry
      await addDoc(collection(firestore, 'admin_logs'), {
        action: 'delete',
        collection: 'petitions',
        documentId: itemToDelete,
        timestamp: serverTimestamp(),
        userId: user?.uid || 'unknown',
      });

      setPetitions((prev) => prev.filter((item) => item.id !== itemToDelete));

      // Adjust page if necessary after deletion
      const newTotalItems = filteredPetitions.length - 1;
      const maxPage = Math.max(1, Math.ceil(newTotalItems / itemsPerPage));
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredPetitions.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPetitions = filteredPetitions.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let start = Math.max(1, currentPage - halfVisible);
      let end = Math.min(totalPages, currentPage + halfVisible);

      if (end - start + 1 < maxVisiblePages) {
        if (start === 1) {
          end = Math.min(totalPages, start + maxVisiblePages - 1);
        } else {
          start = Math.max(1, end - maxVisiblePages + 1);
        }
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen font-mregular">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 dark:border-dark-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 font-mregular">
        Ошибка загрузки петиций: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mregular">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-mbold">Петиции</h1>
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
                {filters.status !== 'all' && `Статус: ${getStatusDisplayName(filters.status)}`}
                {filters.status !== 'all' && (filters.categoryId !== 'all' || filters.dateFrom || filters.dateTo || filters.sortOrder !== 'newest') && ', '}
                {filters.categoryId !== 'all' &&
                  `Категория: ${categories.find((c) => c.id === filters.categoryId)?.name || 'Unknown'}`}
                {(filters.status !== 'all' || filters.categoryId !== 'all') && (filters.dateFrom || filters.dateTo || filters.sortOrder !== 'newest') && ', '}
                {(filters.dateFrom || filters.dateTo) && `Дата: ${filters.dateFrom || '∞'} - ${filters.dateTo || '∞'}`}
                {(filters.dateFrom || filters.dateTo) && filters.sortOrder !== 'newest' && ', '}
                {filters.sortOrder !== 'newest' && `Сортировка: ${filters.sortOrder === 'oldest' ? 'Сначала старые' : 'Сначала новые'}`}
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-4">
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
          className="ml-4 px-4 py-2 rounded-md font-msemibold transition-colors bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:bg-light-border dark:hover:bg-dark-border"
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
                    <ChevronDown size={16} className={`ml-2 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg z-50">
                      <button
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, status: 'all' }));
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${
                          filters.status === 'all' ? 'bg-light-border dark:bg-dark-border' : ''
                        }`}
                      >
                        Все
                      </button>
                      <button
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, status: 'Published' }));
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${
                          filters.status === 'Published' ? 'bg-light-border dark:bg-dark-border' : ''
                        }`}
                      >
                        Опубликовано
                      </button>
                      <button
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, status: 'In progress' }));
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${
                          filters.status === 'In progress' ? 'bg-light-border dark:bg-dark-border' : ''
                        }`}
                      >
                        В процессе
                      </button>
                      <button
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, status: 'Rejected' }));
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${
                          filters.status === 'Rejected' ? 'bg-light-border dark:bg-dark-border' : ''
                        }`}
                      >
                        Отклонено
                      </button>
                      <button
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, status: 'Completed' }));
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${
                          filters.status === 'Completed' ? 'bg-light-border dark:bg-dark-border' : ''
                        }`}
                      >
                        Завершено
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
                    <span>{filters.categoryId === 'all' ? 'Все' : categories.find((c) => c.id === filters.categoryId)?.name || 'Неизвестно'}</span>
                    <ChevronDown size={16} className={`ml-2 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                      <button
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, categoryId: 'all' }));
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${
                          filters.categoryId === 'all' ? 'bg-light-border dark:bg-dark-border' : ''
                        }`}
                      >
                        Все
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setFilters((prev) => ({ ...prev, categoryId: category.id }));
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${
                            filters.categoryId === category.id ? 'bg-light-border dark:bg-dark-border' : ''
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date Range Filter */}
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
                    <ChevronDown size={16} className={`ml-2 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg z-50">
                      <button
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, sortOrder: 'newest' }));
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${
                          filters.sortOrder === 'newest' ? 'bg-light-border dark:bg-dark-border' : ''
                        }`}
                      >
                        Сначала новые
                      </button>
                      <button
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, sortOrder: 'oldest' }));
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border ${
                          filters.sortOrder === 'oldest' ? 'bg-light-border dark:bg-dark-border' : ''
                        }`}
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-light-background/90 dark:bg-dark-background/90 flex items-center justify-center z-50">
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-mbold">Подтверждение удаления</h3>
              <button
                onClick={handleDeleteCancel}
                className="text-light-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary"
                disabled={isDeleting}
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-light-text-primary dark:text-dark-text-primary mb-6 font-mregular">
              Вы уверены, что хотите удалить эту петицию? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="px-4 py-2 rounded-md font-msemibold transition-colors bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-md font-msemibold transition-colors bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                    Удаление...
                  </>
                ) : (
                  'Удалить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredPetitions.length > 0 && (
        <div className="flex justify-between items-center text-sm text-light-text-secondary dark:text-dark-text-secondary font-mmedium">
          <span className="font-mregular">
            {searchQuery || filterParams.status !== 'all' || filterParams.categoryId !== 'all' || filterParams.dateFrom || filterParams.dateTo || filterParams.sortOrder !== 'newest' ? (
              <>
                Найдено {filteredPetitions.length} из {petitions.length} записей
                {filteredPetitions.length > itemsPerPage && (
                  <span className="ml-2">
                    (показано {startIndex + 1}-{Math.min(endIndex, filteredPetitions.length)})
                  </span>
                )}
              </>
            ) : (
              <>
                Показано {startIndex + 1}-{Math.min(endIndex, filteredPetitions.length)} из {filteredPetitions.length} записей
              </>
            )}
          </span>
          {totalPages > 1 && (
            <span>
              Страница {currentPage} из {totalPages}
            </span>
          )}
        </div>
      )}

      {currentPetitions.map((item) => (
        <div
          key={item.id}
          className="flex flex-col rounded-lg shadow-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border overflow-hidden"
        >
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-msemibold">
                <span dangerouslySetInnerHTML={{ __html: highlightText(item.title?.ru || 'Без названия', searchQuery) }} />
              </h3>
              <span
                className={`px-2 py-1 text-xs rounded-full font-msemibold whitespace-nowrap ml-2 ${
                  item.status === 'Published'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    : item.status === 'In progress'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                    : item.status === 'Rejected'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                }`}
              >
                {getStatusDisplayName(item.status)}
              </span>
            </div>

            <div className="flex items-center text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3 font-mmedium">
              <span className="mr-2">
                Категория:{' '}
                <span dangerouslySetInnerHTML={{ __html: highlightText(item.categoryName || 'Без категории', searchQuery) }} />
              </span>
              <span>Дата создания: {item.createdAt?.toDate().toLocaleDateString('ru-RU') || 'не указана'}</span>
            </div>

            <p className="text-sm text-light-text-primary dark:text-dark-text-primary mb-2 flex-grow font-mregular">
              <span dangerouslySetInnerHTML={{ __html: highlightText(item.description?.ru || 'Нет описания', searchQuery) }} />
            </p>

            <p className="text-sm text-light-text-primary dark:text-dark-text-primary mb-2 font-mregular">
              <strong>Проблема:</strong>{' '}
              <span dangerouslySetInnerHTML={{ __html: highlightText(item.problem?.ru || 'Нет проблемы', searchQuery) }} />
            </p>

            <p className="text-sm text-light-text-primary dark:text-dark-text-primary mb-2 font-mregular">
              <strong>Решение:</strong>{' '}
              <span dangerouslySetInnerHTML={{ __html: highlightText(item.solution?.ru || 'Нет решения', searchQuery) }} />
            </p>

            <p className="text-sm text-light-text-primary dark:text-dark-text-primary mb-4 font-mregular">
              <strong>Подписи:</strong> {item.totalSignatures} / {item.targetSignatures}
            </p>

            <div className="flex justify-end space-x-2">
              <Link
                href={`/dashboard/petitions/edit/${item.id}`}
                className="p-2 rounded-md hover:bg-light-border dark:hover:bg-dark-border transition-colors font-mmedium"
                title="Редактировать"
              >
                <Pencil size={16} />
              </Link>
              {/* <button
                onClick={() => handleDeleteClick(item.id)}
                className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-500 dark:text-red-300 font-mmedium"
                title="Удалить"
              >
                <Trash2 size={16} />
              </button> */}
            </div>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <button
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className={`flex items-center px-3 py-2 rounded-md font-mmedium transition-colors ${
              currentPage === 1
                ? 'text-light-text-secondary dark:text-dark-text-secondary cursor-not-allowed'
                : 'text-light-text-primary dark:text-dark-text-primary hover:bg-light-border dark:hover:bg-dark-border'
            }`}
          >
            <ChevronLeft size={16} className="mr-1" />
            Назад
          </button>

          <div className="flex space-x-1">
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`px-3 py-2 rounded-md font-mmedium transition-colors ${
                  currentPage === pageNum
                    ? 'bg-primary text-white dark:bg-dark-primary'
                    : 'text-light-text-primary dark:text-dark-text-primary hover:bg-light-border dark:hover:bg-dark-border'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className={`flex items-center px-3 py-2 rounded-md font-mmedium transition-colors ${
              currentPage === totalPages
                ? 'text-light-text-secondary dark:text-dark-text-secondary cursor-not-allowed'
                : 'text-light-text-primary dark:text-dark-text-primary hover:bg-light-border dark:hover:bg-dark-border'
            }`}
          >
            Далее
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      )}

      {(searchQuery || filterParams.status !== 'all' || filterParams.categoryId !== 'all' || filterParams.dateFrom || filterParams.dateTo || filterParams.sortOrder !== 'newest') &&
        filteredPetitions.length === 0 &&
        petitions.length > 0 && (
          <div className="text-center py-10 font-mregular">
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
              По текущим фильтрам ничего не найдено
            </p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Попробуйте изменить поисковый запрос или очистить фильтры
            </p>
          </div>
        )}

      {petitions.length === 0 && (
        <div className="text-center py-10 font-mregular">
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Нет петиций для отображения</p>
        </div>
      )}
    </div>
  );
}