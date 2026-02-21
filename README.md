# Model Chat - AI Multi-Model Platform

A premium, production-ready AI chat platform built with Next.js, Supabase, and Tailwind CSS. This application allows users to chat with 23+ AI models (including GPT-4, Claude 3.5, DeepSeek, and Grok) with a real-time streaming interface and integrated health monitoring.

![Aesthetic Chat UI](https://github.com/nxsumityadav/Model_chat/raw/main/public/preview.png)

## ✨ Features

- **Multi-Model Intelligence**: Seamlessly switch between 20+ top-tier AI models including Reasoning/Thinking models.
- **Real-Time Streaming**: Interactive chat experience with word-by-word response streaming for zero latency perception.
- **Thinking Process (CoT)**: Dedicated UI blocks for models that provide "Chain of Thought" reasoning (like Grok Thinking and Claude).
- **Autonomous Health Monitoring**: Integrated background worker (via Supabase pg_cron) that checks model availability every hour.
- **Live Availability Dashboard**: A dedicated dashboard and sidebar status bar showing real-time model status (Latency, Errors, Availability).
- **Persistent Conversations**: Chat history persists across browser sessions using local storage.
- **Secure Architecture**: API keys are handled strictly on the server-side (Supabase Edge Functions) and never exposed to the frontend.
- **Smart Settings**: Global toggle to enable/disable autonomous background health checks to preserve API rate limits.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Shadcn/UI, Lucide React.
- **Backend**: Supabase (PostgreSQL, Edge Functions, Realtime).
- **Database**: PostgreSQL with `pg_cron`, `http`, and `pg_net` extensions for autonomous proxying and monitoring.
- **Edge Functions**: Deno-based Supabase Edge Functions for secure API proxying and streaming.

## 🛠️ Setup Instructions

### 1. Database Configuration

Enable the following extensions in your Supabase project:

```sql
create extension if not exists "http" with schema "extensions";
create extension if not exists "pg_cron" with schema "extensions";
```

### 2. Environment Variables

Create a `.env.local` file with your details:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Edge Function Secrets

Set your AI Provider API key in Supabase:

```bash
supabase secrets set CATCLAW_KEY=your-api-key
```

### 4. Running Locally

```bash
npm install
npm run dev
```

## 🔒 Security

- **Zero-Exposed Keys**: The frontend only communicates with Supabase. All actual AI Provider API calls are proxied through Secure Edge Functions using the `service_role` key or hardcoded secrets in the backend.
- **RLS-First**: Row Level Security (RLS) is enabled on all tables (models, messages, app_config) to ensure data integrity.

## 📄 License

MIT License - feel free to use and adapt this project!
