'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Gig } from '@/lib/types'
import { Calendar } from 'lucide-react'
import GigTable from '@/components/GigTable'
import GigForm from '@/components/GigForm'
import { useSearchParams, useRouter } from 'next/navigation'

import { useToast } from '@/components/providers/ToastProvider'

interface DashboardClientProps {
    initialGigs: Gig[]
}

export default function DashboardClient({ initialGigs }: DashboardClientProps) {
    const [gigs, setGigs] = useState<Gig[]>(initialGigs)
    const [loading, setLoading] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [initialFormData, setInitialFormData] = useState<Partial<Gig> | undefined>(undefined)
    const [activeTab, setActiveTab] = useState<'schedule' | 'drafts'>('schedule')
    const toast = useToast()

    const searchParams = useSearchParams()
    const router = useRouter()

    // Sync state with server data on refresh
    useEffect(() => {
        setGigs(initialGigs)
    }, [initialGigs])

    // Handle URL params for "Create Gig from Email"
    useEffect(() => {
        const action = searchParams.get('action')
        if (action === 'create') {
            setInitialFormData({
                venue_name: searchParams.get('venue') || '',
                contact_name: searchParams.get('contact_name') || '',
                contact_email: searchParams.get('contact_email') || '',
                date: searchParams.get('date') || '',
            })
            setShowAddModal(true)
            // Clean up URL
            router.replace('/')
        }
    }, [searchParams, router])

    const fetchGigs = async () => {
        // We only need to fetch if we want to refresh data
        setLoading(true)
        const { data, error } = await supabase
            .from('gigs')
            .select('*')
            .order('date', { ascending: true })

        if (error) {
            console.error('Error fetching gigs:', error)
            toast.error('Failed to fetch gigs')
        } else {
            setGigs(data as Gig[])
        }
        setLoading(false)
    }

    useEffect(() => {
        // Subscribe to realtime changes
        const channel = supabase
            .channel('gigs_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs' }, () => {
                fetchGigs()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const [isChecking, setIsChecking] = useState(false)

    const handleCheckEmails = async () => {
        setIsChecking(true)
        try {
            // 1. Sync Mail
            const syncRes = await fetch('/api/sync-mail')
            const syncData = await syncRes.json()
            console.log('Sync result:', syncData)

            // 2. Process Drafts
            const processRes = await fetch('/api/process-drafts')
            const processData = await processRes.json()
            console.log('Process result:', processData)

            if (processData.drafts_created > 0) {
                toast.success(`Assistant found ${processData.drafts_created} new potential gigs!`)
                fetchGigs() // Refresh the list
            } else {
                toast.info('No new gigs found in emails.')
            }
        } catch (error: any) {
            console.error('Error checking emails:', error)
            toast.error(error.message || 'Failed to check emails')
        } finally {
            setIsChecking(false)
        }
    }

    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('All')
    const [showPastGigs, setShowPastGigs] = useState(false)

    // Filter gigs based on active tab AND search/status filters
    const filteredGigs = gigs
        .filter(gig => {
            // 1. Tab Filter
            if (activeTab === 'drafts' && gig.status !== 'Draft') return false
            if (activeTab === 'schedule' && gig.status === 'Draft') return false

            // 2. Status Filter
            if (statusFilter !== 'All' && gig.status !== statusFilter) return false

            // 3. Past Gigs Filter
            if (!showPastGigs) {
                const gigDate = new Date(gig.date)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                if (gigDate < today) return false
            }

            // 4. Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchVenue = gig.venue_name.toLowerCase().includes(query)
                const matchLocation = gig.location.toLowerCase().includes(query)
                const matchContact = gig.contact_name?.toLowerCase().includes(query)
                return matchVenue || matchLocation || matchContact
            }

            return true
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="mb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                            GigManager
                        </h1>
                        <p className="text-gray-400">Band Management Dashboard</p>
                    </div>
                    <button
                        onClick={fetchGigs}
                        disabled={loading}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                        title="Refresh Data"
                    >
                        <span className={loading ? "animate-spin block" : ""}>↻</span>
                    </button>
                </div>
                <div className="flex gap-3">
                    {/* Seed Button (Dev only, hidden in prod ideally) */}
                    <button
                        onClick={async () => {
                            if (confirm('Add example data?')) {
                                await fetch('/api/seed')
                                fetchGigs()
                            }
                        }}
                        className="text-xs text-gray-600 hover:text-gray-400"
                    >
                        + Seed Data
                    </button>
                    <a
                        href="/mailbox"
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        Go to Mailbox
                    </a>
                </div>
            </header>

            <main>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`px-4 py-2 rounded-lg transition-colors font-medium ${activeTab === 'schedule'
                                ? 'bg-gray-800 text-white border border-purple-500/50'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                        >
                            Schedule
                        </button>
                        <button
                            onClick={() => setActiveTab('drafts')}
                            className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${activeTab === 'drafts'
                                ? 'bg-gray-800 text-white border border-purple-500/50'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                        >
                            Drafts
                            {gigs.filter(g => g.status === 'Draft').length > 0 && (
                                <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                                    {gigs.filter(g => g.status === 'Draft').length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex flex-1 w-full md:w-auto md:justify-end gap-3 items-center flex-wrap">
                        {/* Search & Filter Controls */}
                        <div className="flex gap-2 w-full md:w-auto items-center">
                            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer mr-2 select-none">
                                <input
                                    type="checkbox"
                                    checked={showPastGigs}
                                    onChange={(e) => setShowPastGigs(e.target.checked)}
                                    className="rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500"
                                />
                                Show Past
                            </label>

                            <input
                                type="text"
                                placeholder="Search venue, city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-800 border border-gray-700 text-sm rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500 outline-none w-full md:w-48"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-gray-800 border border-gray-700 text-sm rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-purple-500 outline-none"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Lead">Lead</option>
                                <option value="Contract Sent">Contract Sent</option>
                                <option value="Done">Done</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        {activeTab === 'drafts' && (
                            <button
                                onClick={handleCheckEmails}
                                disabled={isChecking}
                                className="bg-gray-800 hover:bg-gray-700 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                            >
                                {isChecking ? (
                                    <span className="animate-spin">↻</span>
                                ) : (
                                    <span>✨</span>
                                )}
                                {isChecking ? 'Checking...' : 'Check Mail'}
                            </button>
                        )}

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                        >
                            + Add Gig
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Refreshing...</div>
                ) : filteredGigs.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
                        <div className="flex justify-center mb-4">
                            <Calendar className="w-16 h-16 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-300 mb-2">
                            {activeTab === 'drafts' ? 'No drafts found' : 'No upcoming gigs found'}
                        </h3>
                        <p className="text-gray-500">
                            {activeTab === 'drafts' ? 'The assistant hasn\'t found anything yet.' : 'Time to book some shows!'}
                        </p>
                        {activeTab === 'drafts' && (
                            <button
                                onClick={handleCheckEmails}
                                disabled={isChecking}
                                className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
                            >
                                {isChecking ? 'Scanning inbox...' : 'Scan inbox now'}
                            </button>
                        )}
                    </div>
                ) : (
                    <GigTable gigs={filteredGigs} onGigUpdate={fetchGigs} />
                )}

                {showAddModal && (
                    <GigForm
                        initialData={initialFormData}
                        onClose={() => {
                            setShowAddModal(false)
                            setInitialFormData(undefined)
                        }}
                        onGigUpdate={fetchGigs}
                    />
                )}
            </main>
        </div>
    )
}
