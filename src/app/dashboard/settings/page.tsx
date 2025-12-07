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
            <p className="text-xs text-gray-500 mb-3">
              To connect LINE, you need to set up LINE Login in your LINE Developers Console and add LINE_LOGIN_CHANNEL_ID and LINE_LOGIN_CHANNEL_SECRET to your environment variables.
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
