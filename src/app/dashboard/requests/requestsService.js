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
      const categoryDoc = await getDoc(doc(firestore, 'requests_categories', categoryId));
      return categoryDoc.exists() ? categoryDoc.data().name?.ru || 'Без названия' : 'Без категории';
    }
    
    return 'Без категории';
  } catch (error) {
    console.error('Error fetching category:', error);
    return 'Без категории';
  }
};

// Search requests
export const searchRequests = (requestsArray, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    return requestsArray;
  }

  const query = searchQuery.toLowerCase().trim();
  
  return requestsArray.filter(item => {
    const titleMatch = item.title?.toLowerCase().includes(query);
    const descMatch = item.description?.toLowerCase().includes(query);
    const categoryMatch = item.categoryName?.toLowerCase().includes(query);
    const addressMatch = item.address?.formattedAddress?.toLowerCase().includes(query);
    const rejectionReasonMatch = item.rejectionReason?.toLowerCase().includes(query);
    
    const statusMatch = 
      (item.status === 'In progress' && ('в процессе'.includes(query) || 'in progress'.includes(query))) ||
      (item.status === 'Rejected' && ('отклонено'.includes(query) || 'rejected'.includes(query))) ||
      (item.status === 'Completed' && ('завершено'.includes(query) || 'completed'.includes(query)));

    return titleMatch || descMatch || categoryMatch || addressMatch || rejectionReasonMatch || statusMatch;
  });
};

// Filter requests with additional parameters
export const filterRequests = (requestsArray, filters = {}) => {
  let filtered = [...requestsArray];

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(item => item.status === filters.status);
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

// Fetch requests by city
export const getDataByCity = async (cityKey) => {
  try {
    const q = query(
      collection(firestore, 'requests'),
      where('address.cityKey', '==', cityKey)
    );
    const querySnapshot = await getDocs(q);
    const requests = [];

    for (const doc of querySnapshot.docs) {
      const requestData = doc.data();
      const categoryName = await getCategoryName(requestData.categoryId);
      requests.push({
        id: doc.id,
        title: requestData.title?.ru,
        description: requestData.description?.ru,
        categoryName,
        status: requestData.status,
        address: requestData.address,
        mediaFiles: requestData.mediaFiles,
        rejectionReason: requestData.rejectionReason?.ru,
        createdAt: requestData.createdAt,
        updatedAt: requestData.updatedAt,
        userId: requestData.userId
      });
    }

    requests.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    return requests;
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
};

// Delete a request by ID
export const deleteItem = async (id) => {
  try {
    await deleteDoc(doc(firestore, 'requests', id));
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
};