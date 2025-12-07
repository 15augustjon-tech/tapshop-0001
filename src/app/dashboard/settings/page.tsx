'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Seller } from '@/lib/types'

export default function SettingsPage() {
  const [seller, setSeller] = useState<Seller | null>(null)
  const [shopName, setShopName] = useState('')
  const [promptpayId, setPromptpayId] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check for LINE connection status from URL params
    const lineStatus = searchParams.get('line')
    const error = searchParams.get('error')
    if (lineStatus === 'connected') {
      setMessage('LINE connected successfully! You will now receive order notifications.')
    } else if (error) {
      setMessage('Failed to connect LINE. Please try again.')
    }
  }, [searchParams])

  useEffect(() => {
    const loadSeller = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setSeller(data)
        setShopName(data.shop_name)
        setPromptpayId(data.promptpay_id || '')
        setPickupAddress(data.pickup_address || '')
      }
      setLoading(false)
    }

    loadSeller()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!seller) return

    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('sellers')
        .update({
          shop_name: shopName,
          promptpay_id: promptpayId || null,
          pickup_address: pickupAddress || null,
        })
        .eq('id', seller.id)

      if (error) throw error

      setMessage('Settings saved successfully!')
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!seller) {
    return null
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {/* Shop Name */}
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
              Shop Name
            </label>
            <input
              id="shopName"
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Shop URL (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Shop URL
            </label>
            <p className="mt-1 text-sm text-gray-500">
              /{seller.shop_slug}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Shop URL cannot be changed
            </p>
          </div>

          {/* PromptPay ID */}
          <div>
            <label htmlFor="promptpayId" className="block text-sm font-medium text-gray-700">
              PromptPay ID
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Your phone number or National ID for receiving payments
            </p>
            <input
              id="promptpayId"
              type="text"
              value={promptpayId}
              onChange={(e) => setPromptpayId(e.target.value)}
              placeholder="e.g., 0812345678"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Pickup Address */}
          <div>
            <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700">
              Pickup Address
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Where drivers will pick up your orders
            </p>
            <textarea
              id="pickupAddress"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="e.g., 123 Sukhumvit Soi 11, Bangkok 10110"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {message && (
          <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* LINE Notifications */}
      <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">LINE Notifications</h2>
        <p className="text-sm text-gray-600 mb-4">
          Get instant notifications on LINE when you receive new orders.
        </p>

        {seller.line_user_id ? (
          <div className="flex items-center text-green-600">
            <span className="text-lg mr-2">✓</span>
            <span>LINE connected - You will receive order notifications</span>
          </div>
        ) : (
          <div>
            <p className="text-sm text-orange-600 mb-3">
              LINE not connected - You won&apos;t receive instant notifications
            </p>
            <button
              onClick={() => {
                const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                if (!channelId) {
                  setMessage('LINE Login is not configured. Please add LINE_LOGIN_CHANNEL_ID to environment variables.')
                  return
                }
                const redirectUri = encodeURIComponent(`${appUrl}/api/line/callback`)
                const state = seller.id // Pass seller ID to callback
                const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile`
                window.location.href = lineAuthUrl
              }}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              Connect LINE
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Connect your LINE account to receive instant order notifications
            </p>
          </div>
        )}
      </div>

      {/* Setup Warnings */}
      {(!seller.promptpay_id || !seller.pickup_address) && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Complete your setup</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            {!seller.promptpay_id && (
              <li>Add your PromptPay ID to receive payments from customers</li>
            )}
            {!seller.pickup_address && (
              <li>Add your pickup address so drivers know where to collect orders</li>
            )}
          </ul>
        </div>
      )}
    </main>
  )
}
