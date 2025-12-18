# Ayomide Alli Portfolio

A modern, industrial-themed portfolio website with RAG-powered AI assistant.

## 🏗️ Architecture

```
The Workshop (Local)
├── maintain.py CLI → Ingestion Logic

The Cloud (Fly.io + Supabase)
├── Ingestion → Gemini Flash (Embeddings)
├── Ingestion → Supabase pgvector (Storage)
├── Visitor → Next.js Frontend
├── Frontend → FastAPI Backend
├── Backend → Supabase (Search)
├── Backend → Gemini (Generate Answer)
└── Backend → Visitor (Stream Response)
```

## 🚀 Getting Started

### Backend Setup

1. Navigate to backend: `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate: `venv\Scripts\activate` (Windows)
4. Install: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and add your keys
6. Run: `uvicorn main:app --reload`

### Frontend Setup

1. Navigate to frontend: `cd frontend`
2. Install: `npm install`
3. Create `.env.local` with: `NEXT_PUBLIC_API_URL=http://localhost:8000`
4. Run: `npm run dev`
5. Open http://localhost:3000

## 🛠️ CLI Commands

```bash
# Update CV
python maintain.py update-cv --file my_resume.txt

# Add Project
python maintain.py add-project --name "Auto-Slicer" --desc "3D slicing engine" --stack "Rust, WASM"

# Add Thought
python maintain.py add-thought --topic "testing" --text "Testing is a design tool"
```

## 🎨 Design

- Theme: Dark Mode Industrial
- Fonts: Oswald + JetBrains Mono
- Primary: #3B82F6

---
Built with 🔧 Industrial Precision
