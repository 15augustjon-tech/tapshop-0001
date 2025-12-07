// Thai phone number validation
// Valid formats: 0812345678, 08-1234-5678, 08 1234 5678, +66812345678

export function isValidThaiPhone(phone: string): boolean {
  // Remove spaces, dashes, and dots
  const cleaned = phone.replace(/[\s\-\.]/g, '')

  // Thai mobile: starts with 06, 08, 09 followed by 8 digits (10 digits total)
  // Or international format: +66 followed by 9 digits
  const thaiMobileRegex = /^0[689]\d{8}$/
  const internationalRegex = /^\+66[689]\d{8}$/

  return thaiMobileRegex.test(cleaned) || internationalRegex.test(cleaned)
}

export function formatThaiPhone(phone: string): string {
  // Remove all non-digits except +
  const cleaned = phone.replace(/[^\d+]/g, '')

  // Format as 0XX-XXX-XXXX
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  // Format international as +66 XX XXX XXXX
  if (cleaned.startsWith('+66') && cleaned.length === 12) {
    return `+66 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }

  return phone
}

export function normalizeThaiPhone(phone: string): string {
  // Remove all non-digits except +
  const cleaned = phone.replace(/[^\d+]/g, '')

  // Convert international to local format
  if (cleaned.startsWith('+66')) {
    return '0' + cleaned.slice(3)
  }

  return cleaned
}

// PromptPay ID validation
// Can be phone number (10 digits) or National ID (13 digits)
export function isValidPromptPayId(id: string): boolean {
  const cleaned = id.replace(/[\s\-]/g, '')

  // Phone number: 10 digits starting with 0
  const phoneRegex = /^0\d{9}$/
  // National ID: 13 digits
  const nationalIdRegex = /^\d{13}$/

  return phoneRegex.test(cleaned) || nationalIdRegex.test(cleaned)
}

// Address validation - basic check for minimum content
export function isValidAddress(address: string): { valid: boolean; message?: string } {
  const trimmed = address.trim()

  if (trimmed.length < 20) {
    return { valid: false, message: 'Address seems too short. Please include full details.' }
  }

  // Check for some basic address components (in Thai or English)
  const hasNumber = /\d/.test(trimmed)

  if (!hasNumber) {
    return { valid: false, message: 'Please include a house/building number.' }
  }

  return { valid: true }
}
