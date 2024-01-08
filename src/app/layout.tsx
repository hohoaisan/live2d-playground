import React from 'react';

import '@/styles/globals.css';

import { ThemeProvider } from '@/contexts/theme';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
