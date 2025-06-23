'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/authContext';
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../lib/dataContext';
import { searchNews, filterNews } from './newsService';
import { useSearchParams } from 'next/navigation';

export default function NewsPage() {
  const { user } = useAuth();
  const { getData, deleteItem } = useData();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const itemsPerPage = 5;

  // Get filter parameters from URL
  const searchQuery = searchParams.get('search') || '';
  const filterParams = useMemo(() => ({
    status: searchParams.get('status') || 'all',
    categoryId: searchParams.get('categoryId') || 'all',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    sortOrder: searchParams.get('sortOrder') || 'newest'
  }), [searchParams]);

  useEffect(() => {
    const fetchNews = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const cityKey = localStorage.getItem('selectedCity') || '';
        const newsData = await getData('news', cityKey);
        setNews(newsData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [user, getData]);

  // Filter and sort news based on search query and filter parameters
  const filteredNews = useMemo(() => {
    let filtered = searchNews(news, searchQuery);
    filtered = filterNews(filtered, filterParams);
    
    // Apply sorting
    return filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate() || new Date(0);
      const dateB = b.createdAt?.toDate() || new Date(0);
      return filterParams.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    }) || [];
  }, [news, searchQuery, filterParams]);

  // Reset page when filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterParams]);

  const handleDelete = async (id) => {
    try {
      const cityKey = localStorage.getItem('selectedCity') || '';
      await deleteItem('news', id, cityKey);
      setNews((prev) => prev.filter((item) => item.id !== id));
      
      // Adjust page if necessary after deletion
      const newTotalItems = filteredNews.length - 1;
      const maxPage = Math.max(1, Math.ceil(newTotalItems / itemsPerPage));
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, endIndex);

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
      <div className="flex justify-center items-center h-64 font-mregular">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 dark:border-dark-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 font-mregular">
        Ошибка загрузки новостей: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mregular">
      {filteredNews.length > 0 && (
        <div className="flex justify-between items-center text-sm text-light-text-secondary dark:text-dark-text-secondary font-mmedium">
          <span className='font-mregular'>
            {searchQuery || filterParams.status !== 'all' || filterParams.categoryId !== 'all' || filterParams.dateFrom || filterParams.dateTo || filterParams.sortOrder !== 'newest' ? (
              <>
                Найдено {filteredNews.length} из {news.length} записей
                {filteredNews.length > itemsPerPage && (
                  <span className="ml-2">
                    (показано {startIndex + 1}-{Math.min(endIndex, filteredNews.length)})
                  </span>
                )}
              </>
            ) : (
              <>
                Показано {startIndex + 1}-{Math.min(endIndex, filteredNews.length)} из {filteredNews.length} записей
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

      {currentNews.map((item) => (
        <div 
          key={item.id}
          className="flex flex-col md:flex-row rounded-lg shadow-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border overflow-hidden"
        >
          {item.imageUrl && (
            <div className="md:w-1/4 h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <img 
                src={item.imageUrl} 
                alt={item.title?.ru || 'News image'}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-msemibold">
                <span 
                  dangerouslySetInnerHTML={{
                    __html: highlightText(item.title?.ru || 'Без названия', searchQuery)
                  }} 
                />
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full font-msemibold whitespace-nowrap ml-2 ${
                item.status === 'published' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
              }`}>
                {item.status === 'published' ? 'Опубликовано' : 'Черновик'}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3 font-mmedium">
              <span className="mr-3">
                Категория:
                <span 
                  dangerouslySetInnerHTML={{
                    __html: highlightText(item.categoryName || 'Без категории', searchQuery)
                  }} 
                />
              </span>
              <span>
                Дата: {item.createdAt?.toDate().toLocaleDateString('ru-RU') || 'не указана'}
              </span>
            </div>
            
            <p className="text-sm text-light-text-primary dark:text-dark-text-primary mb-4 flex-grow font-mregular">
              <span 
                dangerouslySetInnerHTML={{
                  __html: highlightText(item.shortDescription?.ru || 'Нет описания', searchQuery)
                }} 
              />
            </p>
            
            <div className="flex justify-end space-x-2">
              <Link 
                href={`/dashboard/news/edit/${item.id}`}
                className="p-2 rounded-md hover:bg-light-border dark:hover:bg-dark-border transition-colors font-mmedium"
                title="Редактировать"
              >
                <Pencil size={16} />
              </Link>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-500 dark:text-red-300 font-mmedium"
                title="Удалить"
              >
                <Trash2 size={16} />
              </button>
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
      
      {(searchQuery || filterParams.status !== 'all' || filterParams.categoryId !== 'all' || filterParams.dateFrom || filterParams.dateTo || filterParams.sortOrder !== 'newest') && filteredNews.length === 0 && news.length > 0 && (
        <div className="text-center py-10 font-mregular">
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
            По текущим фильтрам ничего не найдено
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Попробуйте изменить поисковый запрос или очистить фильтры
          </p>
        </div>
      )}
      
      {news.length === 0 && (
        <div className="text-center py-10 font-mregular">
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Нет новостей для отображения
          </p>
        </div>
      )}
    </div>
  );
}