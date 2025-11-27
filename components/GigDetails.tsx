'use client'

import { useState } from 'react'
import { Gig, GigStatus } from '@/lib/types'
import { deleteGig } from '@/app/actions'
import { X, Calendar, MapPin, DollarSign, Clock, User, Mail, Phone, CheckCircle, Trash2, Edit, Mic2, CreditCard } from 'lucide-react'
import GigForm from './GigForm'
import { useToast } from '@/components/providers/ToastProvider'

interface GigDetailsProps {
    gig: Gig
    onClose: () => void
    onGigUpdate: () => void
}

const STATUS_STEPS: GigStatus[] = ['Lead', 'Confirmed', 'Contract Sent', 'Done']

export default function GigDetails({ gig, onClose, onGigUpdate }: GigDetailsProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const toast = useToast()

    const currentStepIndex = STATUS_STEPS.indexOf(gig.status)
    const isCancelled = gig.status === 'Cancelled'

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this gig? This action cannot be undone.')) {
            setIsDeleting(true)
            try {
                await deleteGig(gig.id)
                toast.success('Gig deleted successfully')
                onGigUpdate()
                onClose()
            } catch (error) {
                console.error('Failed to delete gig', error)
                toast.error('Failed to delete gig')
            } finally {
                setIsDeleting(false)
            }
        }
    }

    if (isEditing) {
        return <GigForm gig={gig} onClose={() => setIsEditing(false)} onGigUpdate={onGigUpdate} />
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{gig.venue_name}</h2>
                        <p className="text-purple-400 font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(gig.date).toLocaleDateString()}
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400">{new Date(gig.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Status Timeline */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Status</h3>
                        {isCancelled ? (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                                <X className="w-5 h-5" />
                                <span className="font-medium">Gig Cancelled</span>
                            </div>
                        ) : (
                            <div className="relative flex justify-between">
                                {STATUS_STEPS.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex
                                    const isCurrent = index === currentStepIndex

                                    return (
                                        <div key={step} className="flex flex-col items-center relative z-10 w-full">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 transition-colors ${isCompleted
                                                ? 'bg-purple-600 border-purple-600 text-white'
                                                : 'bg-gray-900 border-gray-700 text-gray-700'
                                                }`}>
                                                {isCompleted && <CheckCircle className="w-5 h-5" />}
                                            </div>
                                            <div className={`text-xs text-center font-medium ${isCurrent ? 'text-white' : 'text-gray-500'}`}>
                                                {step}
                                            </div>

                                            {/* Connector Line */}
                                            {index !== STATUS_STEPS.length - 1 && (
                                                <div className={`absolute top-4 left-[50%] w-full h-0.5 -z-10 ${index < currentStepIndex ? 'bg-purple-600' : 'bg-gray-800'
                                                    }`} />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Gig Details</h3>
                                <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <MapPin className="w-5 h-5 text-purple-500" />
                                        <span>{gig.location}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Clock className="w-5 h-5 text-purple-500" />
                                        <div className="flex flex-col text-sm">
                                            <span>Start: {gig.start_time || 'TBD'}</span>
                                            {gig.call_time && <span className="text-gray-500">Call: {gig.call_time}</span>}
                                            {gig.end_time && <span className="text-gray-500">End: {gig.end_time}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Financials</h3>
                                <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <DollarSign className="w-5 h-5 text-purple-500" />
                                        <span className="font-medium text-lg">
                                            {gig.is_free ? 'Free / Pro Bono' : `€ ${gig.fee}`}
                                        </span>
                                    </div>
                                    {gig.payment_method && (
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <CreditCard className="w-5 h-5 text-purple-500" />
                                            <span>{gig.payment_method}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Info</h3>
                                <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <User className="w-5 h-5 text-purple-500" />
                                        <span>{gig.contact_name || 'No contact name'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Mail className="w-5 h-5 text-purple-500" />
                                        <a href={`mailto:${gig.contact_email}`} className="hover:text-purple-400 transition-colors">
                                            {gig.contact_email || 'No email'}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Phone className="w-5 h-5 text-purple-500" />
                                        <span>{gig.contact_phone || 'No phone'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Logistics & PA</h3>
                                <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Mic2 className="w-5 h-5 text-purple-500" />
                                        <div className="flex flex-col text-sm">
                                            <span>{gig.own_pa_required ? 'Own PA Required' : 'PA Provided'}</span>
                                            {gig.own_pa_required && gig.pa_cost && (
                                                <span className="text-gray-500">PA Cost: € {gig.pa_cost}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-700 flex justify-between bg-gray-900 sticky bottom-0 rounded-b-xl">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10"
                    >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? 'Deleting...' : 'Delete Gig'}
                    </button>

                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Details
                    </button>
                </div>
            </div>
        </div>
    )
}
