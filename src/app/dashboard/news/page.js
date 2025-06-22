// news/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/authContext';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { useData } from '../../lib/dataContext';

export default function NewsPage() {
  const { user } = useAuth();
  const { getData, deleteItem } = useData();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    } catch (error) {
      setError(error.message);
    }
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
      {news.map((item) => (
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