'use client';

import { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [cache, setCache] = useState({}); // Кэш для всех коллекций

  const getData = async (collectionName, cityKey) => {
    const cacheKey = `${collectionName}_${cityKey}`;
    if (cache[cacheKey]) {
      return cache[cacheKey]; // Возвращаем данные из кэша
    }

    try {
      // Динамический импорт сервиса для нужной коллекции
      const { getDataByCity } = await import(`../dashboard/${collectionName}/${collectionName}Service`);
      const data = await getDataByCity(cityKey);
      setCache((prev) => ({ ...prev, [cacheKey]: data }));
      return data;
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      throw error;
    }
  };

  const deleteItem = async (collectionName, id, cityKey) => {
    try {
      const { deleteItem } = await import(`../dashboard/${collectionName}/${collectionName}Service`);
      await deleteItem(id);
      const cacheKey = `${collectionName}_${cityKey}`;
      setCache((prev) => ({
        ...prev,
        [cacheKey]: prev[cacheKey]?.filter((item) => item.id !== id) || [],
      }));
    } catch (error) {
      console.error(`Error deleting item from ${collectionName}:`, error);
      throw error;
    }
  };

  const refreshData = async (collectionName, cityKey) => {
    try {
      const cacheKey = `${collectionName}_${cityKey}`;
      // Clear cache for this collection and city
      setCache((prev) => ({ ...prev, [cacheKey]: null }));
      // Fetch fresh data
      const { getDataByCity } = await import(`../dashboard/${collectionName}/${collectionName}Service`);
      const data = await getDataByCity(cityKey);
      setCache((prev) => ({ ...prev, [cacheKey]: data }));
      return data;
    } catch (error) {
      console.error(`Error refreshing ${collectionName}:`, error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{ getData, deleteItem, refreshData, cache, setCache }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}