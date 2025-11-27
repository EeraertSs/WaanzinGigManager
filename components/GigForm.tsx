'use client'

import { useState } from 'react'
import { Gig, GigStatus, PaymentMethod } from '@/lib/types'
import { createGig, updateGig } from '@/app/actions'
import { X, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/providers/ToastProvider'

interface GigFormProps {
    gig?: Gig
    initialData?: Partial<Gig>
    onClose: () => void
    onGigUpdate: () => void
}

export default function GigForm({ gig, initialData, onClose, onGigUpdate }: GigFormProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const toast = useToast()

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        try {
            if (gig) {
                await updateGig(gig.id, formData)
            } else {
                await createGig(formData)
            }
            toast.success('Gig saved successfully!')
            onGigUpdate()
            router.refresh()
            onClose()
        } catch (error) {
            console.error('Failed to save gig', error)
            toast.error('Failed to save gig')
        } finally {
            setLoading(false)
        }
    }

    // Helper to get default value from gig or initialData
    const getDefault = (key: keyof Gig) => {
        if (gig) return gig[key]
        if (initialData && initialData[key]) return initialData[key]
        return ''
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className={`bg-gray-900 border border-gray-700 rounded-xl w-full ${gig?.ai_notes || (gig?.ai_proposed_updates && Object.keys(gig.ai_proposed_updates).length > 0) ? 'max-w-7xl' : 'max-w-2xl'} max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Main Form Section */}
                <div className="flex-1 flex flex-col max-h-[90vh] overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-900 z-10 shrink-0">
                        <h2 className="text-xl font-bold text-white">
                            {gig ? 'Edit Gig' : 'Add New Gig'}
                        </h2>
                        {/* Mobile close button */}
                        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-6 space-y-6">
                        <form id="gig-form" action={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Venue Name</label>
                                    <input
                                        name="venue_name"
                                        defaultValue={getDefault('venue_name') as string}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                    <input
                                        type="datetime-local"
                                        name="date"
                                        defaultValue={
                                            gig?.date
                                                ? new Date(gig.date).toISOString().slice(0, 16)
                                                : initialData?.date
                                                    ? new Date(initialData.date as string).toISOString().slice(0, 16)
                                                    : ''
                                        }
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                                    <input
                                        name="location"
                                        defaultValue={getDefault('location') as string}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                                    <select
                                        name="status"
                                        defaultValue={gig?.status || 'Draft'}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="Draft">Draft (Assistant)</option>
                                        <option value="Lead">Lead</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Contract Sent">Contract Sent</option>
                                        <option value="Done">Done</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Times */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Schedule</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Call Time</label>
                                        <input
                                            type="time"
                                            name="call_time"
                                            defaultValue={getDefault('call_time') as string}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            name="start_time"
                                            defaultValue={getDefault('start_time') as string}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            name="end_time"
                                            defaultValue={getDefault('end_time') as string}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Financials & PA */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Financials & Logistics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Fee (€)</label>
                                        <input
                                            type="number"
                                            name="fee"
                                            defaultValue={getDefault('fee') as number}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Payment Method</label>
                                        <select
                                            name="payment_method"
                                            defaultValue={gig?.payment_method || 'Invoice'}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="Invoice">Invoice</option>
                                            <option value="Cash">Cash</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name="is_free" defaultChecked={gig?.is_free} className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500" />
                                        <span className="text-sm text-gray-300">Pro Bono / Free Gig</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name="own_pa_required" defaultChecked={gig?.own_pa_required} className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-purple-600 focus:ring-purple-500" />
                                        <span className="text-sm text-gray-300">Own PA Required</span>
                                    </label>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">PA Cost (€)</label>
                                    <input
                                        type="number"
                                        name="pa_cost"
                                        defaultValue={getDefault('pa_cost') as number}
                                        placeholder="If we pay for PA"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Person</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                                        <input
                                            name="contact_name"
                                            defaultValue={getDefault('contact_name') as string}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="contact_email"
                                            defaultValue={getDefault('contact_email') as string}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Phone</label>
                                        <input
                                            name="contact_phone"
                                            defaultValue={getDefault('contact_phone') as string}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Hidden input to clear the 'unseen updates' flag when saving */}
                            <input type="hidden" name="has_unseen_ai_updates" value="false" />
                            <input type="hidden" name="clear_proposed_updates" value="false" />
                        </form>
                    </div>

                    <div className="flex justify-end gap-3 p-6 border-t border-gray-700 bg-gray-900 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="gig-form"
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save Gig'}
                        </button>
                    </div>
                </div>

                {/* AI Notes & Review Side Panel */}
                {(gig?.ai_notes || (gig?.ai_proposed_updates && Object.keys(gig.ai_proposed_updates).length > 0)) && (
                    <div className="w-full md:w-[500px] bg-gray-800/50 border-t md:border-t-0 md:border-l border-gray-700 p-6 overflow-y-auto shrink-0 flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                ✨ Assistant
                            </h3>
                            <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Proposed Updates Review Block */}
                        {gig?.ai_proposed_updates && Object.keys(gig.ai_proposed_updates).length > 0 && (
                            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                                <h4 className="text-sm font-bold text-white mb-3">Voorgestelde Updates</h4>
                                <div className="space-y-2 mb-4">
                                    {Object.entries(gig.ai_proposed_updates).map(([key, value]) => (
                                        <div key={key} className="text-xs">
                                            <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-red-400 line-through">
                                                    {(gig as any)[key] || 'Empty'}
                                                </span>
                                                <span className="text-gray-500">→</span>
                                                <span className="text-green-400 font-medium">
                                                    {String(value)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Apply updates to form inputs
                                            const form = document.getElementById('gig-form') as HTMLFormElement
                                            if (form && gig.ai_proposed_updates) {
                                                Object.entries(gig.ai_proposed_updates).forEach(([key, value]) => {
                                                    const input = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement
                                                    if (input) {
                                                        input.value = String(value)
                                                    }
                                                })
                                                // Clear proposed updates from DB on save (handled by hidden input below)
                                                const clearInput = form.elements.namedItem('clear_proposed_updates') as HTMLInputElement
                                                if (clearInput) clearInput.value = 'true'

                                                toast.success('Updates toegepast! Klik op Save om te bevestigen.')
                                            }
                                        }}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded transition-colors"
                                    >
                                        Accepteren
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const form = document.getElementById('gig-form') as HTMLFormElement
                                            const clearInput = form.elements.namedItem('clear_proposed_updates') as HTMLInputElement
                                            if (clearInput) clearInput.value = 'true'
                                            toast.info('Updates afgewezen. Klik op Save om te bevestigen.')
                                        }}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded transition-colors"
                                    >
                                        Afwijzen
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Notities</h4>
                            <textarea
                                name="ai_notes"
                                form="gig-form" // Link to form so it gets submitted
                                defaultValue={gig.ai_notes}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:ring-1 focus:ring-purple-500 outline-none h-[calc(100vh-400px)] font-mono whitespace-pre-wrap leading-relaxed"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
