export interface Seller {
  id: string
  phone: string
  shop_name: string
  shop_slug: string
  promptpay_id: string | null
  pickup_address: string | null
  pickup_lat: number | null
  pickup_lng: number | null
  profile_image_url: string | null
  line_user_id: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  seller_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  seller_id: string
  buyer_name: string
  buyer_phone: string
  buyer_address: string
  buyer_lat: number | null
  buyer_lng: number | null
  product_details: ProductDetail[]
  subtotal: number
  delivery_fee: number
  delivery_cost: number | null
  total_amount: number
  payment_method: string
  payment_status: 'pending' | 'confirmed'
  order_status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  lalamove_order_id: string | null
  lalamove_share_link: string | null
  created_at: string
  updated_at: string
}

export interface ProductDetail {
  product_id: string
  name: string
  price: number
  quantity: number
}

export interface Delivery {
  id: string
  order_id: string
  lalamove_order_id: string | null
  status: string
  pickup_address: string | null
  delivery_address: string | null
  quoted_fee: number | null
  actual_cost: number | null
  share_link: string | null
  driver_name: string | null
  driver_phone: string | null
  driver_plate_number: string | null
  created_at: string
  updated_at: string
}
