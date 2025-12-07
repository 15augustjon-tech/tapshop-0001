import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string; orderNumber: string }>
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { slug, orderNumber } = await params
  const supabase = await createClient()

  // Get order
  const { data: order } = await supabase
    .from('orders')
    .select('*, sellers(shop_name)')
    .eq('order_number', orderNumber)
    .single()

  if (!order) {
    notFound()
  }

  // Define timeline steps
  const timelineSteps = [
    { key: 'pending', label: 'Order Placed', icon: '📋' },
    { key: 'confirmed', label: 'Payment Confirmed', icon: '✓' },
    { key: 'shipped', label: 'Out for Delivery', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '📦' },
  ]

  const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered']
  const currentIndex = statusOrder.indexOf(order.order_status)
  const isCancelled = order.order_status === 'cancelled'

  const statusMessages: Record<string, { text: string; color: string }> = {
    pending: { text: 'Waiting for seller to confirm payment', color: 'text-yellow-600' },
    confirmed: { text: 'Payment confirmed - preparing to ship', color: 'text-blue-600' },
    shipped: { text: 'On the way! Driver assigned', color: 'text-purple-600' },
    delivered: { text: 'Delivered successfully', color: 'text-green-600' },
    cancelled: { text: 'Order cancelled', color: 'text-red-600' },
  }

  const status = statusMessages[order.order_status] || statusMessages.pending

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">Order Status</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 text-center mb-6">
          {isCancelled ? (
            <>
              <div className="text-red-500 text-5xl mb-4">✗</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Order Cancelled</h2>
            </>
          ) : order.order_status === 'delivered' ? (
            <>
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delivered!</h2>
            </>
          ) : (
            <>
              <div className="text-blue-600 text-5xl mb-4">📦</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Order Placed!</h2>
            </>
          )}
          <p className="text-gray-600 mb-2">Order #{order.order_number}</p>
          <p className={`font-medium ${status.color}`}>{status.text}</p>
        </div>

        {/* Order Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Order Progress</h3>
            <div className="relative">
              {timelineSteps.map((step, index) => {
                const isCompleted = index <= currentIndex
                const isCurrent = index === currentIndex
                return (
                  <div key={step.key} className="flex items-start mb-6 last:mb-0">
                    {/* Connector line */}
                    {index < timelineSteps.length - 1 && (
                      <div
                        className={`absolute left-4 w-0.5 h-12 -ml-px mt-8 ${
                          index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                        style={{ top: `${index * 72}px` }}
                      />
                    )}
                    {/* Step circle */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}
                    >
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    {/* Step content */}
                    <div className="ml-4">
                      <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-green-600">Current status</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Order Details</h3>

          {order.product_details.map((item: { name: string; price: number; quantity: number }, index: number) => (
            <div key={index} className="flex justify-between py-2 text-sm border-b last:border-0">
              <span>{item.name} x {item.quantity}</span>
              <span>฿{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}

          <div className="mt-3 pt-3 border-t space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>฿{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery (Pay in cash)</span>
              <span>฿{order.delivery_fee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>฿{order.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Delivery To</h3>
          <p className="text-gray-600">{order.buyer_name}</p>
          <p className="text-gray-600">{order.buyer_phone}</p>
          <p className="text-gray-600 mt-2">{order.buyer_address}</p>
        </div>

        {/* Tracking Link */}
        {order.lalamove_share_link && order.order_status === 'shipped' && (
          <a
            href={order.lalamove_share_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-purple-600 text-white text-center py-3 rounded-lg font-medium mb-6 hover:bg-purple-700"
          >
            Track Your Delivery
          </a>
        )}

        {/* Payment Reminder */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Payment:</strong> ฿{order.subtotal.toLocaleString()} via PromptPay
          </p>
          <p className="text-sm text-blue-800 mt-1">
            <strong>Delivery:</strong> ฿{order.delivery_fee.toLocaleString()} cash to driver
          </p>
        </div>

        <Link
          href={`/${slug}`}
          className="block text-center text-blue-600 font-medium"
        >
          ← Back to Shop
        </Link>
      </main>
    </div>
  )
}
