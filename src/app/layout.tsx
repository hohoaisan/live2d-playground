import { Metadata } from 'next';
import React from 'react';

import '@/styles/globals.css';

import { ThemeProvider } from '@/contexts/theme';

export const metadata: Metadata = {
  title: 'Live2D Playground',
  description:
    'A hobby Live2D viewer for the web, including basic feature: live2d zip file viewer, motion and facial tracking and more yet to come!',
};

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
