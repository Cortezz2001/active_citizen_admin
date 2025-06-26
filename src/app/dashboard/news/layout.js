'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Plus, X, ChevronDown, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useData } from '../../lib/dataContext';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getDocs, collection } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';

export default function NewsLayout({ children }) {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary shadow-md">
      <div className="max-w-7xl mx-auto rounded-lg border border-light-border dark:border-dark-border p-6">
        {children}
      </div>
    </div>
  );
}