import { NextResponse } from 'next/server'

import imaps from 'imap-simple'
import { simpleParser } from 'mailparser'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Helper to recursively find all mailbox paths
function getMailboxPaths(boxes: any, parentPath: string = ''): string[] {
    let paths: string[] = []

    for (const key in boxes) {
        const box = boxes[key]
        const path = parentPath ? `${parentPath}${box.delimiter}${key}` : key

        // Filter for INBOX and Contact folders only
        const lowerKey = key.toLowerCase()
        if (lowerKey === 'inbox' || lowerKey.includes('contact')) {
            paths.push(path)
        }

        if (box.children) {
            paths = paths.concat(getMailboxPaths(box.children, path))
        }
    }
    return paths
}

export async function GET() {
    const config = {
        imap: {
            user: process.env.MAIL_USER!,
            password: process.env.MAIL_PASSWORD!,
            host: process.env.MAIL_IMAP_HOST!,
            port: parseInt(process.env.MAIL_IMAP_PORT || '993'),
            tls: true,
            tlsOptions: { rejectUnauthorized: false }, // For development/Gmail
            authTimeout: 10000,
        },
    }

    try {
        const connection = await imaps.connect(config)

        // 1. Discover all folders
        const boxes = await connection.getBoxes()
        const foldersToSync = getMailboxPaths(boxes)
        console.log('Syncing folders:', foldersToSync)

        let totalSynced = 0

        // 2. Iterate and sync each folder
        for (const folder of foldersToSync) {
            try {
                await connection.openBox(folder)

                // Fetch last 20 emails per folder
                const searchCriteria = ['ALL']
                const fetchOptions = {
                    bodies: [''], // Fetch full source
                    markSeen: false,
                    struct: true,
                }

                const messages = await connection.search(searchCriteria, fetchOptions)
                const recentMessages = messages.slice(-20) // Limit to 20 per folder to keep it fast

                for (const message of recentMessages) {
                    const id = message.attributes.uid.toString()
                    // Create a unique ID combining folder and UID to avoid collisions if UIDs are not unique across folders
                    // However, for this app, we might want to treat the same message moved to another folder as the same message?
                    // Standard IMAP UIDs are unique per folder. Message-ID header is unique per email.
                    // We'll try to use Message-ID from parsing if possible, otherwise fallback to folder-uid.

                    const rawSource = message.parts.find((part: any) => part.which === '')?.body

                    if (rawSource) {
                        try {
                            const parsed = await simpleParser(rawSource)

                            const subject = parsed.subject || '(No Subject)'
                            const sender = parsed.from?.text || '(Unknown Sender)'
                            const body = parsed.text || parsed.html || ''
                            const date = parsed.date || new Date()
                            const messageIdHeader = parsed.messageId

                            // Use Message-ID header as primary key if available, otherwise folder-uid
                            const dbId = messageIdHeader || `${folder}-${id}`

                            const { error } = await supabase
                                .from('emails')
                                .upsert({
                                    id: dbId,
                                    subject: subject,
                                    sender: sender,
                                    body: body,
                                    received_at: date.toISOString(),
                                    folder: folder,
                                }, { onConflict: 'id' })

                            if (!error) {
                                totalSynced++
                            }
                        } catch (parseError) {
                            console.error(`Failed to parse email in ${folder}`, id, parseError)
                        }
                    }
                }
            } catch (folderError) {
                console.warn(`Could not sync folder ${folder}:`, folderError)
                // Continue to next folder
            }
        }

        connection.end()

        return NextResponse.json({ success: true, synced: totalSynced, folders: foldersToSync })
    } catch (error) {
        console.error('Mail Sync Error:', error)
        return NextResponse.json({ error: 'Failed to sync mail' }, { status: 500 })
    }
}
