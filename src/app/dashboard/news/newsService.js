// news/newsService.js
'use client';

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc,
  getDoc 
} from 'firebase/firestore';
import { firestore } from '../../lib/firebase';

// Получаем название категории по ID
const getCategoryName = async (categoryId) => {
  if (!categoryId) return 'Без категории';
  
  try {
    // Если это DocumentReference
    if (typeof categoryId === 'object' && categoryId.path) {
      const categoryDoc = await getDoc(categoryId);
      return categoryDoc.exists() ? categoryDoc.data().name?.ru || 'Без названия' : 'Без категории';
    }
    
    // Если это строка с ID
    if (typeof categoryId === 'string') {
      const categoryDoc = await getDoc(doc(firestore, 'news_categories', categoryId));
      return categoryDoc.exists() ? categoryDoc.data().name?.ru || 'Без названия' : 'Без категории';
    }
    
    return 'Без категории';
  } catch (error) {
    console.error('Error fetching category:', error);
    return 'Без категории';
  }
};

// Функция для поиска по новостям
export const searchNews = (newsArray, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    return newsArray;
  }

  const query = searchQuery.toLowerCase().trim();
  
  return newsArray.filter(item => {
    // Поиск по заголовку
    const titleMatch = item.title?.ru?.toLowerCase().includes(query) || 
                      item.title?.kz?.toLowerCase().includes(query) || 
                      item.title?.en?.toLowerCase().includes(query);
    
    // Поиск по краткому описанию
    const shortDescMatch = item.shortDescription?.ru?.toLowerCase().includes(query) || 
                          item.shortDescription?.kz?.toLowerCase().includes(query) || 
                          item.shortDescription?.en?.toLowerCase().includes(query);
    
    // Поиск по полному описанию
    const fullDescMatch = item.description?.ru?.toLowerCase().includes(query) || 
                         item.description?.kz?.toLowerCase().includes(query) || 
                         item.description?.en?.toLowerCase().includes(query);
    
    // Поиск по категории
    const categoryMatch = item.categoryName?.toLowerCase().includes(query);
    
    // Поиск по тегам (если есть)
    const tagsMatch = item.tags?.some(tag => 
      tag?.toLowerCase().includes(query)
    );
    
    // Поиск по статусу
    const statusMatch = (item.status === 'published' && 'опубликовано'.includes(query)) ||
                       (item.status === 'draft' && ('черновик'.includes(query) || 'драфт'.includes(query)));

    return titleMatch || shortDescMatch || fullDescMatch || categoryMatch || tagsMatch || statusMatch;
  });
};

// Функция для фильтрации новостей с дополнительными параметрами
export const filterNews = (newsArray, filters = {}) => {
  let filtered = [...newsArray];

  // Фильтр по статусу
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(item => item.status === filters.status);
  }

  // Фильтр по категории
  if (filters.categoryId && filters.categoryId !== 'all') {
    filtered = filtered.filter(item => {
      if (typeof item.categoryId === 'object' && item.categoryId.id) {
        return item.categoryId.id === filters.categoryId;
      }
      return item.categoryId === filters.categoryId;
    });
  }

  // Фильтр по дате
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter(item => {
      const itemDate = item.createdAt?.toDate() || new Date(0);
      return itemDate >= fromDate;
    });
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999); // Конец дня
    filtered = filtered.filter(item => {
      const itemDate = item.createdAt?.toDate() || new Date(0);
      return itemDate <= toDate;
    });
  }

  return filtered;
};

export const getDataByCity = async (cityKey) => {
  try {
    const q = query(
      collection(firestore, 'news'),
      where('cityKey', '==', cityKey)
    );
    const querySnapshot = await getDocs(q);
    const news = [];

    for (const doc of querySnapshot.docs) {
      const newsData = doc.data();
      const categoryName = await getCategoryName(newsData.categoryId);
      news.push({
        id: doc.id,
        ...newsData,
        categoryName,
      });
    }

    news.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    return news;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

export const deleteItem = async (id) => {
  try {
    await deleteDoc(doc(firestore, 'news', id));
  } catch (error) {
    console.error('Error deleting news:', error);
    throw error;
  }
};