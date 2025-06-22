// news/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/authContext';
import { Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../lib/dataContext';

export default function NewsPage() {
  const { user } = useAuth();
  const { getData, deleteItem } = useData();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchNews = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const cityKey = localStorage.getItem('selectedCity') || '';
        const newsData = await getData('news', cityKey);
        setNews(newsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [user, getData]);

  const handleDelete = async (id) => {
    try {
      const cityKey = localStorage.getItem('selectedCity') || '';
      await deleteItem('news', id, cityKey);
      setNews((prev) => prev.filter((item) => item.id !== id));
      
      // Проверяем, нужно ли перейти на предыдущую страницу после удаления
      const newTotalItems = news.length - 1;
      const maxPage = Math.ceil(newTotalItems / itemsPerPage);
      if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Вычисляем данные для пагинации
  const totalPages = Math.ceil(news.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = news.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
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

  // Генерируем номера страниц для отображения
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
      {/* Информация о количестве записей и текущей странице */}
      {news.length > 0 && (
        <div className="flex justify-between items-center text-sm text-light-text-secondary dark:text-dark-text-secondary font-mmedium">
          <span>
            Показано {startIndex + 1}-{Math.min(endIndex, news.length)} из {news.length} записей
          </span>
          <span>
            Страница {currentPage} из {totalPages}
          </span>
        </div>
      )}

      {/* Список новостей */}
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
                {item.title?.ru || 'Без названия'}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full font-msemibold ${
                item.status === 'published' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
              }`}>
                {item.status === 'published' ? 'Опубликовано' : 'Черновик'}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3 font-mmedium">
              <span className="mr-3">
                Категория: {item.categoryName || 'Без категории'}
              </span>
              <span>
                Дата: {item.createdAt?.toDate().toLocaleDateString('ru-RU') || 'не указана'}
              </span>
            </div>
            
            <p className="text-sm text-light-text-primary dark:text-dark-text-primary mb-4 flex-grow font-mregular">
              {item.shortDescription?.ru || 'Нет описания'}
            </p>
            
            <div className="flex justify-end space-x-2">
              <Link 
                href={`/dashboard/news/${item.id}`}
                className="p-2 rounded-md hover:bg-light-border dark:hover:bg-dark-border transition-colors font-mmedium"
                title="Просмотреть"
              >
                <Eye size={16} />
              </Link>
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
      
      {/* Пагинация */}
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