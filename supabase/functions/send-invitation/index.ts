// Supabase Edge Function: send-invitation
// Sends invitation emails using Resend API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationEmailRequest {
  email: string
  organizationName: string
  inviterName: string
  roleName: string
  projectName?: string
  inviteLink: string
  personalMessage?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      email,
      organizationName,
      inviterName,
      roleName,
      projectName,
      inviteLink,
      personalMessage
    }: InvitationEmailRequest = await req.json()

    // Validate required fields
    if (!email || !organizationName || !inviterName || !inviteLink) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If no Resend API key, log and return success (dev mode)
    if (!RESEND_API_KEY) {
      console.log('📧 [DEV MODE] Would send invitation email to:', email)
      console.log('📧 Invite link:', inviteLink)
      return new Response(
        JSON.stringify({ success: true, mode: 'dev', message: 'Email logged (no API key)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build email HTML
    const projectSection = projectName
      ? `<p style="margin: 8px 0; color: #3b82f6;">+ Also added to project: <strong>${projectName}</strong></p>`
      : ''

    const messageSection = personalMessage
      ? `<div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0;">
           <p style="margin: 0; color: #92400e; font-style: italic;">"${personalMessage}"</p>
         </div>`
      : ''

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to ${organizationName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">You're Invited!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
        <strong style="color: #1e293b;">${inviterName}</strong> has invited you to join their team on EASYUP.
      </p>

      <!-- Organization Card -->
      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; background-color: #6366f1; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 20px; font-weight: bold;">${organizationName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 style="margin: 0; color: #1e293b; font-size: 18px;">${organizationName}</h2>
            <p style="margin: 4px 0 0; color: #6366f1; font-size: 14px;">as ${roleName}</p>
          </div>
        </div>
        ${projectSection}
      </div>

      ${messageSection}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Accept Invitation
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 24px 0 0;">
        This invitation expires in 7 days.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        EASYUP - Social Media Campaign Management
      </p>
    </div>
  </div>
</body>
</html>
    `

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'EASYUP <noreply@easyup.ge>',
        to: [email],
        subject: `${inviterName} invited you to join ${organizationName} on EASYUP`,
        html: emailHtml,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', data)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: data }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Email sent successfully to:', email)
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
