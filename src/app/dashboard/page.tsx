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

  // Get all orders for this seller
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate analytics
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const allOrders = orders || []

  // Total revenue (from delivered orders)
  const totalRevenue = allOrders
    .filter(o => o.order_status === 'delivered')
    .reduce((sum, o) => sum + (o.subtotal || 0), 0)

  // Today's revenue
  const todayRevenue = allOrders
    .filter(o => {
      const orderDate = new Date(o.created_at)
      return orderDate >= today && o.order_status !== 'cancelled'
    })
    .reduce((sum, o) => sum + (o.subtotal || 0), 0)

  // Last 7 days revenue
  const weekRevenue = allOrders
    .filter(o => {
      const orderDate = new Date(o.created_at)
      return orderDate >= sevenDaysAgo && o.order_status !== 'cancelled'
    })
    .reduce((sum, o) => sum + (o.subtotal || 0), 0)

  // Order counts by status
  const pendingOrders = allOrders.filter(o => o.order_status === 'pending').length
  const confirmedOrders = allOrders.filter(o => o.order_status === 'confirmed').length
  const shippedOrders = allOrders.filter(o => o.order_status === 'shipped').length
  const deliveredOrders = allOrders.filter(o => o.order_status === 'delivered').length
  const cancelledOrders = allOrders.filter(o => o.order_status === 'cancelled').length

  // Recent orders (last 5)
  const recentOrders = allOrders.slice(0, 5)

  // Top products (from order data)
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
  allOrders.forEach(order => {
    if (order.order_status !== 'cancelled' && order.product_details) {
      order.product_details.forEach((item: { name: string; quantity: number; price: number }) => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 }
        }
        productSales[item.name].quantity += item.quantity
        productSales[item.name].revenue += item.price * item.quantity
      })
    }
  })
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Calculate daily revenue for last 7 days (for simple chart)
  const dailyRevenue: { date: string; amount: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
    const dayRevenue = allOrders
      .filter(o => {
        const orderDate = new Date(o.created_at)
        return orderDate >= date && orderDate < nextDate && o.order_status !== 'cancelled'
      })
      .reduce((sum, o) => sum + (o.subtotal || 0), 0)
    dailyRevenue.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      amount: dayRevenue
    })
  }
  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => d.amount), 1)

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

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Today</p>
          <p className="text-2xl font-bold text-gray-900">฿{todayRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Last 7 Days</p>
          <p className="text-2xl font-bold text-gray-900">฿{weekRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">฿{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Products</p>
          <p className="text-2xl font-bold text-gray-900">{productCount || 0}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Revenue (Last 7 Days)</h2>
          <div className="flex items-end justify-between h-32 gap-2">
            {dailyRevenue.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '100px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t transition-all"
                    style={{ height: `${(day.amount / maxDailyRevenue) * 100}%`, minHeight: day.amount > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Order Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="font-medium">{pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                <span className="text-sm text-gray-600">Confirmed</span>
              </div>
              <span className="font-medium">{confirmedOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-400"></span>
                <span className="text-sm text-gray-600">Shipped</span>
              </div>
              <span className="font-medium">{shippedOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="text-sm text-gray-600">Delivered</span>
              </div>
              <span className="font-medium">{deliveredOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
              <span className="font-medium">{cancelledOrders}</span>
            </div>
          </div>
          {allOrders.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-4">No orders yet</p>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Top Products</h2>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-4">{i + 1}.</span>
                    <span className="text-sm text-gray-900">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">฿{product.revenue.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-2">({product.quantity} sold)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No sales data yet</p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.buyer_name}</p>
                    <p className="text-xs text-gray-500">{order.order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">฿{order.subtotal.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.order_status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.order_status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.order_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/products"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border-l-4 border-blue-500"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Manage Products</h2>
          <p className="text-gray-600">Add, edit, or remove products from your shop</p>
        </Link>
        <Link
          href="/dashboard/orders"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border-l-4 border-green-500"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">View Orders</h2>
          <p className="text-gray-600">Process and track customer orders</p>
        </Link>
      </div>

      {/* Setup Reminders */}
      {(!seller.promptpay_id || !seller.pickup_address || !seller.line_user_id) && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Complete your setup</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            {!seller.promptpay_id && (
              <li>• Add your PromptPay ID to receive payments</li>
            )}
            {!seller.pickup_address && (
              <li>• Add your pickup address for deliveries</li>
            )}
            {!seller.line_user_id && (
              <li>• Connect LINE to receive order notifications</li>
            )}
          </ul>
          <Link
            href="/dashboard/settings"
            className="inline-block mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900"
          >
            Go to Settings →
          </Link>
        </div>
      )}
    </main>
  )
}
