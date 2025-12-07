import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Product, Seller } from '@/lib/types'
import StorefrontClient from './StorefrontClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function StorefrontPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Get seller by slug
  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('shop_slug', slug)
    .single()

  if (!seller) {
    notFound()
  }

  // Get active products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', seller.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <StorefrontClient
      seller={seller as Seller}
      products={(products || []) as Product[]}
    />
  )
}
