import { AuthProvider } from './lib/authContext';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { DataProvider } from './lib/dataContext';

export const metadata = {
  title: 'Активный гражданин',
  description: 'A Next.js application with Firebase authentication',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider 
          attribute="class"             
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <DataProvider>
            {children}
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}