from flask import Flask, request, jsonify
from llama_cpp import Llama
from retriever import LawRetriever
import os

app = Flask(__name__)

# 1. Initialize our Law Librarian (RAG)
retriever = LawRetriever()
retriever.load_db()

# 2. Initialize our Fine-Tuned AI (The Model you are downloading)
# NOTE: Replace 'ain-bondhu-9b-legal-q4_k_m.gguf' with your actual filename
MODEL_PATH = "models/ain_bondhu_9b_q4.gguf"

print("--- Loading AI Model (This might take a moment) ---")
llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=2048,      # Matches our training length
    n_threads=4,     # Use 4 CPU cores
)

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    
    # STEP A: Search the Law PDFs for relevant sections
    print(f"User asked: {user_input}")
    legal_context = retriever.get_relevant_laws(user_input)
    
    # STEP B: Build the Prompt for the AI
    # We give it the law context so it can't lie!
    prompt = f"""### Instruction:
You are 'Ain-Bondhu', a helpful legal assistant for industrial workers in Bangladesh.
Use the following legal sections to answer the user's question accurately in Bengali.
If the information is missing, ask for more details like their salary or tenure.

LEGAL CONTEXT:
{legal_context}

USER QUESTION:
{user_input}

### Response:
"""

    # STEP C: Generate the Response
    response = llm(
        prompt,
        max_tokens=512,
        stop=["###", "</s>"], # Stop tokens to keep it clean
        echo=False
    )
    
    ai_text = response['choices'][0]['text'].strip()
    
    return jsonify({
        "reply": ai_text,
        "context_used": legal_context[:200] + "..." # Just for debugging
    })

if __name__ == "__main__":
    # Create models folder if it doesn't exist
    os.makedirs("models", exist_ok=True)
    print("--- Ain-Bondhu API is running on http://localhost:5000 ---")
    app.run(host='0.0.0.0', port=5000)
