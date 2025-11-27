export type GigStatus = 'Draft' | 'Lead' | 'Confirmed' | 'Contract Sent' | 'Done' | 'Cancelled'
export type PaymentMethod = 'Invoice' | 'Cash'

export interface Gig {
    id: string
    venue_name: string
    date: string
    location: string
    status: GigStatus

    // Financials
    fee?: number
    is_free: boolean
    payment_method?: PaymentMethod

    // Logistics
    call_time?: string
    start_time?: string
    end_time?: string
    own_pa_required: boolean
    pa_cost?: number

    // Contact
    contact_name?: string
    contact_email?: string
    contact_phone?: string

    // Assistant
    source_email_id?: string
    ai_confidence?: number
    ai_notes?: string
    has_unseen_ai_updates?: boolean
    ai_proposed_updates?: Record<string, any>

    created_at: string
    updated_at: string
}
