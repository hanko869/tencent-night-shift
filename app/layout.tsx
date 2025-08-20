import type { Metadata } from 'next'
import './globals.css'

const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Company'

export const metadata: Metadata = {
  title: `${COMPANY_NAME} - Budget Tracker`,
  description: `Track and manage software budget for ${COMPANY_NAME}`,
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