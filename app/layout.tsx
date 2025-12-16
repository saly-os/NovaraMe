import React from 'react';
import './globals.css'; 

export const metadata = {
  title: 'NovaraMe - Personal Growth Planner',
  description: 'Your cute AI-powered scheduler for life and study.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    brand: {
                      50: '#f0fdfa', // Minty White
                      100: '#ccfbf1', // Soft Mint
                      200: '#99f6e4',
                      300: '#5eead4',
                      500: '#14b8a6', // Teal
                      600: '#0d9488',
                      900: '#134e4a',
                    },
                    lavender: {
                      50: '#fbfaff', // Ultra light purple
                      100: '#f3f0ff', // Pale lavender
                      200: '#e9e3ff',
                      300: '#d8b4fe',
                      500: '#a78bfa', // Soft Purple
                      600: '#7c3aed',
                      700: '#6d28d9',
                      900: '#4c1d95',
                    },
                    coral: {
                      50: '#fff1f2',
                      100: '#ffe4e6',
                      200: '#fecdd3',
                      300: '#fda4af',
                      400: '#fb7185',
                      500: '#f43f5e', // Rose/Coral
                      600: '#e11d48',
                    }
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body className="bg-lavender-50 text-slate-800 antialiased selection:bg-brand-200 selection:text-brand-900">
        {children}
      </body>
    </html>
  );
}