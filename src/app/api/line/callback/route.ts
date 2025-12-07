import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // This is the seller_id

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=missing_params', request.url))
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/line/callback`,
        client_id: process.env.LINE_LOGIN_CHANNEL_ID || '',
        client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET || '',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('LINE token error:', await tokenResponse.text())
      return NextResponse.redirect(new URL('/dashboard/settings?error=token_failed', request.url))
    }

    const tokenData = await tokenResponse.json()

    // Get user profile
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!profileResponse.ok) {
      console.error('LINE profile error:', await profileResponse.text())
      return NextResponse.redirect(new URL('/dashboard/settings?error=profile_failed', request.url))
    }

    const profile = await profileResponse.json()

    // Save LINE user ID to seller
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('sellers')
      .update({ line_user_id: profile.userId })
      .eq('id', state)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.redirect(new URL('/dashboard/settings?error=save_failed', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard/settings?line=connected', request.url))
  } catch (error) {
    console.error('LINE callback error:', error)
    return NextResponse.redirect(new URL('/dashboard/settings?error=unknown', request.url))
  }
}
