'use client';

import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';

// Fetch category name by ID
const getCategoryName = async (categoryId) => {
  if (!categoryId) {
    console.warn('getCategoryName: No categoryId provided');
    return 'Без категории';
  }

  try {
    // If categoryId is a Firestore document reference (object with path)
    if (typeof categoryId === 'object' && categoryId.path) {
      console.log(`getCategoryName: Fetching category reference with path: ${categoryId.path}`);
      const categoryDoc = await getDoc(categoryId);
      if (categoryDoc.exists()) {
        const name = categoryDoc.data().name?.ru || 'Без названия';
        console.log(`getCategoryName: Found category with name: ${name}`);
        return name;
      }
      console.warn(`getCategoryName: Category reference ${categoryId.path} does not exist`);
      return 'Без категории';
    }

    // If categoryId is a string, ensure it's a valid document ID
    if (typeof categoryId === 'string') {
      let docId = categoryId;
      if (categoryId.includes('/')) {
        console.warn(`getCategoryName: categoryId contains path (${categoryId}), extracting document ID`);
        docId = categoryId.split('/').pop();
      }
      console.log(`getCategoryName: Fetching category with docId: ${docId}`);
      const categoryDoc = await getDoc(doc(firestore, 'petitions_categories', docId));
      if (categoryDoc.exists()) {
        const categoryData = categoryDoc.data();
        const name = categoryData.name?.ru || categoryData.name || 'Без названия';
        console.log(`getCategoryName: Found category with data:`, categoryData);
        return name;
      }
      console.warn(`getCategoryName: Category document ${docId} does not exist in petitions_categories`);
      return 'Без категории';
    }

    console.warn('getCategoryName: Invalid categoryId type:', typeof categoryId);
    return 'Без категории';
  } catch (error) {
    console.error('getCategoryName: Error fetching category:', error);
    return 'Без категории';
  }
};

// Search petitions
export const searchPetitions = (petitionsArray, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    return petitionsArray;
  }

  const query = searchQuery.toLowerCase().trim();

  return petitionsArray.filter((item) => {
    const titleMatch =
      item.title?.ru?.toLowerCase().includes(query) ||
      item.title?.kz?.toLowerCase().includes(query) ||
      item.title?.en?.toLowerCase().includes(query);

    const descMatch =
      item.description?.ru?.toLowerCase().includes(query) ||
      item.description?.kz?.toLowerCase().includes(query) ||
      item.description?.en?.toLowerCase().includes(query);

    const problemMatch =
      item.problem?.ru?.toLowerCase().includes(query) ||
      item.problem?.kz?.toLowerCase().includes(query) ||
      item.problem?.en?.toLowerCase().includes(query);

    const solutionMatch =
      item.solution?.ru?.toLowerCase().includes(query) ||
      item.solution?.kz?.toLowerCase().includes(query) ||
      item.solution?.en?.toLowerCase().includes(query);

    const categoryMatch = item.categoryName?.toLowerCase().includes(query);

    const statusMatch =
      (item.status === 'Published' && 'опубликовано'.includes(query)) ||
      (item.status === 'In progress' && ('в процессе'.includes(query) || 'in progress'.includes(query))) ||
      (item.status === 'Rejected' && ('отклонено'.includes(query) || 'rejected'.includes(query))) ||
      (item.status === 'Completed' && ('завершено'.includes(query) || 'completed'.includes(query)));

    return titleMatch || descMatch || problemMatch || solutionMatch || categoryMatch || statusMatch;
  });
};

// Filter petitions with additional parameters
export const filterPetitions = (petitionsArray, filters = {}) => {
  let filtered = [...petitionsArray];

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter((item) => item.status === filters.status);
  } else {
    // Exclude Draft status
    filtered = filtered.filter((item) => item.status !== 'Draft');
  }

  // Filter by category
  if (filters.categoryId && filters.categoryId !== 'all') {
    filtered = filtered.filter((item) => {
      if (typeof item.categoryId === 'object' && item.categoryId.id) {
        return item.categoryId.id === filters.categoryId;
      }
      // Handle case where categoryId is a path
      const docId = typeof item.categoryId === 'string' && item.categoryId.includes('/')
        ? item.categoryId.split('/').pop()
        : item.categoryId;
      return docId === filters.categoryId;
    });
  }

  // Filter by date
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter((item) => {
      const itemDate = item.createdAt?.toDate() || new Date(0);
      return itemDate >= fromDate;
    });
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((item) => {
      const itemDate = item.createdAt?.toDate() || new Date(0);
      return itemDate <= toDate;
    });
  }

  return filtered;
};

// Fetch petitions by city
export const getDataByCity = async (cityKey) => {
  try {
    const q = query(collection(firestore, 'petitions'), where('cityKey', '==', cityKey));
    const querySnapshot = await getDocs(q);
    const petitions = [];

    for (const doc of querySnapshot.docs) {
      const petitionData = doc.data();
      if (petitionData.status !== 'Draft') {
        const categoryName = await getCategoryName(petitionData.categoryId);
        petitions.push({
          id: doc.id,
          ...petitionData,
          categoryName,
        });
      }
    }

    petitions.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    return petitions;
  } catch (error) {
    console.error('Error fetching petitions:', error);
    throw error;
  }
};

// Delete a petition by ID
export const deleteItem = async (id) => {
  try {
    await deleteDoc(doc(firestore, 'petitions', id));
  } catch (error) {
    console.error('Error deleting petition:', error);
    throw error;
  }
};