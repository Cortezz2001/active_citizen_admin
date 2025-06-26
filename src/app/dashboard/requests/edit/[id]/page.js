'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../lib/authContext';
import { useData } from '../../../../lib/dataContext';
import { firestore } from '../../../../lib/firebase';
import { collection, doc, getDoc, setDoc, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { ChevronDown, X, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditRequestPage() {
  const { user } = useAuth();
  const { refreshData } = useData();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id;
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rejectionReason: '',
    address: {},
    mediaFiles: [],
    userId: '',
    createdAt: null,
    updatedAt: null
  });
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [status, setStatus] = useState('In progress');
  const [publishLoading, setPublishLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [tempRejectionReason, setTempRejectionReason] = useState('');
const [selectedImage, setSelectedImage] = useState(null);
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'requests_categories'));
        const categoriesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name?.ru || 'Без названия',
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Ошибка загрузки категорий');
      }
    };
    fetchCategories();
  }, []);

  const openImageModal = (imageUrl, imageName) => {
  setSelectedImage({ url: imageUrl, name: imageName });
};

const closeImageModal = () => {
  setSelectedImage(null);
};

  // Fetch request data
  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) return;
      try {
        setFetchLoading(true);
        const requestDoc = await getDoc(doc(firestore, 'requests', requestId));
        if (requestDoc.exists()) {
          const data = requestDoc.data();
          const categoryDoc = typeof data.categoryId === 'object' && data.categoryId.path
            ? await getDoc(data.categoryId)
            : await getDoc(doc(firestore, 'requests_categories', data.categoryId || ''));
          const categoryName = categoryDoc.exists() ? categoryDoc.data().name?.ru || 'Без названия' : 'Без категории';
          setFormData({
            title: data.title?.ru || '',
            description: data.description?.ru || '',
            rejectionReason: data.rejectionReason?.ru || '',
            address: data.address || {},
            mediaFiles: data.mediaFiles || [],
            userId: data.userId || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
          setCategoryId(typeof data.categoryId === 'object' ? data.categoryId.id : data.categoryId || '');
          setCategoryName(categoryName);
          setStatus(data.status || 'In progress');
        } else {
          setError('Запрос не найден');
        }
      } catch (error) {
        console.error('Error fetching request:', error);
        setError('Ошибка загрузки запроса');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchRequest();
  }, [requestId]);

  const handleRejectReasonChange = (e) => {
    setTempRejectionReason(e.target.value);
  };

  const handleSubmit = async (newStatus) => {
    let loadingSetter;
    if (newStatus === 'In progress') {
      loadingSetter = setPublishLoading;
    } else if (newStatus === 'Rejected') {
      loadingSetter = setRejectLoading;
      if (!tempRejectionReason.trim()) {
        setError('Причина отклонения обязательна');
        return;
      }
    } else {
      loadingSetter = setCompleteLoading;
    }

    loadingSetter(true);
    setError(null);

    try {
      const requestData = {
        status: newStatus,
        rejectionReason: newStatus === 'Rejected' ? { ru: tempRejectionReason, kz: tempRejectionReason, en: tempRejectionReason } : null,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'requests', requestId), requestData, { merge: true });

      // Create admin log entry
      await addDoc(collection(firestore, 'admin_logs'), {
        action: 'status_changed',
        cityKey: user?.cityKey || localStorage.getItem('selectedCity') || '',
        collection: 'requests',
        documentId: requestId,
        timestamp: serverTimestamp(),
        userId: user?.uid || 'unknown',
      });

      // Refresh the requests cache
      const cityKey = user?.cityKey || localStorage.getItem('selectedCity') || '';
      await refreshData('requests', cityKey);

      router.push('/dashboard/requests');
    } catch (error) {
      console.error('Error updating request:', error);
      setError('Ошибка при обновлении запроса');
    } finally {
      loadingSetter(false);
      if (newStatus === 'Rejected') {
        setIsRejectModalOpen(false);
        setTempRejectionReason('');
      }
    }
  };

  const handleRejectClick = () => {
    setIsRejectModalOpen(true);
  };

  const handleRejectCancel = () => {
    setIsRejectModalOpen(false);
    setTempRejectionReason('');
    setError(null);
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen font-mregular">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 dark:border-dark-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto font-mregular">
      <div className="flex items-center mb-6">
        <div className="text-2xl font-mbold text-light-text-primary dark:text-dark-text-primary">
          <Link href="/dashboard/requests" className="hover:text-primary">Запросы</Link>
          <span className="mx-2">-</span>
          <span>Редактировать</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 rounded font-mregular">{error}</div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">Заголовок</label>
          <input
            type="text"
            value={formData.title}
            className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular opacity-70"
            disabled
          />
        </div>

        <div>
          <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">Категория</label>
          <input
            type="text"
            value={categoryName}
            className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular opacity-70"
            disabled
          />
        </div>

        <div>
          <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">Описание</label>
          <textarea
            value={formData.description}
            className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular opacity-70"
            rows="3"
            disabled
          />
        </div>

        <div>
          <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">Адрес</label>
          <input
            type="text"
            value={formData.address?.formattedAddress || 'Не указан'}
            className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular opacity-70"
            disabled
          />
        </div>


{formData.mediaFiles && formData.mediaFiles.length > 0 && (
  <div>
    <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">Медиафайлы</label>
    <div className="flex flex-wrap gap-4">
      {formData.mediaFiles.map((file, index) => {
        // Определяем тип файла на основе MIME-типа или расширения
        const isImage = file.type?.startsWith('image/') || 
                       file.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp)$/);
        const isVideo = file.type?.startsWith('video/') || 
                       file.name?.toLowerCase().match(/\.(mp4|webm|ogg|avi|mov|wmv|flv)$/);
        
        return (
          <div key={index} className="relative">
            {isImage ? (
              <img
                src={file.url}
                alt={file.name || `Изображение ${index + 1}`}
                className="w-48 h-48 object-cover rounded-md border border-light-border dark:border-dark-border cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => openImageModal(file.url, file.name || `Изображение ${index + 1}`)}
                onError={(e) => {
                  console.error('Ошибка загрузки изображения:', file.url);
                  e.target.style.display = 'none';
                }}
              />
            ) : isVideo ? (
              <video
                src={file.url}
                controls
                className="w-48 h-48 object-cover rounded-md border border-light-border dark:border-dark-border"
                onError={(e) => {
                  console.error('Ошибка загрузки видео:', file.url);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              // Для других типов файлов показываем иконку или информацию
              <div className="w-48 h-48 flex items-center justify-center bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md">
                <div className="text-center">
                  <div className="text-2xl mb-2">📄</div>
                  <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {file.name || 'Файл'}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-1">
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">
                {file.name || `Файл ${index + 1}`}
              </p>
              {file.size && (
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  {file.size}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
    
    {/* Модальное окно для увеличенного изображения */}
    {selectedImage && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={closeImageModal}
      >
        <div 
          className="relative max-w-4xl max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
          >
            <X size={24} />
          </button>
          <img
            src={selectedImage.url}
            alt={selectedImage.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={(e) => {
              console.error('Ошибка загрузки увеличенного изображения:', selectedImage.url);
              closeImageModal();
            }}
          />
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-white bg-black bg-opacity-50 px-3 py-1 rounded">
              {selectedImage.name}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
)}

        {formData.rejectionReason && (
          <div>
            <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">Причина отклонения</label>
            <textarea
              value={formData.rejectionReason}
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular opacity-70"
              rows="3"
              disabled
            />
          </div>
        )}

        <div>
          <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">Дата создания</label>
          <input
            type="text"
            value={formData.createdAt?.toDate().toLocaleDateString('ru-RU') || 'Не указана'}
            className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular opacity-70"
            disabled
          />
        </div>

        <div>
          <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">Дата обновления</label>
          <input
            type="text"
            value={formData.updatedAt?.toDate().toLocaleDateString('ru-RU') || 'Не указана'}
            className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular opacity-70"
            disabled
          />
        </div>

        <div>
          <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">ID пользователя</label>
          <input
            type="text"
            value={formData.userId || 'Не указан'}
            className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular opacity-70"
            disabled
          />
        </div>

        {/* Reject Modal */}
        {isRejectModalOpen && (
          <div className="fixed inset-0 bg-light-background/90 dark:bg-dark-background/90 flex items-center justify-center z-50">
            <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-mbold">Причина отклонения</h3>
                <button
                  onClick={handleRejectCancel}
                  className="text-light-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary"
                  disabled={rejectLoading}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
                    Причина <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={tempRejectionReason}
                    onChange={handleRejectReasonChange}
                    className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
                    rows="3"
                    disabled={rejectLoading}
                    required
                    placeholder="Введите причину отклонения"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleRejectCancel}
                  className="px-4 py-2 rounded-md font-msemibold transition-colors bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={rejectLoading}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('Rejected')}
                  className="px-4 py-2 rounded-md font-msemibold transition-colors bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={rejectLoading}
                >
                  {rejectLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                      Отклонение...
                    </>
                  ) : (
                    'Подтвердить'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleSubmit('In progress')}
            disabled={publishLoading || rejectLoading || completeLoading}
            className={`px-6 py-2 rounded-lg font-msemibold transition-colors ${
              publishLoading
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {publishLoading ? 'Обработка...' : 'В процессе'}
          </button>
          <button
            type="button"
            onClick={handleRejectClick}
            disabled={publishLoading || rejectLoading || completeLoading}
            className={`px-6 py-2 rounded-lg font-msemibold transition-colors ${
              rejectLoading
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Отклонить
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('Completed')}
            disabled={publishLoading || rejectLoading || completeLoading}
            className={`px-6 py-2 rounded-lg font-msemibold transition-colors ${
              completeLoading
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {completeLoading ? 'Завершение...' : 'Завершить'}
          </button>
        </div>
      </div>
    </div>
  );
}