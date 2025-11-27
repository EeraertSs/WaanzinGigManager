import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
    try {
        const { to, subject, text } = await request.json()

        if (!to || !subject || !text) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_SMTP_HOST,
            port: Number(process.env.MAIL_SMTP_PORT || 465),
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
        })

        const info = await transporter.sendMail({
            from: process.env.MAIL_USER,
            to,
            subject,
            text,
        })

        return NextResponse.json({ success: true, messageId: info.messageId })
    } catch (error: any) {
        console.error('Error sending email:', error)
        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        )
    }
}
