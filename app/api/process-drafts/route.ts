import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

async function parseEmailWithLLM(emailBody: string, emailSubject: string, contextGigs: any[]) {
    try {
        // Construct the prompt with Few-Shot Examples (Contextual Learning)
        const examples = contextGigs.map(g => ({
            input: `Subject: Gig at ${g.venue_name}\nBody: ...`, // Simplified for brevity in prompt
            output: {
                venue_name: g.venue_name,
                date: g.date,
                location: g.location,
                fee: g.fee,
                contact_name: g.contact_name,
                status: 'Draft'
            }
        }))

        const prompt = `
        Je bent een intelligente assistent voor de band "Waanzin". Jouw taak is om optredens uit emails te halen.
        
        Hier zijn voorbeelden (Context):
        ${JSON.stringify(examples, null, 2)}

        Haal details uit deze email:
        Onderwerp: ${emailSubject}
        Body: ${emailBody}

        Instructies:
        1. Haal 'venue_name', 'date' (ISO), 'location', 'fee' (getal), 'contact_name', 'start_time', 'end_time' eruit.
        2. 'ai_confidence' (0.0 - 1.0).
        3. 'ai_notes': Korte, puntsgewijze samenvatting in het NEDERLANDS van wat je gevonden hebt. Geen wollige taal.
        4. Geef ALLEEN valide JSON terug.
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Clean up markdown code blocks if present (Gemini sometimes adds them)
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()

        const data = JSON.parse(jsonString)
        return {
            ...data,
            ai_confidence: data.ai_confidence || 0.5,
            ai_notes: data.ai_notes || 'Verwerkt door Gemini'
        }

    } catch (error) {
        console.error('LLM Parsing Error:', error)
        return null
    }
}

export async function GET() {
    try {
        // 1. Fetch Context: Last 5 Confirmed Gigs
        const { data: contextGigs } = await supabase
            .from('gigs')
            .select('*')
            .eq('status', 'Confirmed')
            .order('date', { ascending: false })
            .limit(5)

        // 2. Fetch Unprocessed Emails
        const { data: emails } = await supabase
            .from('emails')
            .select('*')
            .eq('is_processed', false)
            .limit(5) // Process in small batches to avoid timeouts

        if (!emails || emails.length === 0) {
            return NextResponse.json({ message: 'No new emails to process' })
        }

        let processedCount = 0

        for (const email of emails) {
            // 3. AI Analysis
            const extraction = await parseEmailWithLLM(email.body, email.subject, contextGigs || [])

            if (extraction && extraction.date) {
                // Check if a gig already exists on this date (ignoring time)
                const gigDate = new Date(extraction.date).toISOString().split('T')[0]

                const { data: existingGigs } = await supabase
                    .from('gigs')
                    .select('*')
                    .gte('date', `${gigDate}T00:00:00`)
                    .lte('date', `${gigDate}T23:59:59`)

                let matchFound = false
                let targetGig = null

                if (existingGigs && existingGigs.length > 0) {
                    // Iterate to find a suitable match
                    for (const gig of existingGigs) {
                        // 1. If it's a Draft, we are more lenient (it might be the same inquiry)
                        if (gig.status === 'Draft') {
                            // If venue is generic or matches, assume it's the same draft
                            if (gig.venue_name === 'Unknown Venue' || gig.venue_name.toLowerCase().includes(extraction.venue_name?.toLowerCase())) {
                                targetGig = gig
                                matchFound = true
                                break
                            }
                        }
                        // 2. If it's a Real Gig (Confirmed/Lead/etc), we are STRICT
                        else {
                            const venueMatch = extraction.venue_name && gig.venue_name.toLowerCase().includes(extraction.venue_name.toLowerCase())
                            const contactEmailMatch = (extraction.contact_email && gig.contact_email === extraction.contact_email) || (email.sender.includes(gig.contact_email || 'NEVER_MATCH'))
                            const contactNameMatch = extraction.contact_name && gig.contact_name?.toLowerCase().includes(extraction.contact_name.toLowerCase())

                            if (venueMatch || contactEmailMatch || contactNameMatch) {
                                targetGig = gig
                                matchFound = true
                                break
                            }
                        }
                    }
                }

                if (matchFound && targetGig) {
                    // Update existing gig - PROPOSE CHANGES ONLY
                    console.log(`Proposing updates for gig ${targetGig.id} on ${gigDate}`)

                    const proposedUpdates: any = {}

                    // Compare fields and add to proposedUpdates if different/new
                    if (extraction.venue_name && extraction.venue_name !== targetGig.venue_name) proposedUpdates.venue_name = extraction.venue_name
                    if (extraction.location && extraction.location !== targetGig.location) proposedUpdates.location = extraction.location
                    if (extraction.fee && extraction.fee !== targetGig.fee) proposedUpdates.fee = extraction.fee
                    if (extraction.contact_name && extraction.contact_name !== targetGig.contact_name) proposedUpdates.contact_name = extraction.contact_name
                    if (extraction.start_time && extraction.start_time !== targetGig.start_time) proposedUpdates.start_time = extraction.start_time
                    if (extraction.end_time && extraction.end_time !== targetGig.end_time) proposedUpdates.end_time = extraction.end_time

                    // Only update if there are actual proposals or new notes
                    if (Object.keys(proposedUpdates).length > 0 || extraction.ai_notes) {
                        const updates: any = {
                            ai_notes: (targetGig.ai_notes || '') + `\n[${new Date().toISOString()}] Update voorstel: ${extraction.ai_notes}`,
                            has_unseen_ai_updates: true
                        }

                        if (Object.keys(proposedUpdates).length > 0) {
                            updates.ai_proposed_updates = proposedUpdates
                        }

                        const { error: updateError } = await supabase
                            .from('gigs')
                            .update(updates)
                            .eq('id', targetGig.id)

                        if (updateError) {
                            console.error('Failed to update gig', updateError)
                        } else {
                            processedCount++
                        }
                    }

                } else {
                    // Create new Draft Gig
                    // If there were existing gigs but no match, add a warning note
                    let conflictNote = ''
                    if (existingGigs && existingGigs.length > 0) {
                        conflictNote = `\n[AI Warning] Potential date conflict with existing gig(s) on this date.`
                    }

                    const { error: insertError } = await supabase
                        .from('gigs')
                        .insert({
                            venue_name: extraction.venue_name || 'Unknown Venue',
                            date: extraction.date || new Date().toISOString(),
                            location: extraction.location || 'TBD',
                            fee: extraction.fee || 0,
                            contact_name: extraction.contact_name || email.sender.split('<')[0].trim(),
                            contact_email: email.sender.match(/<(.+)>/)?.[1] || '',
                            status: 'Draft',
                            source_email_id: email.id,
                            ai_confidence: extraction.ai_confidence,
                            ai_notes: (extraction.ai_notes || '') + conflictNote,
                            start_time: extraction.start_time,
                            end_time: extraction.end_time,
                            has_unseen_ai_updates: true
                        })

                    if (insertError) {
                        console.error('Failed to create draft gig', insertError)
                    } else {
                        processedCount++
                    }
                }
            } else if (extraction) {
                // Fallback if no date found, create draft anyway? 
                const { error: insertError } = await supabase
                    .from('gigs')
                    .insert({
                        venue_name: extraction.venue_name || 'Unknown Venue',
                        date: extraction.date || new Date().toISOString(),
                        location: extraction.location || 'TBD',
                        fee: extraction.fee || 0,
                        contact_name: extraction.contact_name || email.sender.split('<')[0].trim(),
                        contact_email: email.sender.match(/<(.+)>/)?.[1] || '',
                        status: 'Draft',
                        source_email_id: email.id,
                        ai_confidence: extraction.ai_confidence,
                        ai_notes: extraction.ai_notes,
                        start_time: extraction.start_time,
                        end_time: extraction.end_time,
                        has_unseen_ai_updates: true
                    })

                if (insertError) {
                    console.error('Failed to create draft gig', insertError)
                } else {
                    processedCount++
                }
            }

            // 5. Mark Email as Processed
            await supabase
                .from('emails')
                .update({ is_processed: true, processed_at: new Date().toISOString() })
                .eq('id', email.id)
        }

        return NextResponse.json({
            success: true,
            processed: emails.length,
            drafts_created: processedCount
        })

    } catch (error) {
        console.error('Process Drafts Error:', error)
        return NextResponse.json({ error: 'Failed to process drafts' }, { status: 500 })
    }
}
