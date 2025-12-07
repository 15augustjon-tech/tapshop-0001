'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types'
import ProductForm from './ProductForm'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const loadProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (data) {
      setProducts(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (!error) {
      setProducts(products.filter(p => p.id !== productId))
    }
  }

  const handleToggleActive = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)

    if (!error) {
      setProducts(products.map(p =>
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      ))
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingProduct(null)
    loadProducts()
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading products...</p>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSuccess={handleFormSuccess}
          onClose={handleCloseForm}
        />
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 mb-4">No products yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-600 font-medium hover:text-blue-800"
          >
            Add your first product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                !product.is_active ? 'opacity-60' : ''
              }`}
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
                {!product.is_active && (
                  <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    Hidden
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-lg font-bold text-blue-600 mb-3">
                  ฿{product.price.toLocaleString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 text-sm text-gray-600 hover:text-gray-900 py-2 border rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(product)}
                    className="flex-1 text-sm text-gray-600 hover:text-gray-900 py-2 border rounded"
                  >
                    {product.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-sm text-red-600 hover:text-red-800 py-2 px-3 border border-red-200 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
