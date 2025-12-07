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

// Send a text message via LINE
async function sendLineMessage({ to, message }: SendMessageOptions): Promise<boolean> {
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

  const message = `New Order! #${order.orderNumber}

Items:
${itemsList}

Payment:
  Subtotal: ฿${order.subtotal.toLocaleString()}
  Delivery: ฿${order.deliveryFee.toLocaleString()} (COD)
  Total: ฿${order.total.toLocaleString()}

Deliver to:
  ${order.buyerName}
  ${order.buyerPhone}
  ${order.buyerAddress}

Go to your dashboard to confirm payment and ship!`

  return sendLineMessage({ to: lineUserId, message })
}
