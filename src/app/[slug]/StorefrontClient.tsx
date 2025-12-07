'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Product, Seller } from '@/lib/types'

interface CartItem {
  product: Product
  quantity: number
}

interface StorefrontClientProps {
  seller: Seller
  products: Product[]
}

export default function StorefrontClient({ seller, products }: StorefrontClientProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setSelectedProduct(null)
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{seller.shop_name}</h1>
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {product.name}
                  </h3>
                  <p className="text-blue-600 font-bold mt-1">
                    ฿{product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-lg max-h-[90vh] overflow-y-auto">
            {/* Image */}
            <div className="aspect-square bg-gray-100 relative">
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
              >
                ✕
              </button>
            </div>

            {/* Details */}
            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedProduct.name}
              </h2>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                ฿{selectedProduct.price.toLocaleString()}
              </p>
              {selectedProduct.description && (
                <p className="text-gray-600 mt-3">{selectedProduct.description}</p>
              )}

              <button
                onClick={() => addToCart(selectedProduct)}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-40">
          <div className="max-w-3xl mx-auto">
            <Link
              href={`/${seller.shop_slug}/checkout`}
              onClick={() => {
                // Store cart in localStorage for checkout page
                localStorage.setItem('tapshop_cart', JSON.stringify(cart))
                localStorage.setItem('tapshop_seller', JSON.stringify(seller))
              }}
              className="flex items-center justify-between w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              <span>View Cart ({cartCount} items)</span>
              <span>฿{cartTotal.toLocaleString()}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Cart Preview (when has items) */}
      {cartCount > 0 && (
        <div className="pb-24">
          <div className="max-w-3xl mx-auto px-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">Your Cart</h3>
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-blue-600 text-sm">
                      ฿{item.product.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
