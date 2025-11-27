'use client'

import { useState } from 'react'
import { Gig } from '@/lib/types'
import { Calendar, MapPin, DollarSign, Clock, ChevronRight } from 'lucide-react'
import GigDetails from './GigDetails'

interface GigTableProps {
    gigs: Gig[]
    onGigUpdate: () => void
}

export default function GigTable({ gigs, onGigUpdate }: GigTableProps) {
    const [selectedGigId, setSelectedGigId] = useState<string | null>(null)

    const selectedGig = selectedGigId ? gigs.find(g => g.id === selectedGigId) || null : null

    return (
        <>
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-900/50 text-gray-200 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Venue</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Fee</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {gigs.map((gig) => {
                                const isPast = new Date(gig.date) < new Date(new Date().setHours(0, 0, 0, 0))
                                return (
                                    <tr
                                        key={gig.id}
                                        onClick={() => setSelectedGigId(gig.id)}
                                        className={`hover:bg-gray-700/50 transition-colors cursor-pointer group ${isPast ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-purple-400 font-medium">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(gig.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white group-hover:text-purple-300 transition-colors">
                                            <div className="flex items-center gap-2">
                                                {gig.venue_name}
                                                {gig.has_unseen_ai_updates && (
                                                    <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold animate-pulse">
                                                        New Info
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{gig.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${gig.status === 'Confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                gig.status === 'Lead' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    gig.status === 'Contract Sent' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        gig.status === 'Done' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {gig.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-300">
                                            € {gig.fee}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedGig && (
                <GigDetails gig={selectedGig} onClose={() => setSelectedGigId(null)} onGigUpdate={onGigUpdate} />
            )}
        </>
    )
}
