# Project Brief

## What We're Building
An AI receptionist platform for small businesses. It answers inbound phone calls, makes outbound voicemail drops, books appointments, and answers questions about the business using a natural-sounding AI voice. Each business gets their own configurable AI receptionist. Admins manage everything through a web dashboard.

## Tech Stack
- Framework: Next.js (App Router), TypeScript
- Database: Supabase (Postgres + Auth + Storage)
- Hosting: Vercel (web app), Fly.io (real-time voice processing)
- Telephony: Telnyx
- Speech-to-Text & Text-to-Speech: Deepgram
- LLM: Google Gemini and/or Anthropic Claude (Architect decides which, when, and why)

## API Keys & Services
- `DEEPGRAM_API_KEY`: Speech-to-text and text-to-speech
- `TELNYX_API_KEY`: Telephony (making and receiving calls)
- `TELNYX_CONNECTION_ID`: SIP connection for call routing
- `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini LLM
- `ANTHROPIC_API_KEY`: Claude LLM
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase server-side access

## Core Features (Priority Order)
1. **Outbound voicemail drop** — Dial a phone number, detect whether a human or voicemail answers, and deliver a business-specific scripted voicemail. Should sound natural, not robotic.
2. **Inbound call handling** — Answer incoming calls, greet the caller, hold a natural multi-turn conversation, answer questions about the business, and book appointments. The caller should be able to interrupt the AI mid-sentence.
3. **Real-time voice pipeline** — Connect phone audio to speech recognition, LLM reasoning, and voice synthesis in real-time with minimal latency. The goal is a conversation that feels natural, not like talking to an IVR.
4. **Per-business configuration** — Each business gets a custom receptionist with: business name, custom greeting, FAQ content, appointment rules, and voice selection. All configurable without code changes.
5. **Admin dashboard** — Web interface to: configure the AI per business, edit conversation behavior, select voices, view call history with transcripts and recordings, and monitor call outcomes.

## Constraints
- Latency matters above all else. The AI's first audible response should feel immediate, not delayed. Research and architect for speed.
- All AI behavior (voice, personality, conversation style, responses) must be configurable per business through the database. No hardcoded values that require redeployment.
- Call recording should use carrier-level recording, not self-mixing.
- Multi-tenant: multiple businesses, each with their own config, sharing the same infrastructure.

## Design Direction
Clean, minimal, functional dashboard. Dark mode. Think modern SaaS admin panel. Call history as a table with expandable detail rows. Config panels organized by feature. Voice picker with audio previews.

## Success Criteria
1. An outbound call dials a number, detects voicemail, and delivers a natural-sounding business-specific message.
2. An inbound call is answered, the AI has a multi-turn conversation, and can book an appointment or answer FAQs.
3. A caller can interrupt the AI mid-sentence and the AI stops and listens.
4. The admin dashboard allows editing all AI behavior, selecting voices, and viewing call history with transcripts — without touching code.
5. Switching the AI's voice, model, or conversation style for any business is a config change, not a deployment.
