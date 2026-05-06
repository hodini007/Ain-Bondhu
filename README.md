# আইন বন্ধু — Ain-Bondhu
### Voice-First Offline Legal Aid for Garment Workers in Bangladesh

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Model: Gemma 4](https://img.shields.io/badge/Model-Gemma%204%20E4B-blue)](https://huggingface.co/google/gemma-4-e4b)
[![Fine-tuned with: Unsloth](https://img.shields.io/badge/Fine--tuned%20with-Unsloth-orange)](https://github.com/unslothai/unsloth)
[![Kaggle Gemma 4 Hackathon](https://img.shields.io/badge/Kaggle-Gemma%204%20Good%20Hackathon-20BEFF)](https://www.kaggle.com/competitions/gemma-4-good-hackathon)

---

> "A garment worker in Dhaka speaks her problem — Ain-Bondhu hears her in Bangla, finds the law that protects her, and puts a formal complaint letter in her hand. No internet. No lawyer. No barrier."

---

## The Problem

Bangladesh's garment industry employs **4 million workers** — 80% of them women. Wage theft, illegal termination, and denied maternity leave are routine. Legal aid costs money workers don't have. Lawyers speak a language workers don't. And the **Bangladesh Labor Act 2006** — the law designed to protect them — might as well be written in a foreign language.

A garment worker in Mirpur doesn't need a lawyer. She needs a system that **hears** her problem in her own words, **tells** her what the law says she's owed, and **puts a formal complaint letter in her hand** — right now, on a shared phone, without internet.

**That is Ain-Bondhu.**

---

## What It Does

1. 🎙️ **Listen** — Records the worker's voice in Bangla (Whisper STT, offline)
2. 🔍 **Retrieve** — Finds the relevant sections of the Bangladesh Labor Act 2006 (ChromaDB RAG)
3. 🧠 **Reason** — Explains their legal rights in plain conversational Bangla (fine-tuned Gemma 4 E4B)
4. 📄 **Draft** — Generates a formal Bengali complaint letter ready to submit (ReportLab PDF)
5. 🔊 **Speak** — Reads the explanation aloud (gTTS, offline-capable)

**End-to-end in under 30 seconds. Zero cloud dependency.**

---

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Speech-to-Text | OpenAI Whisper (small, ~244MB) |
| Knowledge Base | Bangladesh Labor Act 2006, BGMEA guidelines, Wage Gazette |
| Vector Search | ChromaDB + `multilingual-e5-small` embeddings |
| LLM | Fine-tuned Gemma 4 E4B via Unsloth (QLoRA, 4-bit) |
| Text-to-Speech | gTTS / pyttsx3 fallback |
| PDF Generation | ReportLab |
| UI | Gradio |
| Offline Footprint | ~3.8 GB total |

---

## Architecture

```
[Worker speaks Bangla]
        ↓
  PyAudio → Whisper-small (STT)
        ↓
  ChromaDB RAG (Labor Act 2006 chunks)
        ↓
  Fine-tuned Gemma 4 E4B (Unsloth)
        ↓
  ┌──────────────────────────────────┐
  │  Plain Bangla explanation  →  gTTS  │
  │  Formal complaint letter   →  PDF   │
  └──────────────────────────────────┘
        ↓
  Gradio UI (local + HF Space)
```

---

## Project Structure

```
Ain-Bondhu/
├── data/
│   ├── scraper/          # Labor Act scraping + chunking scripts
│   ├── processed/        # 300-token legal chunks (JSONL)
│   └── training/         # 650 Alpaca instruction pairs
├── rag/
│   ├── embed_and_index.py   # One-time embedding + ChromaDB indexing
│   └── retriever.py         # LegalRetriever class
├── finetune/
│   ├── train.py             # Unsloth QLoRA fine-tuning
│   ├── evaluate.py          # Benchmark against baseline Gemma 4
│   └── colab_notebook.ipynb # Ready-to-run Colab notebook
├── voice/
│   ├── stt.py               # Whisper-based speech-to-text
│   └── tts.py               # gTTS / pyttsx3 text-to-speech
├── inference/
│   ├── model.py             # Fine-tuned model loader + inference
│   └── letter_generator.py  # ReportLab PDF complaint letter
├── ui/
│   └── app.py               # Gradio application
├── deploy/
│   └── huggingface_space/   # HF Spaces deployment files
├── benchmarks/
│   └── results.json         # 87% vs 34% baseline benchmark
├── submission/
│   ├── kaggle_writeup.md    # Final Kaggle writeup
│   └── demo_script.md       # 3-minute video script
├── requirements.txt
├── setup.bat                # Windows one-command setup
├── setup.sh                 # Linux/Mac one-command setup
└── README.md
```

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/hodini007/Ain-Bondhu.git
cd Ain-Bondhu

# 2. Install dependencies
pip install -r requirements.txt

# 3. Index the legal knowledge base (run once)
python rag/embed_and_index.py

# 4. Launch the UI
python ui/app.py
```

---

## Model Weights

Fine-tuned weights are published on Hugging Face:  
🤗 **[Coming Soon — hodini007/ain-bondhu-gemma4-legal-bn]**

### Benchmarks

| Model | Bangla Legal QA Accuracy |
|-------|--------------------------|
| Baseline Gemma 4 E4B | 34% |
| **Ain-Bondhu (fine-tuned)** | **87%** |

Test set: 50 garment worker legal scenarios  
Metric: Correct legal section identification + rights explanation

---

## Training Data

The fine-tuning dataset covers:
- Worker describes wage theft → model identifies Labor Act section + explains rights
- Worker describes termination → model explains legal protections
- Problem description → formal Bengali complaint letter
- Edge cases: maternity leave, overtime, harassment, safety violations

---

## Why This Matters

Most legal AI is built for people who already have access to lawyers. **Ain-Bondhu is built for the person who has never been inside a lawyer's office and never will be.**

The offline-first constraint isn't a limitation — it's the product. A worker's problem doesn't pause for WiFi. Neither does Ain-Bondhu.

---

## Hackathon

Built for the **[Kaggle Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good-hackathon)**  
Track: **Digital Equity & Inclusivity**

---

## License

MIT License — see [LICENSE](LICENSE) for details.
