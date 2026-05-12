# Unsloth Fine-tuning for Ain-Bondhu

Fine-tune **Gemma 4 E4B** on Bangla worker rights data using **Unsloth** on a free Google Colab T4 (16GB).

## Quick Start

### 1. Open the Notebook in Colab

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/hodini007/Ain-Bondhu/blob/main/notebooks/unsloth_finetune.ipynb)

### 2. Run all cells

The notebook:
- Installs Unsloth
- Loads Gemma 4 E4B in 4-bit (fits T4 16GB)
- Downloads the Bangla worker rights training dataset from this repo (15 Q&A pairs)
- Fine-tunes with QLoRA for 3 epochs (~5 min)
- Saves the LoRA adapter

### 3. Push to Hugging Face

Run the Hugging Face cells with your token:
- Adapter: `your-username/ain-bondhu-gemma4-lora`
- Merged model: `your-username/ain-bondhu-gemma4-merged`

### 4. Deploy on RunPod

Start vLLM with your fine-tuned model:
```bash
python -m vllm.entrypoints.openai.api_server \
  --model your-username/ain-bondhu-gemma4-merged \
  --host 0.0.0.0 --port 8000 --api-key anda
```

### 5. Update App Settings

In the app (⚙️), set:
- **Model Name**: `your-username/ain-bondhu-gemma4-merged`
- **Base URL**: your RunPod tunnel URL + `/v1`

---

## Dataset

**15 Bangla Q&A pairs** covering:
- Unpaid wages (বকেয়া বেতন)
- Overtime violations (অতিরিক্ত কাজের চাপ)
- Wrongful termination (নোটিশ ছাড়া ছাঁটাই)
- Maternity leave (মাতৃত্বকালীন ছুটি)
- Minimum wage (ন্যূনতম মজুরি)
- Workplace injury (কর্মক্ষেত্রে দুর্ঘটনা)
- Written contracts (লিখিত চুক্তি)
- Union rights (ইউনিয়ন গঠন)
- Equal pay (সমান কাজের সমান বেতন)
- And more...

### Adding more data

Edit `data/training/worker_rights_qa.json` and add new items:
```json
{
  "instruction": "your question in Bangla",
  "output": "your answer in Bangla"
}
```

### vLLM + LoRA (alternative)

If you want to keep the base model and load LoRA at runtime:
```bash
python -m vllm.entrypoints.openai.api_server \
  --model google/gemma-4-E4B-it \
  --lora-modules ain-bondhu=your-username/ain-bondhu-gemma4-lora \
  --port 8000 --api-key anda
```

Then in the app, set **Model Name** to `google/gemma-4-E4B-it` and the API call will use the base model (LoRA loading requires the `/v1/chat/completions` with `lora` parameter).
