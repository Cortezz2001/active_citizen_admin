'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from './lib/authContext';

export default function Login() {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { user, isLoading: isAuthLoading, login } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Предотвращаем гидратационные ошибки
  useEffect(() => {
    setMounted(true);
  }, []);

  // Перенаправляем авторизованного пользователя
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(loginValue, password);
      // Перенаправление теперь происходит в функции login
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Неверный формат email');
          break;
        case 'auth/invalid-credential':
          setError('Неверные учетные данные');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Неверный email или пароль');
          break;
        case 'auth/too-many-requests':
          setError('Слишком много попыток. Попробуйте позже');
          break;
        case 'auth/user-disabled':
          setError('Учетная запись отключена');
          break;
        case 'auth/missing-password':
          setError('Введите пароль');
          break;
        case 'auth/operation-not-allowed':
          setError('Вход с email и паролем не разрешен');
          break;
        case 'auth/network-request-failed':
          setError('Ошибка сети. Проверьте подключение к интернету');
          break;
        default:
          setError('Ошибка входа: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Показываем лоадер пока не смонтирован компонент или проверяется авторизация
  if (!mounted || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 dark:border-dark-primary"></div>
        </div>
      </div>
    );
  }

  // Если пользователь авторизован, показываем лоадер (перенаправление уже происходит)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 dark:border-dark-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background">
      <div className="p-8 rounded-lg shadow-md w-96 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border">
        <div className="flex justify-center mb-6">
          <img
            src="/images/logo_1024.png"
            alt="Logo"
            className="w-20 h-auto"
          />
        </div>
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-dark-surface dark:hover:bg-dark-border dark:text-dark-text-primary"
            title="Переключить тему"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <h2 className="text-2xl mb-6 text-center font-mbold text-black dark:text-dark-text-primary">
          Вход в систему
        </h2>

        {error && (
          <div className="border p-4 rounded mb-4 font-mregular bg-red-100 border-red-400 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <div className="mb-5">
            <label htmlFor="login" className="block text-sm font-mregular text-gray-800 dark:text-dark-text-secondary">
              Email
            </label>
            <input
              id="login"
              type="email"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg shadow-sm focus:ring-2 focus:outline-none transition font-mregular bg-white border-gray-300 text-light-text-primary focus:ring-primary focus:border-primary dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:ring-dark-primary dark:focus:border-dark-primary"
              placeholder="Введите email"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-mregular text-gray-800 dark:text-dark-text-secondary">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg shadow-sm focus:ring-2 focus:outline-none transition font-mregular bg-white border-gray-300 text-gray-800 focus:ring-blue-400 focus:border-blue-400 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary dark:focus:ring-dark-primary dark:focus:border-dark-primary"
              placeholder="Введите пароль"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-3 font-msemibold rounded-lg shadow-md transition bg-blue-500 hover:bg-blue-600 text-white dark:bg-dark-primary dark:hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-t-2 border-solid rounded-full animate-spin border-blue-600 border-t-blue-300 dark:border-blue-300 dark:border-t-blue-600"></div>
              </div>
            ) : (
              'Войти'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}