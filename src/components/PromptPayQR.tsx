'use client'

import { useState, useEffect } from 'react'
import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'

interface PromptPayQRProps {
  promptpayId: string
  amount: number
}

export default function PromptPayQR({ promptpayId, amount }: PromptPayQRProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateQR = async () => {
      try {
        // Clean the promptpay ID (remove dashes and spaces)
        const cleanId = promptpayId.replace(/[-\s]/g, '')

        // Generate PromptPay payload
        const payload = generatePayload(cleanId, { amount })

        // Generate QR code as data URL
        const url = await QRCode.toDataURL(payload, {
          width: 280,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })

        setQrCodeUrl(url)
        setError(null)
      } catch (err) {
        console.error('QR generation error:', err)
        setError('Could not generate QR code')
      }
    }

    if (promptpayId && amount > 0) {
      generateQR()
    }
  }, [promptpayId, amount])

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-600">PromptPay ID:</p>
        <p className="text-lg font-mono font-bold">{promptpayId}</p>
        <p className="text-xs text-orange-600 mt-2">{error}</p>
      </div>
    )
  }

  if (!qrCodeUrl) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-gray-400">Generating QR...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <img
        src={qrCodeUrl}
        alt="PromptPay QR Code"
        className="w-56 h-56 rounded-lg border-4 border-blue-100"
      />
      <p className="text-xs text-gray-500 mt-2">
        Scan with any Thai banking app
      </p>
      <p className="text-xs text-gray-400 mt-1">
        ID: {promptpayId}
      </p>
    </div>
  )
}
