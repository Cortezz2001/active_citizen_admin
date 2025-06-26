"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/authContext';
import { useData } from '../../../lib/dataContext'; // Import useData
import { firestore, storage } from '../../../lib/firebase';
import { collection, addDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MDEditor from '@uiw/react-md-editor';
import { ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CreateNewsPage() {
  const { user } = useAuth();
  const { refreshData } = useData(); // Destructure refreshData from useData
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [activeLang, setActiveLang] = useState('ru');
  const [formData, setFormData] = useState({
    title: { ru: '', kz: '', en: '' },
    shortDescription: { ru: '', kz: '', en: '' },
    content: { ru: '', kz: '', en: '' },
  });
  const [categoryId, setCategoryId] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'news_categories'));
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

  const handleInputChange = (field, lang, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    } else {
      setError('Пожалуйста, загрузите файл изображения');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    } else {
      setError('Пожалуйста, выберите файл изображения');
    }
  };

  const handleSubmit = async (status) => {
    if (
      !formData.title.ru.trim() ||
      !formData.shortDescription.ru.trim() ||
      !formData.content.ru.trim() ||
      !formData.title.kz.trim() ||
      !formData.shortDescription.kz.trim() ||
      !formData.content.kz.trim() ||
      !formData.title.en.trim() ||
      !formData.shortDescription.en.trim() ||
      !formData.content.en.trim() ||
      !categoryId ||
      !imageFile
    ) {
      setError('Все поля, включая категорию и изображение, обязательны для заполнения');
      return;
    }

    const setLoading = status === 'draft' ? setDraftLoading : setPublishLoading;
    setLoading(true);
    setError(null);

    try {
      const storageRef = ref(storage, `news/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);
      setImageUrl(imageUrl);

      const newsData = {
        title: formData.title,
        shortDescription: formData.shortDescription,
        content: formData.content,
        categoryId: doc(firestore, 'news_categories', categoryId),
        cityKey: user?.cityKey || localStorage.getItem('selectedCity') || '',
        isGlobal,
        imageUrl,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0,
      };

      const newsDocRef = await addDoc(collection(firestore, 'news'), newsData);

      // Create admin log entry
      await addDoc(collection(firestore, 'admin_logs'), {
        action: 'create',
        collection: 'news',
        documentId: newsDocRef.id,
        timestamp: serverTimestamp(),
        userId: user?.uid || 'unknown',
      });

      // Refresh the news cache after successful creation
      const cityKey = user?.cityKey || localStorage.getItem('selectedCity') || '';
      await refreshData('news', cityKey);

      router.push('/dashboard/news');
    } catch (error) {
      console.error('Error creating news:', error);
      setError('Ошибка при создании новости');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto font-mregular">
      <div className="flex items-center mb-6">
        <div className="text-2xl font-mbold text-light-text-primary dark:text-dark-text-primary ">
          <Link href="/dashboard/news" className="hover:text-primary">Новости</Link>
          <span className="mx-2">-</span>
          <span>Создать</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 rounded font-mregular">{error}</div>
      )}

      <div className="space-y-6">
        <div className="flex border-b border-light-border dark:border-dark-border">
          <button
            onClick={() => setActiveLang('ru')}
            className={`px-4 py-2 font-msemibold transition-colors ${
              activeLang === 'ru'
                ? 'text-primary border-b-2 border-primary'
                : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-primary'
            }`}
            disabled={draftLoading || publishLoading}
          >
            Русский
          </button>
          <button
            onClick={() => setActiveLang('kz')}
            className={`px-4 py-2 font-msemibold transition-colors ${
              activeLang === 'kz'
                ? 'text-primary border-b-2 border-primary'
                : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-primary'
            }`}
            disabled={draftLoading || publishLoading}
          >
            Казахский
          </button>
          <button
            onClick={() => setActiveLang('en')}
            className={`px-4 py-2 font-msemibold transition-colors ${
              activeLang === 'en'
                ? 'text-primary border-b-2 border-primary'
                : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-primary'
            }`}
            disabled={draftLoading || publishLoading}
          >
            Английский
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
              Заголовок ({activeLang === 'ru' ? 'ru' : activeLang === 'kz' ? 'kz' : 'en'}) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title[activeLang]}
              onChange={(e) => handleInputChange('title', activeLang, e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
              disabled={draftLoading || publishLoading}
              required
              placeholder={`Введите заголовок на ${activeLang === 'ru' ? 'русском' : activeLang === 'kz' ? 'казахском' : 'английском'}`}
            />
          </div>

          <div>
            <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
              Категория <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular hover:bg-light-border dark:hover:bg-dark-border"
                disabled={draftLoading || publishLoading}
              >
                <span className={categoryId ? '' : 'text-light-text-secondary dark:text-dark-text-secondary'}>
                  {categoryId
                    ? categories.find((c) => c.id === categoryId)?.name || 'Неизвестно'
                    : 'Выберите категорию'}
                </span>
                <ChevronDown
                  size={16}
                  className={`ml-2 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setCategoryId(category.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border font-mregular ${
                        categoryId === category.id ? 'bg-light-border dark:bg-dark-border' : ''
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
              Короткое описание ({activeLang === 'ru' ? 'ru' : activeLang === 'kz' ? 'kz' : 'en'}) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.shortDescription[activeLang]}
              onChange={(e) => handleInputChange('shortDescription', activeLang, e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
              rows="3"
              disabled={draftLoading || publishLoading}
              required
              placeholder={`Введите описание на ${activeLang === 'ru' ? 'русском' : activeLang === 'kz' ? 'казахском' : 'английском'}`}
            />
          </div>

          <div>
            <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
              Контент ({activeLang === 'ru' ? 'ru' : activeLang === 'kz' ? 'kz' : 'en'}) <span className="text-red-500">*</span>
            </label>
            <div data-color-mode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}>
              <MDEditor
                value={formData.content[activeLang]}
                onChange={(value) => handleInputChange('content', activeLang, value)}
                height={300}
                className="border border-light-border dark:border-dark-border rounded-lg font-mregular"
                disabled={draftLoading || publishLoading}
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center font-mregular">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => setIsGlobal(e.target.checked)}
              className="mr-2 h-4 w-4 text-primary border-light-border dark:border-dark-border rounded"
              disabled={draftLoading || publishLoading}
            />
            <span className="text-light-text-primary dark:text-dark-text-primary font-mregular">Глобальное</span>
          </label>
        </div>

        <div>
          <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
            Фото <span className="text-red-500">*</span>
          </label>
          <div
            className={`relative w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors font-mregular ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-light-border dark:border-dark-border hover:border-primary'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {imageFile ? (
              <div className="flex items-center space-x-2">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Selected image"
                  className="max-h-28 object-contain"
                />
                <button
                  onClick={() => setImageFile(null)}
                  className="text-red-500 hover:text-red-600"
                  disabled={draftLoading || publishLoading}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <span className="text-light-text-secondary dark:text-dark-text-secondary font-mregular">
                Перетащите изображение или нажмите для выбора
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={draftLoading || publishLoading}
              required
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={draftLoading || publishLoading}
            className={`px-6 py-2 rounded-lg font-msemibold transition-colors ${
              draftLoading
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            {draftLoading ? 'Сохранение...' : 'Черновик'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={draftLoading || publishLoading}
            className={`px-6 py-2 rounded-lg font-msemibold transition-colors ${
              publishLoading
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-primary hover:bg-blue-600 text-white'
            }`}
          >
            {publishLoading ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}