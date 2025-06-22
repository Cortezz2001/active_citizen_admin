'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, Home, Newspaper, Calendar, ClipboardList, FileText, Send, MapPin, ChevronDown } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, firestore } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../lib/authContext';
import { cities } from '../lib/cities';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user's city on component mount
useEffect(() => {
  const loadUserCity = async () => {
    // Сначала проверяем localStorage
    const savedCity = localStorage.getItem('selectedCity');
    if (savedCity) {
      setSelectedCity(savedCity);
    }

    if (user?.uid) {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const cityKey = userData.cityKey || '';
          setSelectedCity(cityKey);
          localStorage.setItem('selectedCity', cityKey); // Обновляем localStorage
        }
      } catch (error) {
        console.error('Error loading user city:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  if (mounted) {
    loadUserCity();
  }
}, [user, mounted]);

const handleCitySelect = async (cityKey) => {
  if (!user?.uid) return;

  setIsUpdating(true);
  try {
    await updateDoc(doc(firestore, 'users', user.uid), {
      cityKey: cityKey
    });
    setSelectedCity(cityKey);
    localStorage.setItem('selectedCity', cityKey); // Сохраняем в localStorage
    setIsDropdownOpen(false);
  } catch (error) {
    console.error('Error updating city:', error);
  } finally {
    setIsUpdating(false);
  }
};

  // Handle logout
const handleLogout = async () => {
  localStorage.removeItem('selectedCity'); // Очищаем localStorage
  await signOut(auth);
  router.push('/');
};

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Get city display name
  const getCityDisplayName = (cityKey) => {
    const city = cities.find(c => c.key === cityKey);
    return city ? city.name : 'Выберите город';
  };

  // Show loader until component is mounted
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
    <div className="min-h-screen flex bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary">
      {/* Sidebar */}
      <aside className="w-64 p-6 border-r border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h1 className="text-xl font-mbold mb-8">Admin Panel</h1>
        
        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center p-2 rounded-md font-mregular transition-colors hover:bg-light-border dark:hover:bg-dark-border"
          >
            <Home size={20} className="mr-3" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/news"
            className="flex items-center p-2 rounded-md font-mregular transition-colors hover:bg-light-border dark:hover:bg-dark-border"
          >
            <Newspaper size={20} className="mr-3" />
            News
          </Link>
          <Link
            href="/dashboard/events"
            className="flex items-center p-2 rounded-md font-mregular transition-colors hover:bg-light-border dark:hover:bg-dark-border"
          >
            <Calendar size={20} className="mr-3" />
            Events
          </Link>
          <Link
            href="/dashboard/surveys"
            className="flex items-center p-2 rounded-md font-mregular transition-colors hover:bg-light-border dark:hover:bg-dark-border"
          >
            <ClipboardList size={20} className="mr-3" />
            Surveys
          </Link>
          <Link
            href="/dashboard/petitions"
            className="flex items-center p-2 rounded-md font-mregular transition-colors hover:bg-light-border dark:hover:bg-dark-border"
          >
            <FileText size={20} className="mr-3" />
            Petitions
          </Link>
          <Link
            href="/dashboard/requests"
            className="flex items-center p-2 rounded-md font-mregular transition-colors hover:bg-light-border dark:hover:bg-dark-border"
          >
            <Send size={20} className="mr-3" />
            Requests
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-mbold">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              {/* City Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isUpdating || isLoading}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary font-mregular hover:bg-light-border dark:hover:bg-dark-border transition-colors disabled:opacity-50 min-w-[160px]"
                >
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2" />
                    <span className="truncate">
                      {isLoading ? 'Загрузка...' : 
                       isUpdating ? 'Обновляется...' : 
                       getCityDisplayName(selectedCity)}
                    </span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50 min-w-[200px]">
                    {cities.map((city) => (
                      <button
                        key={city.key}
                        onClick={() => handleCitySelect(city.key)}
                        className={`w-full text-left px-3 py-2 hover:bg-light-border dark:hover:bg-dark-border transition-colors font-mregular ${
                          selectedCity === city.key ? 'bg-light-border dark:bg-dark-border' : ''
                        }`}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors bg-light-surface hover:bg-gray-200 text-light-text-secondary dark:bg-dark-surface dark:hover:bg-dark-border dark:text-dark-text-primary"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className="py-2 px-4 rounded-md font-msemibold transition-colors bg-red-500 hover:bg-red-400 text-white "
              >
                Выйти
              </button>
            </div>
          </div>
         
            {children}
      
        </div>
      </main>
    </div>
  );
}