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