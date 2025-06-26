'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../lib/authContext';
import { useData } from '../../../../lib/dataContext';
import { firestore } from '../../../../lib/firebase';
import { collection, doc, getDoc, setDoc, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import MDEditor from '@uiw/react-md-editor';
import { ChevronDown, X, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditSurveyPage() {
  const { user } = useAuth();
  const { refreshData } = useData();
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id;
  const [categories, setCategories] = useState([]);
  const [activeLang, setActiveLang] = useState('ru');
  const [formData, setFormData] = useState({
    title: { ru: '', kz: '', en: '' },
    description: { ru: '', kz: '', en: '' },
    rejectionReason: { ru: '', kz: '', en: '' },
    questions: [],
  });
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('In progress');
  const [publishLoading, setPublishLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [tempRejectionReason, setTempRejectionReason] = useState({ ru: '', kz: '', en: '' });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'surveys_categories'));
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

  // Fetch survey data
  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) return;
      try {
        setFetchLoading(true);
        const surveyDoc = await getDoc(doc(firestore, 'surveys', surveyId));
        if (surveyDoc.exists()) {
          const data = surveyDoc.data();
          setFormData({
            title: data.title || { ru: '', kz: '', en: '' },
            description: data.description || { ru: '', kz: '', en: '' },
            rejectionReason: data.rejectionReason || { ru: '', kz: '', en: '' },
            questions: data.questions || [],
          });
          setCategoryId(typeof data.categoryId === 'object' ? data.categoryId.id : data.categoryId || '');
          setStatus(data.status || 'In progress');
        } else {
          setError('Опрос не найден');
        }
      } catch (error) {
        console.error('Error fetching survey:', error);
        setError('Ошибка загрузки опроса');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchSurvey();
  }, [surveyId]);

  const handleInputChange = (field, lang, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));
  };

  const handleQuestionChange = (index, field, lang, value) => {
    setFormData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = {
        ...newQuestions[index],
        [field]: {
          ...newQuestions[index][field],
          [lang]: value,
        },
      };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, lang, value) => {
    setFormData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex].options[optionIndex] = {
        ...newQuestions[questionIndex].options[optionIndex],
        [lang]: value,
      };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleRejectReasonChange = (lang, value) => {
    setTempRejectionReason((prev) => ({
      ...prev,
      [lang]: value,
    }));
  };

  const handleSubmit = async (newStatus) => {
    let loadingSetter;
    if (newStatus === 'Published') {
      loadingSetter = setPublishLoading;
      // Validate all fields for Published status
      if (
        !formData.title.ru.trim() ||
        !formData.title.kz.trim() ||
        !formData.title.en.trim() ||
        !formData.description.ru.trim() ||
        !formData.description.kz.trim() ||
        !formData.description.en.trim() ||
        !categoryId ||
        formData.questions.some(
          (q) =>
            !q.questionText.ru.trim() ||
            !q.questionText.kz.trim() ||
            !q.questionText.en.trim() ||
            q.options.some((opt) => !opt.ru.trim() || !opt.kz.trim() || !opt.en.trim())
        )
      ) {
        setError('Все поля на всех языках и категория обязательны для публикации');
        return;
      }
    } else if (newStatus === 'Rejected') {
      loadingSetter = setRejectLoading;
      if (
        !tempRejectionReason.ru.trim() ||
        !tempRejectionReason.kz.trim() ||
        !tempRejectionReason.en.trim()
      ) {
        setError('Причина отклонения обязательна на всех языках');
        return;
      }
    } else {
      loadingSetter = setCompleteLoading;
    }

    loadingSetter(true);
    setError(null);

    try {
      const surveyData = {
        title: formData.title,
        description: formData.description,
        rejectionReason: newStatus === 'Rejected' ? tempRejectionReason : null,
        categoryId: doc(firestore, 'surveys_categories', categoryId),
        cityKey: user?.cityKey || localStorage.getItem('selectedCity') || '',
        questions: formData.questions,
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'surveys', surveyId), surveyData, { merge: true });

      // Create admin log entry
      await addDoc(collection(firestore, 'admin_logs'), {
        action: 'update',
        collection: 'surveys',
        documentId: surveyId,
        timestamp: serverTimestamp(),
        userId: user?.uid || 'unknown',
      });

      // Refresh the surveys cache
      const cityKey = user?.cityKey || localStorage.getItem('selectedCity') || '';
      await refreshData('surveys', cityKey);

      router.push('/dashboard/surveys');
    } catch (error) {
      console.error('Error updating survey:', error);
      setError('Ошибка при обновлении опроса');
    } finally {
      loadingSetter(false);
      if (newStatus === 'Rejected') {
        setIsRejectModalOpen(false);
        setTempRejectionReason({ ru: '', kz: '', en: '' });
      }
    }
  };

  const handleRejectClick = () => {
    setIsRejectModalOpen(true);
  };

  const handleRejectCancel = () => {
    setIsRejectModalOpen(false);
    setTempRejectionReason({ ru: '', kz: '', en: '' });
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
          <Link href="/dashboard/surveys" className="hover:text-primary">Опросы</Link>
          <span className="mx-2">-</span>
          <span>Редактировать</span>
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
            disabled={publishLoading || rejectLoading || completeLoading}
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
            disabled={publishLoading || rejectLoading || completeLoading}
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
            disabled={publishLoading || rejectLoading || completeLoading}
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
              disabled={publishLoading || rejectLoading || completeLoading}
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
                disabled={publishLoading || rejectLoading || completeLoading}
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
              Описание ({activeLang === 'ru' ? 'ru' : activeLang === 'kz' ? 'kz' : 'en'}) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description[activeLang]}
              onChange={(e) => handleInputChange('description', activeLang, e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
              rows="3"
              disabled={publishLoading || rejectLoading || completeLoading}
              required
              placeholder={`Введите описание на ${activeLang === 'ru' ? 'русском' : activeLang === 'kz' ? 'казахском' : 'английском'}`}
            />
          </div>

          {formData.questions.map((question, qIndex) => (
            <div key={qIndex} className="border border-light-border dark:border-dark-border p-4 rounded-lg bg-light-card dark:bg-dark-surface">
              <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
                Вопрос {qIndex + 1} ({activeLang === 'ru' ? 'ru' : activeLang === 'kz' ? 'kz' : 'en'}) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={question.questionText[activeLang]}
                onChange={(e) => handleQuestionChange(qIndex, 'questionText', activeLang, e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
                disabled={publishLoading || rejectLoading || completeLoading}
                required
                placeholder={`Введите текст вопроса на ${activeLang === 'ru' ? 'русском' : activeLang === 'kz' ? 'казахском' : 'английском'}`}
              />
              <div className="mt-2">
                <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
                  Варианты ответа
                </label>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="ml-4 mt-2">
                    <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
                      Вариант {oIndex + 1} ({activeLang === 'ru' ? 'ru' : activeLang === 'kz' ? 'kz' : 'en'}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={option[activeLang]}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, activeLang, e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
                      disabled={publishLoading || rejectLoading || completeLoading}
                      required
                      placeholder={`Введите вариант ответа на ${activeLang === 'ru' ? 'русском' : activeLang === 'kz' ? 'казахском' : 'английском'}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

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
                      Причина (Русский) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={tempRejectionReason.ru}
                      onChange={(e) => handleRejectReasonChange('ru', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
                      rows="3"
                      disabled={rejectLoading}
                      required
                      placeholder="Введите причину отклонения на русском"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
                      Причина (Казахский) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={tempRejectionReason.kz}
                      onChange={(e) => handleRejectReasonChange('kz', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
                      rows="3"
                      disabled={rejectLoading}
                      required
                      placeholder="Введите причину отклонения на казахском"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-mmedium text-light-text-primary dark:text-dark-text-primary">
                      Причина (Английский) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={tempRejectionReason.en}
                      onChange={(e) => handleRejectReasonChange('en', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular"
                      rows="3"
                      disabled={rejectLoading}
                      required
                      placeholder="Введите причину отклонения на английском"
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
              onClick={() => handleSubmit('Published')}
              disabled={publishLoading || rejectLoading || completeLoading}
              className={`px-6 py-2 rounded-lg font-msemibold transition-colors ${
                publishLoading
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {publishLoading ? 'Публикация...' : 'Опубликовать'}
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
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {completeLoading ? 'Завершение...' : 'Завершить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}