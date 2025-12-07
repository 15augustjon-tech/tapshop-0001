import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get seller profile
  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!seller) {
    redirect('/onboarding')
  }

  // Get product count
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)

  // Get recent orders count
  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)

  // Get pending orders count
  const { count: pendingOrderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .in('order_status', ['pending', 'confirmed'])

  const shopUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${seller.shop_slug}`

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{seller.shop_name}</h1>

      {/* Shop Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800 font-medium mb-1">Your shop link:</p>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-blue-600 bg-white px-3 py-1 rounded border text-sm break-all">
            {shopUrl}
          </code>
          <Link
            href={`/${seller.shop_slug}`}
            target="_blank"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Shop
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Products</p>
          <p className="text-3xl font-bold text-gray-900">{productCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{orderCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Pending Orders</p>
          <p className="text-3xl font-bold text-orange-600">{pendingOrderCount || 0}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/products"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Products</h2>
          <p className="text-gray-600">Add and manage your products</p>
        </Link>
        <Link
          href="/dashboard/orders"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Orders</h2>
          <p className="text-gray-600">View and fulfill orders</p>
        </Link>
      </div>

      {/* Setup Reminders */}
      {(!seller.promptpay_id || !seller.pickup_address) && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Complete your setup</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            {!seller.promptpay_id && (
              <li>Add your PromptPay ID to receive payments</li>
            )}
            {!seller.pickup_address && (
              <li>Add your pickup address for deliveries</li>
            )}
          </ul>
          <Link
            href="/dashboard/settings"
            className="inline-block mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900"
          >
            Go to Settings
          </Link>
        </div>
      )}
    </main>
  )
}
