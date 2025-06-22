'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, Home, Newspaper, Calendar, ClipboardList, FileText, Send } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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
            <div className="flex space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors bg-light-surface hover:bg-gray-200 text-light-text-secondary dark:bg-dark-surface dark:hover:bg-dark-border dark:text-dark-text-primary"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className="py-2 px-4 rounded-md font-msemibold transition-colors bg-primary hover:bg-[#0055c3] text-white dark:bg-dark-primary dark:hover:bg-blue-600"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="p-6 rounded-lg shadow-md bg-light-card border-light-border dark:bg-dark-card dark:border-dark-border">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}