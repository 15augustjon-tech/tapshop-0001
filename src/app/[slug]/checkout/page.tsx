'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Product, Seller } from '@/lib/types'
import PromptPayQR from '@/components/PromptPayQR'
import { isValidThaiPhone, isValidAddress } from '@/lib/validation'

interface CartItem {
  product: Product
  quantity: number
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [seller, setSeller] = useState<Seller | null>(null)
  const [step, setStep] = useState<'address' | 'payment' | 'confirm'>('address')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')

  // Validation states
  const [phoneError, setPhoneError] = useState('')
  const [addressError, setAddressError] = useState('')

  // Delivery quote (will integrate with Lalamove later)
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null)
  const [gettingQuote, setGettingQuote] = useState(false)

  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  useEffect(() => {
    // Load cart and seller from localStorage
    const savedCart = localStorage.getItem('tapshop_cart')
    const savedSeller = localStorage.getItem('tapshop_seller')

    if (savedCart && savedSeller) {
      setCart(JSON.parse(savedCart))
      setSeller(JSON.parse(savedSeller))
    } else {
      // No cart, redirect back to shop
      router.push(`/${slug}`)
    }
  }, [slug, router])

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const total = subtotal + (deliveryFee || 0)

  const getDeliveryQuote = async () => {
    // Validate address
    const addressValidation = isValidAddress(buyerAddress)
    if (!addressValidation.valid) {
      setAddressError(addressValidation.message || 'Invalid address')
      return
    }
    setAddressError('')

    setGettingQuote(true)
    setError('')

    try {
      const response = await fetch('/api/delivery/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: seller?.id,
          buyer_address: buyerAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Could not get delivery quote. Please try again.')
        return
      }

      setDeliveryFee(data.delivery_fee)
      setStep('payment')
    } catch {
      setError('Could not connect to delivery service. Please try again.')
    } finally {
      setGettingQuote(false)
    }
  }

  const handleSubmitOrder = async () => {
    if (!buyerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (!buyerPhone.trim()) {
      setPhoneError('Please enter your phone number')
      return
    }

    if (!isValidThaiPhone(buyerPhone)) {
      setPhoneError('Please enter a valid Thai phone number (e.g., 0812345678)')
      return
    }
    setPhoneError('')

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: seller?.id,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          buyer_address: buyerAddress,
          cart: cart.map(item => ({
            product_id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
          subtotal,
          delivery_fee: deliveryFee,
          total_amount: total,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const data = await response.json()

      // Clear cart
      localStorage.removeItem('tapshop_cart')
      localStorage.removeItem('tapshop_seller')

      // Redirect to confirmation
      router.push(`/${slug}/order/${data.order_number}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (!seller || cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => {
              if (step === 'payment') setStep('address')
              else router.push(`/${slug}`)
            }}
            className="mr-4 text-gray-600"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="font-medium text-gray-900 mb-3">Order Summary</h2>
          {cart.map((item) => (
            <div key={item.product.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.product.name} x {item.quantity}
              </span>
              <span>฿{(item.product.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>
            {deliveryFee !== null && (
              <div className="flex justify-between text-sm mt-1">
                <span>Delivery (Cash on Delivery)</span>
                <span>฿{deliveryFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold mt-2 text-lg">
              <span>Total</span>
              <span className="text-blue-600">฿{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {step === 'address' && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="font-medium text-gray-900 mb-4">Delivery Address</h2>

            <textarea
              value={buyerAddress}
              onChange={(e) => {
                setBuyerAddress(e.target.value)
                setAddressError('')
              }}
              placeholder="Enter your full address (including building number, street, district, city)"
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                addressError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />

            {addressError && (
              <p className="text-red-600 text-sm mt-1">{addressError}</p>
            )}

            <p className="text-xs text-gray-500 mt-2">
              Delivery fee will be calculated based on distance. You pay the delivery fee in cash when driver arrives.
            </p>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            <button
              onClick={getDeliveryQuote}
              disabled={gettingQuote || !buyerAddress.trim()}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {gettingQuote ? 'Getting quote...' : 'Get Delivery Quote'}
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-medium text-gray-900 mb-4">Payment</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-800 mb-2">Pay via PromptPay</p>
                <p className="text-2xl font-bold text-blue-600">
                  ฿{subtotal.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  (Product total only - pay delivery in cash)
                </p>

                {seller.promptpay_id ? (
                  <div className="mt-4">
                    <PromptPayQR promptpayId={seller.promptpay_id} amount={subtotal} />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-orange-600">
                    Contact seller for payment details
                  </p>
                )}
              </div>
            </div>

            {/* Your Details */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-medium text-gray-900 mb-4">Your Details</h2>

              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => {
                      setBuyerPhone(e.target.value)
                      setPhoneError('')
                    }}
                    placeholder="Phone number (e.g., 0812345678)"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      phoneError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-red-600 text-sm mt-1">{phoneError}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Thai mobile number starting with 06, 08, or 09</p>
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleSubmitOrder}
              disabled={loading || !buyerName.trim() || !buyerPhone.trim()}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Placing Order...' : 'I\'ve Paid - Place Order'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By placing this order, you confirm you have paid ฿{subtotal.toLocaleString()} via PromptPay
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
