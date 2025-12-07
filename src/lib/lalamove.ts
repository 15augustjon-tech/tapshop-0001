import crypto from 'crypto'

const LALAMOVE_API_KEY = process.env.LALAMOVE_API_KEY || ''
const LALAMOVE_API_SECRET = process.env.LALAMOVE_API_SECRET || ''
const LALAMOVE_BASE_URL = process.env.LALAMOVE_BASE_URL || 'https://rest.sandbox.lalamove.com'

// Default coordinates for Bangkok city center (used when no coordinates provided)
const DEFAULT_BANGKOK_COORDS = { lat: 13.7563, lng: 100.5018 }

interface QuoteRequest {
  pickupAddress: string
  pickupCoordinates?: { lat: number; lng: number }
  deliveryAddress: string
  deliveryCoordinates?: { lat: number; lng: number }
}

interface QuoteResponse {
  quotationId: string
  priceBreakdown: {
    total: string
    currency: string
  }
  distance: {
    value: string
    unit: string
  }
}

interface BookingRequest {
  quotationId: string
  senderName: string
  senderPhone: string
  recipientName: string
  recipientPhone: string
  pickupAddress: string
  deliveryAddress: string
  pickupCoordinates?: { lat: number; lng: number }
  deliveryCoordinates?: { lat: number; lng: number }
  cashOnDelivery?: number
  remarks?: string
}

interface BookingResponse {
  orderId: string
  status: string
  shareLink?: string
  driverInfo?: {
    name: string
    phone: string
    plateNumber: string
  }
}

// Generate HMAC signature for Lalamove API
function generateSignature(method: string, path: string, timestamp: string, body: string): string {
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`
  return crypto
    .createHmac('sha256', LALAMOVE_API_SECRET)
    .update(rawSignature)
    .digest('hex')
}

// Make authenticated request to Lalamove API
async function lalamoveRequest(method: string, path: string, body?: object): Promise<Response> {
  const timestamp = Date.now().toString()
  const bodyString = body ? JSON.stringify(body) : ''
  const signature = generateSignature(method, path, timestamp, bodyString)

  const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `hmac ${LALAMOVE_API_KEY}:${timestamp}:${signature}`,
      'Market': 'TH',
      'Request-ID': crypto.randomUUID(),
    },
    body: bodyString || undefined,
  })

  return response
}

// Get delivery quote from Lalamove
export async function getDeliveryQuote(request: QuoteRequest): Promise<{ fee: number; quotationId: string } | null> {
  // Check if Lalamove is configured
  if (!LALAMOVE_API_KEY || !LALAMOVE_API_SECRET) {
    console.log('Lalamove not configured, using mock quote')
    return null
  }

  try {
    const body = {
      data: {
        serviceType: 'MOTORCYCLE',
        language: 'th_TH',
        stops: [
          {
            coordinates: request.pickupCoordinates || DEFAULT_BANGKOK_COORDS,
            address: request.pickupAddress,
          },
          {
            coordinates: request.deliveryCoordinates || DEFAULT_BANGKOK_COORDS,
            address: request.deliveryAddress,
          },
        ],
      },
    }

    const response = await lalamoveRequest('POST', '/v3/quotations', body)

    if (!response.ok) {
      const error = await response.text()
      console.error('Lalamove quote error:', error)
      return null
    }

    const data: QuoteResponse = await response.json()
    const baseFee = parseFloat(data.priceBreakdown?.total || '0')

    // Validate fee is a valid number
    if (Number.isNaN(baseFee) || baseFee <= 0) {
      console.error('Invalid fee from Lalamove:', data.priceBreakdown)
      return null
    }

    return {
      fee: baseFee,
      quotationId: data.quotationId,
    }
  } catch (error) {
    console.error('Lalamove quote error:', error)
    return null
  }
}

// Book delivery with Lalamove
export async function bookDelivery(request: BookingRequest): Promise<BookingResponse | null> {
  // Check if Lalamove is configured
  if (!LALAMOVE_API_KEY || !LALAMOVE_API_SECRET) {
    console.log('Lalamove not configured, cannot book delivery')
    return null
  }

  try {
    const body = {
      data: {
        quotationId: request.quotationId,
        sender: {
          stopId: crypto.randomUUID(),
          name: request.senderName,
          phone: request.senderPhone,
        },
        recipients: [
          {
            stopId: crypto.randomUUID(),
            name: request.recipientName,
            phone: request.recipientPhone,
            remarks: request.remarks || '',
          },
        ],
        isPODEnabled: false,
        metadata: {},
      },
    }

    // Add COD if specified
    if (request.cashOnDelivery && request.cashOnDelivery > 0) {
      // Lalamove COD is handled differently - add to metadata
      (body.data.metadata as Record<string, unknown>).cashOnDelivery = request.cashOnDelivery
    }

    const response = await lalamoveRequest('POST', '/v3/orders', body)

    if (!response.ok) {
      const error = await response.text()
      console.error('Lalamove booking error:', error)
      return null
    }

    const data = await response.json()

    return {
      orderId: data.data.orderId,
      status: data.data.status,
      shareLink: data.data.shareLink,
    }
  } catch (error) {
    console.error('Lalamove booking error:', error)
    return null
  }
}

// Calculate TapShop fee (15% markup, rounded to nearest 5 baht)
export function calculateTapShopFee(lalamoveFee: number): number {
  const withMarkup = lalamoveFee * 1.15
  return Math.ceil(withMarkup / 5) * 5
}

// Generate mock quote for testing (when Lalamove not configured)
export function getMockQuote(): { fee: number; quotationId: string } {
  // Random fee between 50-150 baht, rounded to 5
  const baseFee = Math.floor(Math.random() * 100) + 50
  const roundedFee = Math.ceil(baseFee / 5) * 5

  return {
    fee: roundedFee,
    quotationId: `mock_${Date.now()}`,
  }
}
