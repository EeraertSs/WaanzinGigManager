import { NextResponse } from 'next/server'
import imaps from 'imap-simple'
import { simpleParser } from 'mailparser'

export const revalidate = 0

export async function GET() {
    try {
        const config = {
            imap: {
                user: process.env.IMAP_USER!,
                password: process.env.IMAP_PASS!,
                host: process.env.IMAP_HOST!,
                port: Number(process.env.IMAP_PORT!),
                tls: true,
                tlsOptions: { rejectUnauthorized: false }, // Fix for self-signed certs
                authTimeout: 10000,
            },
        }

        const connection = await imaps.connect(config)
        await connection.openBox('INBOX')

        const searchCriteria = ['ALL']
        // 1. Fetch only UIDs first (fast)
        const allMessages = await connection.search(searchCriteria, {
            bodies: ['HEADER.FIELDS (DATE)'],
            struct: false
        })

        // 2. Get last 20 UIDs
        const recentMessages = allMessages.slice(-20)

        if (recentMessages.length === 0) {
            connection.end()
            return NextResponse.json({ emails: [] })
        }

        const uids = recentMessages.map(m => m.attributes.uid)

        // 3. Fetch full content for these UIDs
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false,
            struct: true
        }

        const messages = await connection.search([['UID', ...uids]], fetchOptions)

        // Sort by UID descending (newest first)
        messages.sort((a, b) => b.attributes.uid - a.attributes.uid)

        const emails = await Promise.all(
            messages.map(async (message) => {
                const all = message.parts.find((part) => part.which === 'TEXT')
                const id = message.attributes.uid

                const source = (all && all.body) ? all.body : ''

                // Simple parsing of header
                const headerPart = message.parts.find((part) => part.which === 'HEADER')
                const headerBody = headerPart?.body || {}

                return {
                    id,
                    from: headerBody.from ? headerBody.from[0] : 'Unknown',
                    subject: headerBody.subject ? headerBody.subject[0] : 'No Subject',
                    date: headerBody.date ? headerBody.date[0] : new Date().toISOString(),
                    body: source,
                    snippet: source.substring(0, 100) + '...'
                }
            })
        )

        connection.end()

        return NextResponse.json({ emails })
    } catch (error: any) {
        console.error('Error fetching emails:', error)
        return NextResponse.json(
            { error: 'Failed to fetch emails', details: error.message },
            { status: 500 }
        )
    }
}
