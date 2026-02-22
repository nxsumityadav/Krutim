# AGENTS.md - Krutim AI Chat Platform

## Project Overview

**Krutim** is a multi-model AI chat platform built with Next.js. It allows users to chat with multiple AI models (GPT, Claude, Gemini, Grok, etc.), compare responses, switch between providers, and monitor model availability in real-time.

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4 with custom CSS variables
- **Database**: Supabase (PostgreSQL)
- **AI API**: CatClaw (proxy for multiple AI providers)
- **Icons**: Lucide React
- **Fonts**: IBM Plex Mono (primary & secondary)

---

## Build & Run Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Environment Variables
Create a `.env` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
CATCLAW_KEY=your-catclaw-api-key
CATCLAW_BASE_URL=https://www.catclawai.top/v1
```

---

## Project Structure

```
/src
├── app/                    # Next.js App Router pages
│   ├── chat/              # Chat interface
│   ├── models/            # Model status page
│   ├── settings/          # Settings page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── markdown-renderer.tsx
│   ├── app-sidebar.tsx
│   ├── mobile-bottom-nav.tsx
│   └── chat-state-provider.tsx
└── lib/                   # Utilities
    ├── supabase.ts       # Supabase client
    └── utils.ts         # Helper functions
```

---

## Code Style Guidelines

### General
- Use TypeScript for all new code
- Use `lucide-react` for icons (NOT material-symbols or other icon libraries)
- Use IBM Plex Mono font (import from `next/font/google`)

### React/Next.js
- Use "use client" directive for client components
- Use `cn()` utility from `@/lib/utils` for className merging
- Prefer functional components with hooks
- Use proper TypeScript types

### CSS/Tailwind
- Use Tailwind CSS 4 syntax
- Use CSS variables defined in `globals.css` for theming
- Follow the existing color scheme (dark/light mode support)

---

## Supabase Setup

### Edge Functions
- **chat**: Main chat proxy function (located in `/supabase/functions/chat`)
- **health-check**: Health check function

### Environment Secrets
Set these in Supabase Dashboard > Settings > Secrets:
```
CATCLAW_KEY=your-api-key
CATCLAW_BASE_URL=https://www.catclawai.top/v1
```

### Database Tables
- `models`: Available AI models
- `chat_sessions`: User chat sessions
- `chat_messages`: Individual messages
- `app_config`: Application configuration

---

## Testing

### Manual Testing
1. Run `npm run dev`
2. Open http://localhost:3000
3. Test chat functionality with different models
4. Test model switching
5. Test dark/light mode

### API Testing
```bash
curl -X POST https://your-project.supabase.co/functions/v1/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model_id": "MODEL_ID", "messages": [{"role": "user", "content": "Hello"}]}'
```

---

## Security Considerations

### Environment Variables
- Never commit `.env` files to git
- Use Supabase Secrets for edge functions
- Keep API keys secure

### Database
- Enable Row Level Security (RLS) on all tables
- Add proper RLS policies for user data isolation

### Edge Functions
- Set `verify_jwt: true` for protected functions
- Validate all user inputs

---

## Common Tasks

### Adding a New Model
1. Add model to Supabase database:
```sql
INSERT INTO models (name, base_url, api_key, status, model_identifier)
VALUES ('Model Name', 'https://api.url', 'key', 'available', 'model-id');
```

### Updating Edge Functions
1. Edit function in `/supabase/functions/`
2. Deploy: `npx supabase functions deploy chat`

### Adding New UI Components
Use Shadcn CLI:
```bash
npx shadcn@latest add button
```

---

## Deployment

### Vercel (Recommended)
1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel project settings
3. Deploy automatically on push to main

### Supabase
- Database and auth managed in Supabase Dashboard
- Edge functions deployed via Supabase CLI

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)
