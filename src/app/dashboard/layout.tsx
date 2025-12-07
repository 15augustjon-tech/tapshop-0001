import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from './SignOutButton'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                TapShop
              </Link>
              <div className="hidden sm:flex space-x-6">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  href="/dashboard/products"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Products
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Orders
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - fixed at bottom for easier thumb access */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around">
          <Link href="/dashboard" className="flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-600">
            <span className="text-lg">🏠</span>
            <span className="text-xs font-medium mt-1">Home</span>
          </Link>
          <Link href="/dashboard/products" className="flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-600">
            <span className="text-lg">📦</span>
            <span className="text-xs font-medium mt-1">Products</span>
          </Link>
          <Link href="/dashboard/orders" className="flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-600">
            <span className="text-lg">📋</span>
            <span className="text-xs font-medium mt-1">Orders</span>
          </Link>
          <Link href="/dashboard/settings" className="flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-600">
            <span className="text-lg">⚙️</span>
            <span className="text-xs font-medium mt-1">Settings</span>
          </Link>
        </div>
      </div>

      {/* Main content with bottom padding for mobile nav */}
      <div className="pb-20 sm:pb-0">
        {children}
      </div>
    </div>
  )
}
