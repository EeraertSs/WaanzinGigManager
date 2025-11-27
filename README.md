# 🎸 Waanzin Gig Manager

Een intelligente gig management applicatie voor Waanzin, gebouwd met Next.js, Supabase en Google Gemini AI.

## 📋 Wat doet deze applicatie?

Waanzin Gig Manager is een all-in-one tool die:
- **Emails automatisch synchroniseert** van je IMAP mailbox
- **AI-gestuurde gig extractie** gebruikt om optreden-aanvragen te herkennen en verwerken
- **Optredens beheert** met een overzichtelijk dashboard
- **Voorstelt in plaats van opdringt**: AI stelt updates voor die jij goedkeurt of afwijst
- **Email templates** biedt voor snelle, professionele antwoorden

## ✨ Features

### 🤖 AI Assistant (Google Gemini 2.5 Flash)
- **Automatische email parsing**: Herkent gig-aanvragen in emails
- **Intelligente matching**: Update bestaande optredens of maak nieuwe drafts
- **Human-in-the-loop**: AI stelt wijzigingen voor i.p.v. automatisch toepassen
- **Nederlandse notities**: Bondige, duidelijke AI-gegenereerde notities
- **Conflict detectie**: Waarschuwt voor dubbele boekingen op dezelfde datum

### 📧 Mailbox Integratie
- **IMAP sync**: Automatisch emails ophalen uit je mailbox
- **Folder filtering**: Kies welke mappen je wilt synchroniseren (INBOX + folders met "contact")
- **Email templates**: Voorgedefinieerde antwoorden voor:
  - Prijsopgave aanvragen
  - Bevestigingen
  - Afwijzingen
  - Custom berichten
- **Direct antwoorden**: Stuur emails vanuit de applicatie via SMTP

### 📊 Dashboard
- **Gig overzicht**: Alle optredens in één view
- **Zoekfunctie**: Filter op venue, locatie of contactpersoon
- **Status filters**: Filter op Confirmed, Lead, Draft, Contract Sent, Done, Cancelled
- **Verleden gigs**: Show/hide toggle met visuele grey-out
- **Default date sorting**: Altijd gesorteerd op datum (ascending)
- **AI update badges**: "New Info" indicator voor gigs met AI-updates
- **Refresh button**: Handmatig data verversen

### 🎯 Gig Management
- **Volledige CRUD**: Create, Read, Update, Delete optredens
- **Uitgebreide details**:
  - Venue naam, locatie, datum
  - Fee, betalingsmethode (Invoice/Cash)
  - Contact info (naam, email, telefoon)
  - Schedule (call time, start time, end time)
  - Logistiek (PA vereisten, kosten)
  - Pro bono/gratis gigs
- **AI Review Panel**: Accept/reject voorgestelde wijzigingen
- **AI notities**: Side panel met AI-gegenereerde context en voorstellen

### 🗂️ Status Workflow
```
Draft (AI) → Lead → Confirmed → Contract Sent → Done
                              ↓
                          Cancelled
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + REST API)
- **AI**: Google Generative AI (Gemini 2.5 Flash)
- **Email**: 
  - IMAP (via `imap`)
  - SMTP (via `nodemailer`)
  - Email parsing (via `mailparser`)
- **Icons**: Lucide React

## 🚀 Setup

### 1. Clone & Install
```bash
git clone <repo-url>
cd WaanzinGigManager
npm install
```

### 2. Environment Variables
Maak een `.env.local` bestand aan:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key

# Email (IMAP voor lezen)
MAIL_USER=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_IMAP_HOST=imap.example.com

# Email (SMTP voor versturen)
MAIL_SMTP_HOST=smtp.example.com
MAIL_SMTP_PORT=465
```

### 3. Database Setup
Voer `supabase_schema.sql` uit in je Supabase SQL Editor om:
- Tables te maken (`gigs`, `emails`)
- RLS policies in te stellen
- Enum types te definiëren

