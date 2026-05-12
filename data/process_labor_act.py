import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

def build_law_database():
    # 1. Directory containing PDFs
    pdf_dir = "data/laws/"
    all_docs = []
    
    if not os.path.exists(pdf_dir):
        print(f"ERROR: Directory not found: {pdf_dir}")
        return

    # 2. Loop through all PDFs in the folder
    print(f"--- Scanning for PDFs in {pdf_dir} ---")
    pdf_files = [f for f in os.listdir(pdf_dir) if f.endswith('.pdf')]
    
    if not pdf_files:
        print("No PDF files found!")
        return

    for pdf_file in pdf_files:
        path = os.path.join(pdf_dir, pdf_file)
        print(f"Processing: {pdf_file}...")
        try:
            loader = PyPDFLoader(path)
            all_docs.extend(loader.load())
        except Exception as e:
            print(f"Could not load {pdf_file}: {e}")

    # 3. Split into meaningful chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150
    )
    docs = text_splitter.split_documents(all_docs)
    print(f"Successfully processed {len(pdf_files)} PDFs into {len(docs)} chunks.")

    # 4. Create Vector Brain (FAISS)
    print("--- Creating Vector Brain (This may take a minute) ---")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    
    vector_db = FAISS.from_documents(docs, embeddings)

    # 5. Save the database locally
    os.makedirs("data/vector_db", exist_ok=True)
    vector_db.save_local("data/vector_db/labor_law_index")
    print("--- Success! Law Database ready at data/vector_db/labor_law_index ---")

if __name__ == "__main__":
    build_law_database()
