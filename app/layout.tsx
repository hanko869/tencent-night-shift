import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Budget Tracker - Team Software Expenses',
  description: 'Track and manage software budget for internal company teams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
} 