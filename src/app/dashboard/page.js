'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Предотвращаем гидратационные ошибки
  useEffect(() => {
    setMounted(true);
  }, []);

  // Обработка выхода
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Показываем лоадер пока не смонтирован компонент
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 dark:border-dark-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          {/* Заголовок */}
          <h1 className="text-2xl font-mbold">Dashboard</h1>
          <div className="flex space-x-4">
            {/* Кнопка смены темы */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors bg-light-surface hover:bg-gray-200 text-light-text-secondary dark:bg-dark-surface dark:hover:bg-dark-border dark:text-dark-text-primary"
              title="Переключить тему"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {/* Кнопка выхода */}
            <button
              onClick={handleLogout}
              className="py-2 px-4 rounded-md font-msemibold transition-colors bg-primary hover:bg-[#0055c3] text-white dark:bg-dark-primary dark:hover:bg-blue-600"
            >
              Выйти
            </button>
          </div>
        </div>
        {/* Контент страницы */}
        <div className="p-6 rounded-lg shadow-md bg-light-card border-light-border dark:bg-dark-card dark:border-dark-border">
          <h2 className="text-xl font-mmedium mb-4">Добро пожаловать!</h2>
          <p className="font-mregular">
            Это ваша панель управления. Здесь вы можете управлять своим контентом.
          </p>
        </div>
      </div>
    </div>
  );
}