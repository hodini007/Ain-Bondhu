# Ain-Bondhu — Gemma 4 Good Hackathon Writeup (Draft)

## Title
Ain-Bondhu: A Bangla-First Worker Rights Assistant Using Gemma 4

## Subtitle
Helping Bangladeshi workers understand labor rights and generate formal complaints in their own language.

## Problem
Many workers in Bangladesh are unaware of their legal rights, wage protections, and official complaint procedures. Language barriers and low access to legal support make these issues harder to resolve.

## Solution
Ain-Bondhu is a Bangla-first conversational assistant that explains worker rights, asks clarifying questions, and generates formal complaint letters. It uses Gemma 4 for natural conversation and RAG to ground responses in relevant labor law sources.

## Architecture
- Frontend: Next.js chat UI with offline interactive demo mode
- Backend: FastAPI for chat, letter generation, and retrieval
- RAG: Qdrant vector store + multilingual embeddings
- Model: Gemma 4 via RunPod vLLM (demo-only)

## How Gemma 4 is Used
- Multi-turn Bangla conversation with safety guardrails
- Formal letter generation in Bangla
- Tool-assisted retrieval with citations from labor law PDFs

## Safety & Trust
- Clear disclaimer for non-legal advice
- Grounded citations from official sources
- Offline demo mode for low-connectivity scenarios

## Demo Walkthrough
1. User explains problem in Bangla
2. Assistant clarifies and explains rights
3. Assistant generates complaint letter
4. Letter downloaded as PDF

## Impact
The project lowers language and access barriers, helping workers take informed action.

## Links
- Video: (YouTube link)
- Live demo: (URL)
- Source code: (GitHub link)