### 4. Run Development Server
```bash
npm run dev
```

Navigeer naar `http://localhost:3000`

## 📖 Gebruik

### Email Workflow
1. **Sync emails**: Klik op "Check for New Gigs" in het Dashboard
2. **AI processing**: AI analyseert nieuwe emails automatisch
3. **Review drafts**: Bekijk nieuwe drafts met "New Info" badge
4. **Accept/Reject**: Goedkeuren of afwijzen van AI-voorstellen
5. **Update status**: Move draft naar Lead/Confirmed

### Mailbox Workflow
1. **Navigeer naar Mailbox**: `/mailbox`
2. **Filter folders**: Kies specifieke mailbox folders
3. **Lees emails**: Bekijk volledige email content
4. **Gebruik templates**: Snel antwoorden met voorgedefinieerde templates
5. **Custom antwoord**: Schrijf eigen antwoord en verstuur direct

### Dashboard Workflow
1. **Overzicht**: Bekijk alle gigs gesorteerd op datum
2. **Zoeken**: Gebruik de zoekbalk voor specifieke venues/contacten
3. **Filteren**: Filter op status (Confirmed, Lead, etc.)
4. **Past gigs**: Toggle "Show Past" voor historische optredens
5. **Details**: Klik op een gig voor volledige details en editing

## 🏗️ Database Schema

### `gigs` Table
- Basis info: `venue_name`, `date`, `location`, `fee`, `status`
- Contact: `contact_name`, `contact_email`, `contact_phone`
- Schedule: `call_time`, `start_time`, `end_time`
- Financials: `payment_method`, `is_free`, `pa_cost`
- AI: `ai_notes`, `ai_confidence`, `ai_proposed_updates`, `has_unseen_ai_updates`
- Metadata: `source_email_id`, `created_at`, `updated_at`

### `emails` Table
- Email data: `id`, `subject`, `sender`, `body`, `received_at`
- Processing: `is_processed`, `processed_at`
- Organization: `folder`

## 🔐 Security Notes

⚠️ **Development Mode**: RLS policies zijn momenteel ingesteld op `USING (true)` voor snelle development. **Voor productie moet je authentication implementeren en RLS policies aanpassen!**

## 🎨 UI Highlights

- **Dark theme**: Modern, professioneel donker design
- **Responsive**: Werkt op desktop, tablet en mobile
- **Toast notifications**: Real-time feedback voor acties
- **Modal forms**: Overlay editing experience
- **Color-coded status**: Visuele status indicators
- **Greyed past gigs**: Duidelijk onderscheid tussen toekomst/verleden

## 📝 API Routes

- `/api/sync-mail` - Sync emails van IMAP server
- `/api/process-drafts` - Verwerk emails met AI
- `/api/mail/send` - Verstuur email via SMTP
- `/api/mail/fetch` - Haal specifieke email op
- `/api/seed` - Seed database met voorbeeld data

## 🔮 Toekomstige Verbeteringen

- [ ] Authentication (Supabase Auth)
- [ ] Strikte RLS policies per user
- [ ] Cron job voor automatische email sync
- [ ] Calendar view voor optredens
- [ ] Export functionaliteit (PDF, CSV)
- [ ] Email/Gig tagging systeem
- [ ] Multi-user support
- [ ] Notificaties voor nieuwe bookings

## 🐛 Known Issues

- Email password met speciale characters (`$`) moet escaped worden in `.env.local`
- Supabase schema cache moet soms handmatig ge-reload worden na schema wijzigingen

## 💡 Tips

- Gebruik **Gemini 2.5 Flash** voor betere AI prestaties
- Sync emails regelmatig (of implementeer cron job)
- Review AI voorstellen altijd voor je ze goedkeurt
- Gebruik status workflow consequent voor duidelijkheid
- Bewaar oude emails in aparte folder voor history

---

**Built with ❤️ for Waanzin**
