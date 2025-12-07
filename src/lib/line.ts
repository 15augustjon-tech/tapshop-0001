const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || ''

interface SendMessageOptions {
  to: string // LINE user ID
  message: string
}

interface OrderNotification {
  orderNumber: string
  buyerName: string
  buyerPhone: string
  buyerAddress: string
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  deliveryFee: number
  total: number
}

// Check if LINE is configured
export function isLineConfigured(): boolean {
  return !!LINE_CHANNEL_ACCESS_TOKEN
}

// Send a text message via LINE
export async function sendLineMessage({ to, message }: SendMessageOptions): Promise<boolean> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.log('LINE not configured, skipping notification')
    return false
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('LINE API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('LINE notification error:', error)
    return false
  }
}

// Send new order notification to seller
export async function sendNewOrderNotification(
  lineUserId: string,
  order: OrderNotification
): Promise<boolean> {
  const itemsList = order.items
    .map(item => `  - ${item.name} x${item.quantity} (฿${(item.price * item.quantity).toLocaleString()})`)
    .join('\n')

  const message = `🛒 New Order! #${order.orderNumber}

📦 Items:
${itemsList}

💰 Payment:
  Subtotal: ฿${order.subtotal.toLocaleString()}
  Delivery: ฿${order.deliveryFee.toLocaleString()} (COD)
  Total: ฿${order.total.toLocaleString()}

📍 Deliver to:
  ${order.buyerName}
  ${order.buyerPhone}
  ${order.buyerAddress}

👉 Go to your dashboard to confirm payment and ship!`

  return sendLineMessage({ to: lineUserId, message })
}

// Send order shipped notification to buyer (if we have their LINE)
export async function sendOrderShippedNotification(
  lineUserId: string,
  orderNumber: string,
  trackingLink?: string
): Promise<boolean> {
  let message = `🛵 Your order #${orderNumber} is on the way!

A driver has been assigned and will deliver your order soon.`

  if (trackingLink) {
    message += `\n\n📍 Track your delivery:\n${trackingLink}`
  }

  message += `\n\nPlease prepare ฿ for delivery fee (cash).`

  return sendLineMessage({ to: lineUserId, message })
}

// Send payment confirmed notification
export async function sendPaymentConfirmedNotification(
  lineUserId: string,
  orderNumber: string
): Promise<boolean> {
  const message = `✅ Payment confirmed for order #${orderNumber}!

Your order is being prepared for shipping. We'll notify you when the driver is on the way.`

  return sendLineMessage({ to: lineUserId, message })
}

// Generate LINE Login URL for linking account
export function getLineLoginUrl(state: string): string {
  const clientId = process.env.LINE_LOGIN_CHANNEL_ID || ''
  const redirectUri = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/line/callback`
  )

  return `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid`
}
