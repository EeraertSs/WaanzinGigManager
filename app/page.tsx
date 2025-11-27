import { supabase } from '@/lib/supabase'
import { Gig } from '@/lib/types'
import DashboardClient from '@/components/DashboardClient'

export const revalidate = 0 // Disable static caching for this page to ensure fresh data

export default async function Dashboard() {
  const { data, error } = await supabase
    .from('gigs')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching gigs:', error)
  }

  const gigs = (data as Gig[]) || []

  return <DashboardClient initialGigs={gigs} />
}
