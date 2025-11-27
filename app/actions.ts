'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Initialize Supabase client for server actions
// Note: In a real app with auth, you'd use createServerComponentClient from @supabase/auth-helpers-nextjs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function createGig(formData: FormData) {
    const rawData = {
        venue_name: formData.get('venue_name') as string,
        date: formData.get('date') as string,
        location: formData.get('location') as string,
        fee: Number(formData.get('fee')),
        status: formData.get('status') as string,
        contact_name: formData.get('contact_name') as string,
        contact_email: formData.get('contact_email') as string,
        contact_phone: formData.get('contact_phone') as string,
        call_time: formData.get('call_time') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        payment_method: formData.get('payment_method') as string,
        is_free: formData.get('is_free') === 'on',
        own_pa_required: formData.get('own_pa_required') === 'on',
        pa_cost: formData.get('pa_cost') ? Number(formData.get('pa_cost')) : null,
    }

    const { error } = await supabase.from('gigs').insert(rawData)

    if (error) {
        console.error('Error creating gig:', error)
        throw new Error('Failed to create gig')
    }

    revalidatePath('/')
}

export async function updateGig(id: string, formData: FormData) {
    const clearProposedUpdates = formData.get('clear_proposed_updates') === 'true'

    const updates: any = {
        venue_name: formData.get('venue_name') as string,
        date: formData.get('date') as string,
        location: formData.get('location') as string,
        fee: Number(formData.get('fee')),
        status: formData.get('status') as string,
        contact_name: formData.get('contact_name') as string,
        contact_email: formData.get('contact_email') as string,
        contact_phone: formData.get('contact_phone') as string,
        call_time: formData.get('call_time') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        payment_method: formData.get('payment_method') as string,
        is_free: formData.get('is_free') === 'on',
        own_pa_required: formData.get('own_pa_required') === 'on',
        pa_cost: formData.get('pa_cost') ? Number(formData.get('pa_cost')) : null,
        ai_notes: formData.get('ai_notes') as string,
        updated_at: new Date().toISOString(),
    }

    // If the form indicates we've seen the updates (by sending "false"), we update the DB
    if (formData.get('has_unseen_ai_updates') === 'false') {
        updates.has_unseen_ai_updates = false
    }

    if (clearProposedUpdates) {
        updates.ai_proposed_updates = null
    }

    console.log('Updating gig with data:', updates)
    const { error } = await supabase.from('gigs').update(updates).eq('id', id)

    if (error) {
        console.error('Error updating gig:', error)
        throw new Error(`Failed to update gig: ${error.message}`)
    }

    revalidatePath('/')
}

export async function deleteGig(id: string) {
    const { error } = await supabase.from('gigs').delete().eq('id', id)

    if (error) {
        console.error('Error deleting gig:', error)
        throw new Error('Failed to delete gig')
    }

    revalidatePath('/')
}
