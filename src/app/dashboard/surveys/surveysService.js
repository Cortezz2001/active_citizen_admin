'use client';

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  deleteDoc 
} from 'firebase/firestore';
import { firestore } from '../../lib/firebase';

// Fetch category name by ID
const getCategoryName = async (categoryId) => {
  if (!categoryId) return 'Без категории';
  
  try {
    if (typeof categoryId === 'object' && categoryId.path) {
      const categoryDoc = await getDoc(categoryId);
      return categoryDoc.exists() ? categoryDoc.data().name?.ru || 'Без названия' : 'Без категории';
    }
    
    if (typeof categoryId === 'string') {
      const categoryDoc = await getDoc(doc(firestore, 'surveys_categories', categoryId));
      return categoryDoc.exists() ? categoryDoc.data().name?.ru || 'Без названия' : 'Без категории';
    }
    
    return 'Без категории';
  } catch (error) {
    console.error('Error fetching category:', error);
    return 'Без категории';
  }
};

// Search surveys
export const searchSurveys = (surveysArray, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    return surveysArray;
  }

  const query = searchQuery.toLowerCase().trim();
  
  return surveysArray.filter(item => {
    const titleMatch = item.title?.ru?.toLowerCase().includes(query) || 
                      item.title?.kz?.toLowerCase().includes(query) || 
                      item.title?.en?.toLowerCase().includes(query);
    
    const descMatch = item.description?.ru?.toLowerCase().includes(query) || 
                     item.description?.kz?.toLowerCase().includes(query) || 
                     item.description?.en?.toLowerCase().includes(query);
    
    const categoryMatch = item.categoryName?.toLowerCase().includes(query);
    
    const statusMatch = 
      (item.status === 'Published' && 'опубликовано'.includes(query)) ||
      (item.status === 'In progress' && ('в процессе'.includes(query) || 'in progress'.includes(query))) ||
      (item.status === 'Rejected' && ('отклонено'.includes(query) || 'rejected'.includes(query))) ||
      (item.status === 'Completed' && ('завершено'.includes(query) || 'completed'.includes(query)));

    return titleMatch || descMatch || categoryMatch || statusMatch;
  });
};

// Filter surveys with additional parameters
export const filterSurveys = (surveysArray, filters = {}) => {
  let filtered = [...surveysArray];

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(item => item.status === filters.status);
  } else {
    // Exclude Draft status
    filtered = filtered.filter(item => item.status !== 'Draft');
  }

  // Filter by category
  if (filters.categoryId && filters.categoryId !== 'all') {
    filtered = filtered.filter(item => {
      if (typeof item.categoryId === 'object' && item.categoryId.id) {
        return item.categoryId.id === filters.categoryId;
      }
      return item.categoryId === filters.categoryId;
    });
  }

  // Filter by date
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter(item => {
      const itemDate = item.createdAt?.toDate() || new Date(0);
      return itemDate >= fromDate;
    });
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(item => {
      const itemDate = item.createdAt?.toDate() || new Date(0);
      return itemDate <= toDate;
    });
  }

  return filtered;
};

// Fetch surveys by city
export const getDataByCity = async (cityKey) => {
  try {
    const q = query(
      collection(firestore, 'surveys'),
      where('cityKey', '==', cityKey)
    );
    const querySnapshot = await getDocs(q);
    const surveys = [];

    for (const doc of querySnapshot.docs) {
      const surveyData = doc.data();
      if (surveyData.status !== 'Draft') {
        const categoryName = await getCategoryName(surveyData.categoryId);
        surveys.push({
          id: doc.id,
          ...surveyData,
          categoryName,
        });
      }
    }

    surveys.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    return surveys;
  } catch (error) {
    console.error('Error fetching surveys:', error);
    throw error;
  }
};

// Delete a survey by ID
export const deleteItem = async (id) => {
  try {
    await deleteDoc(doc(firestore, 'surveys', id));
  } catch (error) {
    console.error('Error deleting survey:', error);
    throw error;
  }
};