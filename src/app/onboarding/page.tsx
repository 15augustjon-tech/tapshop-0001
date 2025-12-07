'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const [shopName, setShopName] = useState('')
  const [promptpayId, setPromptpayId] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      setUserPhone(user.phone || null)
    }
    getUser()
  }, [supabase, router])

  // Generate slug from shop name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .slice(0, 50) // Limit length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !userPhone) return

    setLoading(true)
    setError('')

    try {
      // Generate base slug
      let slug = generateSlug(shopName)

      // Check if slug exists and make unique if needed
      const { data: existingSeller } = await supabase
        .from('sellers')
        .select('shop_slug')
        .eq('shop_slug', slug)
        .single()

      if (existingSeller) {
        // Add random suffix to make unique
        slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
      }

      // Create seller profile
      const { error: insertError } = await supabase
        .from('sellers')
        .insert({
          id: userId,
          phone: userPhone,
          shop_name: shopName,
          shop_slug: slug,
          promptpay_id: promptpayId || null,
          pickup_address: pickupAddress || null,
        })

      if (insertError) throw insertError

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create shop')
    } finally {
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Your Shop
          </h1>
          <p className="mt-2 text-gray-600">
            Set up your TapShop storefront in 1 minute
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
            {/* Shop Name */}
            <div>
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                Shop Name *
              </label>
              <input
                id="shopName"
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g., Somchai Vintage"
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {shopName && (
                <p className="mt-1 text-sm text-gray-500">
                  Your link: tapshop.co/{generateSlug(shopName)}
                </p>
              )}
            </div>

            {/* PromptPay ID */}
            <div>
              <label htmlFor="promptpayId" className="block text-sm font-medium text-gray-700">
                PromptPay ID
              </label>
              <p className="text-xs text-gray-500 mb-1">
                Phone number or National ID for receiving payments
              </p>
              <input
                id="promptpayId"
                type="text"
                value={promptpayId}
                onChange={(e) => setPromptpayId(e.target.value)}
                placeholder="e.g., 0812345678"
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Pickup Address */}
            <div>
              <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700">
                Pickup Address
              </label>
              <p className="text-xs text-gray-500 mb-1">
                Where drivers will pick up orders
              </p>
              <textarea
                id="pickupAddress"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="e.g., 123 Sukhumvit Soi 11, Bangkok 10110"
                rows={3}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !shopName}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create My Shop'}
          </button>
        </form>
      </div>
    </div>
  )
}
