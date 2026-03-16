import nodemailer from 'nodemailer'

function getTransporter() {
  if (!process.env.EMAIL_SERVER_HOST) return null
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })
}

interface BookingEmailParams {
  guestName: string
  guestEmail: string
  hostName: string
  hostEmail: string
  eventTitle: string
  startTime: Date
  endTime: Date
  cancelToken: string
  rescheduleToken: string
  baseUrl: string
  notes?: string
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export async function sendBookingConfirmation(params: BookingEmailParams) {
  const transporter = getTransporter()
  const { guestName, guestEmail, hostName, hostEmail, eventTitle, startTime, endTime, cancelToken, rescheduleToken, baseUrl, notes } = params
  const cancelUrl = `${baseUrl}/booking/${cancelToken}/cancel`
  const rescheduleUrl = `${baseUrl}/booking/${rescheduleToken}/reschedule`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #3b82f6; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Meeting Confirmed!</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hi ${guestName},</p>
        <p>Your meeting with <strong>${hostName}</strong> has been confirmed.</p>

        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="margin: 0 0 12px; font-size: 18px; color: #1f2937;">${eventTitle}</h2>
          <p style="margin: 4px 0; color: #6b7280;"><strong>When:</strong> ${formatDateTime(startTime)}</p>
          <p style="margin: 4px 0; color: #6b7280;"><strong>Duration:</strong> ${Math.round((endTime.getTime() - startTime.getTime()) / 60000)} minutes</p>
          ${notes ? `<p style="margin: 4px 0; color: #6b7280;"><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>

        <p>Need to make changes?</p>
        <div style="margin: 16px 0;">
          <a href="${rescheduleUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-right: 12px;">Reschedule</a>
          <a href="${cancelUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Cancel</a>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">This is an automated email from Calenderize.</p>
      </div>
    </div>
  `

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
    to: guestEmail,
    cc: hostEmail,
    subject: `Meeting Confirmed: ${eventTitle} with ${hostName}`,
    html,
  }

  if (!transporter) {
    console.log('=== EMAIL (no SMTP configured) ===')
    console.log('To:', guestEmail)
    console.log('Subject:', mailOptions.subject)
    console.log('Cancel URL:', cancelUrl)
    console.log('Reschedule URL:', rescheduleUrl)
    return
  }

  await transporter.sendMail(mailOptions)
}

export async function sendCancellationEmail(params: {
  guestName: string
  guestEmail: string
  hostName: string
  hostEmail: string
  eventTitle: string
  startTime: Date
}) {
  const transporter = getTransporter()
  const { guestName, guestEmail, hostName, eventTitle, startTime } = params

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #ef4444; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Meeting Cancelled</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hi ${guestName},</p>
        <p>Your meeting with <strong>${hostName}</strong> has been cancelled.</p>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="margin: 0 0 12px; font-size: 18px; color: #1f2937;">${eventTitle}</h2>
          <p style="margin: 4px 0; color: #6b7280;"><strong>Was scheduled for:</strong> ${formatDateTime(startTime)}</p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">This is an automated email from Calenderize.</p>
      </div>
    </div>
  `

  if (!transporter) {
    console.log('=== CANCELLATION EMAIL (no SMTP configured) ===')
    console.log('To:', guestEmail)
    return
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
    to: guestEmail,
    subject: `Meeting Cancelled: ${eventTitle} with ${hostName}`,
    html,
  })
}
