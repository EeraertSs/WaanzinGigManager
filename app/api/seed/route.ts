import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Optional: Clear existing data (commented out for safety, but good for dev)
        // await supabase.from('gigs').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        const gigs = [
            {
                venue_name: 'Café De Zwaan',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // Next week
                location: 'Leuven',
                status: 'Confirmed',
                fee: 350,
                contact_name: 'Jan Peeters',
                contact_email: 'jan@dezwaan.be',
                start_time: '21:00',
                end_time: '23:00',
                is_free: false,
                own_pa_required: true
            },
            {
                venue_name: 'Jeugdhuis De Klinker',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(), // In 2 weeks
                location: 'Aarschot',
                status: 'Contract Sent',
                fee: 500,
                contact_name: 'Sarah',
                contact_email: 'booking@klinker.be',
                start_time: '22:00',
                end_time: '00:00',
                is_free: false,
                own_pa_required: false
            },
            {
                venue_name: 'Privé Feest (Verjaardag)',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // In a month
                location: 'Gent',
                status: 'Lead',
                fee: 600,
                contact_name: 'Mark',
                contact_email: 'mark.vdb@gmail.com',
                is_free: false,
                own_pa_required: true
            },
            {
                venue_name: 'Stadsfestival',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(), // In 2 months
                location: 'Hasselt',
                status: 'Draft',
                fee: 1200,
                contact_name: 'Events Team',
                contact_email: 'events@hasselt.be',
                ai_notes: 'Found on website, need to contact.',
                is_free: false,
                own_pa_required: false
            },
            {
                venue_name: 'Oude Markt Optreden',
                date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // Last month
                location: 'Leuven',
                status: 'Done',
                fee: 400,
                contact_name: 'Bar Manager',
                is_free: false,
                own_pa_required: true,
                payment_method: 'Invoice'
            },
            {
                venue_name: 'Charity Event',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
                location: 'Brussel',
                status: 'Confirmed',
                fee: 0,
                contact_name: 'NGO Help',
                is_free: true,
                own_pa_required: true
            },
            {
                venue_name: 'Rock Café',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
                location: 'Antwerpen',
                status: 'Cancelled',
                fee: 250,
                contact_name: 'Rob',
                is_free: false,
                own_pa_required: true
            }
        ]

        const { error } = await supabase.from('gigs').insert(gigs)

        if (error) {
            console.error('Seed Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'Seed data created successfully', count: gigs.length })

    } catch (error) {
        console.error('Seed Error:', error)
        return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
    }
}
