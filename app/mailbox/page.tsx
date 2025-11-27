'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { RefreshCw, Send, Plus, Loader2, Mail, Calendar, ChevronLeft, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EMAIL_TEMPLATES } from './templates'

interface Email {
    id: string
    subject: string
    sender: string
    body: string
    received_at: string
    is_processed: boolean
    folder?: string
}

export default function Mailbox() {
    const [emails, setEmails] = useState<Email[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
    const [composing, setComposing] = useState(false)
    const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' })
    const [sending, setSending] = useState(false)

    const router = useRouter()

    const fetchEmailsFromDB = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('emails')
            .select('*')
            .order('received_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching emails:', error)
        } else {
            setEmails(data as Email[])
        }
        setLoading(false)
    }

    const syncMail = async () => {
        setSyncing(true)
        try {
            await fetch('/api/sync-mail')
            await fetchEmailsFromDB()
        } catch (error) {
            console.error('Sync failed', error)
        } finally {
            setSyncing(false)
        }
    }

    useEffect(() => {
        fetchEmailsFromDB()
        // Auto-sync on load
        syncMail()
    }, [])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        setSending(true)
        try {
            const res = await fetch('/api/mail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(composeData)
            })
            if (res.ok) {
                alert('Email sent!')
                setComposing(false)
                setComposeData({ to: '', subject: '', body: '' })
            } else {
                alert('Failed to send')
            }
        } catch (error) {
            console.error(error)
            alert('Error sending email')
        } finally {
            setSending(false)
        }
    }

    const handleCreateGig = () => {
        if (!selectedEmail) return

        // Extract data for pre-filling
        const params = new URLSearchParams({
            action: 'create',
            venue: selectedEmail.subject, // Guess venue from subject
            contact_name: selectedEmail.sender.split('<')[0].trim(), // Extract name
            contact_email: selectedEmail.sender.match(/<(.+)>/)?.[1] || '', // Extract email
            date: selectedEmail.received_at,
        })

        router.push(`/?${params.toString()}`)
    }

    const [selectedFolder, setSelectedFolder] = useState<string>('ALL')

    // Get unique folders
    const folders = ['ALL', ...Array.from(new Set(emails.map(e => e.folder).filter(Boolean) as string[]))]

    const filteredEmails = selectedFolder === 'ALL'
        ? emails
        : emails.filter(e => e.folder === selectedFolder)

    return (
        <div className="min-h-screen bg-gray-900 text-white flex">
            {/* Sidebar / List */}
            <div className="w-1/3 border-r border-gray-700 flex flex-col">
                <div className="p-3 border-b border-gray-700 flex flex-col gap-3 bg-gray-800">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.push('/')}
                                className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h1 className="font-bold text-lg flex items-center gap-2">
                                <Mail className="w-5 h-5 text-purple-500" />
                                Inbox
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={syncMail}
                                disabled={syncing}
                                className="p-1.5 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => setComposing(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Compose
                            </button>
                        </div>
                    </div>

                    {/* Folder Filter */}
                    <select
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-sm text-gray-300 focus:ring-1 focus:ring-purple-500 outline-none"
                    >
                        {folders.map(folder => (
                            <option key={folder} value={folder}>
                                {folder === 'ALL' ? 'All Folders' : folder.replace('INBOX.', '')}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading && emails.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
                    ) : (
                        filteredEmails.map(email => (
                            <div
                                key={email.id}
                                onClick={() => setSelectedEmail(email)}
                                className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${selectedEmail?.id === email.id ? 'bg-gray-800 border-l-4 border-l-purple-500' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-0.5">
                                    <div className="font-semibold truncate flex-1 text-sm">{email.sender.split('<')[0]}</div>
                                    <div className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                                        {new Date(email.received_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-gray-300 truncate flex-1">{email.subject}</div>
                                    {email.folder && selectedFolder === 'ALL' && (
                                        <span className="text-[9px] uppercase tracking-wider bg-gray-700 text-gray-400 px-1 py-px rounded">
                                            {email.folder.replace('INBOX.', '').substring(0, 3)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-gray-900">
                {composing ? (
                    <div className="p-8 max-w-2xl mx-auto w-full">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Compose Email</h2>
                            <div className="relative group">
                                <button type="button" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                    <FileText className="w-4 h-4" /> Templates
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden hidden group-hover:block z-10">
                                    {EMAIL_TEMPLATES.map(template => (
                                        <button
                                            key={template.id}
                                            type="button"
                                            onClick={() => setComposeData(prev => ({
                                                ...prev,
                                                body: prev.body ? prev.body + '\n\n' + template.body : template.body
                                            }))}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-700 text-sm border-b border-gray-700 last:border-0"
                                        >
                                            <div className="font-medium text-white">{template.name}</div>
                                            <div className="text-xs text-gray-400 truncate mt-1">{template.body.substring(0, 40)}...</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleSend} className="space-y-4">
                            <input
                                placeholder="To"
                                className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg"
                                value={composeData.to}
                                onChange={e => setComposeData({ ...composeData, to: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Subject"
                                className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg"
                                value={composeData.subject}
                                onChange={e => setComposeData({ ...composeData, subject: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Message..."
                                className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg h-64"
                                value={composeData.body}
                                onChange={e => setComposeData({ ...composeData, body: e.target.value })}
                                required
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setComposing(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : selectedEmail ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="p-6 border-b border-gray-700 bg-gray-800/50 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{selectedEmail.subject}</h2>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span className="font-medium text-white">{selectedEmail.sender}</span>
                                    <span>•</span>
                                    <span>{new Date(selectedEmail.received_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleCreateGig}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
                            >
                                <Calendar className="w-4 h-4" />
                                Create Gig
                            </button>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto whitespace-pre-wrap text-gray-300 leading-relaxed">
                            {selectedEmail.body}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <Mail className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">Select an email to read or compose a new one</p>
                    </div>
                )}
            </div>
        </div>
    )
}
