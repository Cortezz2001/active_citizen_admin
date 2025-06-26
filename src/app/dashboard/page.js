'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ArrowRightCircle, Trash2, Edit, PlusCircle, RefreshCw } from 'lucide-react'; // Добавлен RefreshCw
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { auth, firestore } from '../lib/firebase';
import { useAuth } from '../lib/authContext';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    news: 0,
    events: 0,
    surveys: 0,
    petitions: 0,
    requests: 0,
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Состояние для индикатора обновления

  const cityKey = user?.cityKey || localStorage.getItem('selectedCity') || '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchCounts = async () => {
    if (!cityKey) {
      setCounts({ news: 0, events: 0, surveys: 0, petitions: 0, requests: 0 });
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true); // Включаем индикатор обновления
      const collections = ['news', 'events', 'surveys', 'petitions', 'requests'];
      const countPromises = collections.map(async (col) => {
        const q = col === 'requests' 
          ? query(collection(firestore, col), where('address.cityKey', '==', cityKey))
          : query(collection(firestore, col), where('cityKey', '==', cityKey));
        const snapshot = await getDocs(q);
        return { [col]: snapshot.size };
      });
      const countResults = await Promise.all(countPromises);
      const newCounts = countResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setCounts(newCounts);
    } catch (error) {
      console.error('Ошибка при получении количества записей:', error);
    } finally {
      setLoading(false);
      setRefreshing(false); // Выключаем индикатор обновления
    }
  };

  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [user, cityKey]);

  useEffect(() => {
    if (!user || !cityKey) return;

    const q = query(
      collection(firestore, 'admin_logs'),
      where('cityKey', '==', cityKey),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        }),
      }));
      setLogs(logData);
    }, (error) => {
      console.error('Ошибка при получении логов:', error);
    });

    return () => unsubscribe();
  }, [user, cityKey]);

  const handleRefresh = () => {
    fetchCounts(); // Вызываем функцию загрузки данных
  };

  const actionIcons = {
    status_changed: <ArrowRightCircle size={20} className="text-blue-500 dark:text-dark-primary" />,
    delete: <Trash2 size={20} className="text-red-500 dark:text-red-400" />,
    update: <Edit size={20} className="text-yellow-500 dark:text-yellow-400" />,
    create: <PlusCircle size={20} className="text-green-500 dark:text-green-400" />,
  };

  const collectionNames = {
    news: 'Новости',
    events: 'События',
    surveys: 'Опросы',
    petitions: 'Петиции',
    requests: 'Заявки',
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 dark:border-dark-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Статус</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 rounded-md font-medium transition-colors bg-primary hover:bg-[#0055c3] text-white dark:bg-dark-primary dark:hover:bg-blue-600"
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white "></div>
            ) : (
              <RefreshCw size={16} />
            )}
            
          </button>
        </div>

        {/* Остальной код остается без изменений */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Object.entries(counts).map(([key, count]) => (
            <div
              key={key}
              className="p-4 bg-white dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-md"
            >
              <h2 className="text-lg font-medium capitalize">{collectionNames[key]}</h2>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="animate-pulse h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : (
                  count
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold mb-4">Последние логи</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Действие
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Коллекция
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID документа
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID пользователя
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Время
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                      Логи отсутствуют
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2 whitespace-nowrap flex items-center space-x-2">
                        {actionIcons[log.action] || <span>{log.action}</span>}
                        <span>{log.action}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{log.collection}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{log.documentId}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{log.userId}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{log.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}