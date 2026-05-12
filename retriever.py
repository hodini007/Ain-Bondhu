from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

class LawRetriever:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self.db_path = "data/vector_db/labor_law_index"
        self.db = None

    def load_db(self):
        if self.db is None:
            try:
                self.db = FAISS.load_local(
                    self.db_path, 
                    self.embeddings, 
                    allow_dangerous_deserialization=True
                )
                print("--- Law Database Loaded ---")
            except Exception as e:
                print(f"ERROR: Could not load law database. Did you run process_labor_act.py? {e}")

    def get_relevant_laws(self, query, k=3):
        """Search the database for the most relevant sections of the law"""
        if self.db is None:
            self.load_db()
        
        if self.db:
            # Search for top 'k' matches
            results = self.db.similarity_search(query, k=k)
            # Combine the text of the matches
            context = "\n\n".join([doc.page_content for doc in results])
            return context
        return ""

# Test Example
if __name__ == "__main__":
    retriever = LawRetriever()
    # Try searching for something
    context = retriever.get_relevant_laws("What are the rules for maternity leave?")
    print("Found context:")
    print(context[:500] + "...")
