'use client';

export default function SurveysLayout({ children }) {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary shadow-md">
      <div className="max-w-7xl mx-auto rounded-lg border border-light-border dark:border-dark-border p-6">
        {children}
      </div>
    </div>
  );
}