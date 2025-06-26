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
      const categoryDoc = await getDoc(doc(firestore, 'events_categories', categoryId));
      return categoryDoc.exists() ? categoryDoc.data().name?.ru || 'Без названия' : 'Без категории';
    }
    
    return 'Без категории';
  } catch (error) {
    console.error('Error fetching category:', error);
    return 'Без категории';
  }
};

// Функция для поиска по событиям
export const searchEvents = (eventsArray, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    return eventsArray;
  }

  const query = searchQuery.toLowerCase().trim();
  
  return eventsArray.filter(item => {
    // Поиск по заголовку
    const titleMatch = item.title?.ru?.toLowerCase().includes(query) || 
                      item.title?.kz?.toLowerCase().includes(query) || 
                      item.title?.en?.toLowerCase().includes(query);
    
    // Поиск по описанию
    const descriptionMatch = item.description?.ru?.toLowerCase().includes(query) || 
                           item.description?.kz?.toLowerCase().includes(query) || 
                           item.description?.en?.toLowerCase().includes(query);
    
    // Поиск по категории
    const categoryMatch = item.categoryName?.toLowerCase().includes(query);
    
    // Поиск по локации
    const locationMatch = item.location?.name?.ru?.toLowerCase().includes(query) ||
                         item.location?.name?.kz?.toLowerCase().includes(query) ||
                         item.location?.name?.en?.toLowerCase().includes(query) ||
                         item.location?.address?.ru?.toLowerCase().includes(query) ||
                         item.location?.address?.kz?.toLowerCase().includes(query) ||
                         item.location?.address?.en?.toLowerCase().includes(query);
    
    // Поиск по статусу
    const statusMatch = (item.status === 'published' && 'опубликовано'.includes(query)) ||
                       (item.status === 'draft' && ('черновик'.includes(query) || 'драфт'.includes(query)));

    return titleMatch || descriptionMatch || categoryMatch || locationMatch || statusMatch;
  });
};

// Функция для фильтрации событий с дополнительными параметрами
export const filterEvents = (eventsArray, filters = {}) => {
  let filtered = [...eventsArray];

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
      const itemDate = item.created_at?.toDate() || new Date(0);
      return itemDate >= fromDate;
    });
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999); // Конец дня
    filtered = filtered.filter(item => {
      const itemDate = item.created_at?.toDate() || new Date(0);
      return itemDate <= toDate;
    });
  }

  return filtered;
};

export const getDataByCity = async (cityKey) => {
  try {
    const q = query(
      collection(firestore, 'events'),
      where('cityKey', '==', cityKey)
    );
    const querySnapshot = await getDocs(q);
    const events = [];

    for (const doc of querySnapshot.docs) {
      const eventData = doc.data();
      const categoryName = await getCategoryName(eventData.categoryId);
      events.push({
        id: doc.id,
        ...eventData,
        categoryName,
      });
    }

    events.sort((a, b) => b.created_at?.toDate() - a.created_at?.toDate());
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const deleteItem = async (id) => {
  try {
    await deleteDoc(doc(firestore, 'events', id));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};