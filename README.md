# Krutim - Advanced Multi-Model AI Chat Platform

![Krutim Logo](https://github.com/nxsumityadav/Krutim/raw/main/public/krutim-logo.svg)

Krutim is a highly polished, production-ready AI chat platform designed for modern AI interactions. Built with Next.js 15, Supabase, and Tailwind CSS, Krutim empowers users to seamlessly communicate with 23+ top-tier AI models (including advanced CoT models like GPT-4o, Claude 3.5 Sonnet, DeepSeek, and Grok) using a robust real-time streaming interface.

## ✨ Core Features

- **Multi-Model Intelligence**: Effortlessly switch between 20+ leading AI models directly from the chat interface. Run prompts against different models and compare outcomes instantly.
- **Micro-Latency Streaming**: True word-by-word streaming generation directly from secure Supabase Edge Functions for a zero-latency feel.
- **Chain of Thought (CoT) UI**: Natively supports and visualizes "thinking processes" for advanced reasoning models via specially formatted `<think>` toggle blocks.
- **Fully Responsive & PWA Ready**: Mobile-first architecture with bottom navigations, interactive sheets, and a fully installable Progressive Web App experience with custom tailored icons.
- **Autonomous Health Monitoring**: Integrated automated backend jobs (`pg_cron`) monitor model availability and response latency across all integrated models every hour.
- **Live Status Dashboard**: A dedicated dashboard allowing users to track operational analytics, uptime, and latency of every model at a glance.
- **Native Markdown & Mathematics**: Render rich text, code blocks (with syntax highlighting and copy buttons), KaTeX/LaTeX mathematical formulas, and live logic diagrams powered by Mermaid.
- **Smart Adaptive Styling**: Implements a zero-flash native CSS dark mode strategy, ensuring seamless transitions across system theme preferences.

## 🚀 Technology Stack

- **Frontend Core**: Next.js 15 (App Router, Turbopack), React 19, TypeScript
- **Styling & UI**: Tailwind CSS v4, Framer Motion (for fluid animations), Shadcn/UI, Lucide & Material Symbols
- **Backend Infrastructure**: Supabase (PostgreSQL, Realtime DB)
- **Serverless Integration**: Deno-based Supabase Edge Functions for secure API proxying and chunk-based streaming

## 🛠️ Setup Instructions

### 1. Database Configuration

Enable the following extensions in your Supabase project's SQL editor:

```sql
create extension if not exists "http" with schema "extensions";
create extension if not exists "pg_cron" with schema "extensions";
create extension if not exists "pg_net" with schema "extensions";
```

### 2. Environment Variables

Create a `.env` or `.env.local` file at the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Edge Function Secrets

All API validation is securely handled by your Supabase backend. Set your AI routing hub API key (e.g., Catclaw, OpenRouter, etc.) directly into Supabase edge secrets:

```bash
npx supabase secrets set CATCLAW_KEY=your-api-key
```

### 4. Running Locally

```bash
npm install
npm run dev
```

The application will start with Turbopack enabled on port `3000`. 

## 🔒 Security Best Practices

- **Zero Client-Side Exposure**: API authentication occurs wholly inside Supabase Edge Functions. End-client UI only ever communicates with Supabase APIs using anonymous keys, preventing adversarial extraction.
- **Row Level Security (RLS)**: Highly restrictive database setups apply RLS constraints on `models`, `messages`, and `app_config` to ensure operational data integrity.

## 📄 License

MIT Copyright (c) 2024 nxsumityadav
