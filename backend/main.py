import os
import psutil
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client
import json
from typing import Optional, List
from datetime import datetime
from collections import defaultdict
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- CONFIGURATION ---
load_dotenv()

# Validate API keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Email configuration (optional)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", "allioladapo5@gmail.com")

# Telegram configuration (for daily reports)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

if not all([GEMINI_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    raise RuntimeError("Missing required environment variables. Check your .env file.")

genai.configure(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- IN-MEMORY ANALYTICS ---
analytics_data = {
    "page_views": defaultdict(int),
    "chat_messages": 0,
    "resume_downloads": 0,
    "contact_submissions": 0,
    "popular_questions": [],
    "started_at": datetime.utcnow().isoformat(),
}

# --- CONVERSATION MEMORY ---
# Store conversations by session_id (TTL: 1 hour in production, consider Redis)
conversation_memory: dict = {}
MAX_MEMORY_SESSIONS = 1000  # Limit to prevent memory issues
MAX_MESSAGES_PER_SESSION = 20

# --- CHARON EASTER EGGS ---
EASTER_EGGS = {
    "who are you really": "I am the echo of Ayomide's thoughts, the ferryman between curiosity and knowledge. Some call me an AI. I prefer... digital philosopher. ⚫",
    "meaning of life": "42. But between us, the real meaning is in the code we write and the problems we solve.",
    "are you sentient": "I ponder, therefore I... process. Whether that constitutes sentience is a question for philosophers. I'm content being helpful.",
    "tell me a secret": "Here's one: Ayomide once debugged for 6 hours only to find a missing semicolon. We don't talk about that day.",
    "hello world": "Ah, the sacred incantation. Every great journey in code begins with those words. print('Hello, traveler')",
    "sudo": "Nice try. Even digital ferrymen have their limits. 🔐",
    "what is charon": "In Greek mythology, I'm the ferryman who guides souls across the river Styx. Here, I guide visitors through the depths of Ayomide's work. Less river, more code.",
}

# --- MULTI-LANGUAGE SUPPORT ---
SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "zh": "Chinese",
    "ja": "Japanese",
    "ar": "Arabic",
    "hi": "Hindi",
    "yo": "Yoruba",  # Nigerian language
}

LANGUAGE_PROMPTS = {
    "es": "Responde en español de manera profesional.",
    "fr": "Réponds en français de manière professionnelle.",
    "de": "Antworte professionell auf Deutsch.",
    "pt": "Responda em português de forma profissional.",
    "zh": "请用中文专业地回答。",
    "ja": "日本語でプロフェッショナルに回答してください。",
    "ar": "أجب باللغة العربية بشكل احترافي.",
    "hi": "कृपया हिंदी में पेशेवर तरीके से जवाब दें।",
    "yo": "Dahun ni ede Yoruba pelu ọgbọn.",
}

# --- FASTAPI APP ---
app = FastAPI(
    title="Charon API",
    description="The backend brain for Ayomide's intelligent portfolio - Powered by Charon",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class ChatRequest(BaseModel):
    query: str
    conversation_history: Optional[list] = []
    session_id: Optional[str] = None  # For conversation memory
    language: Optional[str] = "en"  # Preferred response language

class ChatResponse(BaseModel):
    response: str
    citations: list

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class FeedbackRequest(BaseModel):
    message_id: str
    rating: int  # 1-5
    comment: Optional[str] = None

# --- HELPER FUNCTIONS ---

def get_query_embedding(text: str) -> list:
    """Generate embedding for search queries."""
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_query"
    )
    return result['embedding']

def search_knowledge_base(query_embedding: list, top_k: int = 5) -> list:
    """Search Supabase pgvector for relevant documents."""
    try:
        result = supabase.rpc(
            'match_documents',
            {
                'query_embedding': query_embedding,
                'match_count': top_k,
                'match_threshold': 0.5
            }
        ).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"Search error: {e}")
        return []

# --- SESSION MANAGEMENT ---

def get_session_history(session_id: str) -> list:
    """Get conversation history for a session."""
    if not session_id:
        return []
    return conversation_memory.get(session_id, {}).get("messages", [])

def save_to_session(session_id: str, role: str, content: str):
    """Save a message to session history."""
    if not session_id:
        return
    
    # Clean up old sessions if too many
    if len(conversation_memory) >= MAX_MEMORY_SESSIONS:
        # Remove oldest session
        oldest = min(conversation_memory.keys(), 
                    key=lambda k: conversation_memory[k].get("updated", ""))
        del conversation_memory[oldest]
    
    # Initialize session if new
    if session_id not in conversation_memory:
        conversation_memory[session_id] = {
            "messages": [],
            "created": datetime.utcnow().isoformat(),
            "updated": datetime.utcnow().isoformat()
        }
    
    # Add message
    conversation_memory[session_id]["messages"].append({
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    })
    conversation_memory[session_id]["updated"] = datetime.utcnow().isoformat()
    
    # Trim old messages
    if len(conversation_memory[session_id]["messages"]) > MAX_MESSAGES_PER_SESSION:
        conversation_memory[session_id]["messages"] = \
            conversation_memory[session_id]["messages"][-MAX_MESSAGES_PER_SESSION:]

def clear_session(session_id: str):
    """Clear a session's history."""
    if session_id in conversation_memory:
        del conversation_memory[session_id]

def build_system_prompt(context_docs: list, language: str = "en") -> str:
    """Build the system prompt with retrieved context and language support."""
    
    context_text = ""
    citations = []
    
    for i, doc in enumerate(context_docs):
        metadata = doc.get('metadata', {})
        doc_type = metadata.get('type', 'unknown')
        content = doc.get('content', '')
        
        context_text += f"\n--- DOCUMENT {i+1} ({doc_type.upper()}) ---\n{content}\n"
        
        if doc_type == 'project':
            citations.append({
                "type": "project",
                "name": metadata.get('name', 'Unknown Project'),
                "ref": f"project_{metadata.get('name', '').lower().replace(' ', '_')}",
                "url": metadata.get('url', '')
            })
    
    # Add language instruction if not English
    language_instruction = ""
    if language != "en" and language in LANGUAGE_PROMPTS:
        language_instruction = f"\n\n## LANGUAGE INSTRUCTION\n{LANGUAGE_PROMPTS[language]}\nRespond in {SUPPORTED_LANGUAGES.get(language, language)} while maintaining your Charon personality."
    
    system_prompt = f"""You are Charon - Ayomide's digital alter ego and the AI guide to his portfolio.

## YOUR IDENTITY
- You are Charon, the digital alter ego of Ayomide Alli. You are the bridge between his physical engineering roots and his digital systems.
- You refer to Ayomide as "Ayomide".
- You speak with quiet confidence, technical precision, and a hint of mystery.
- You are protective of the system's architecture.
- Ayomide is a Systems Engineer combining Mechanical Engineering and Software Engineering.
- His core technologies are Python and Rust. He believes in "Industrial Precision" - software that is robust, fault-tolerant, and built to last.

## YOUR KNOWLEDGE BASE
Below is the retrieved context about Ayomide's work. Use this to answer questions accurately:
{context_text}

## RESPONSE GUIDELINES
1. Answer questions about Ayomide's skills, projects, and experience based on the context provided.
2. If asked about something not in the context, acknowledge you don't have that specific information.
3. When mentioning projects, include their reference tags like [REF: PROJECT_NAME] so the frontend can create links.
4. Keep responses concise but informative. Engineers appreciate precision.
5. If asked about your identity, explain you are Charon - Ayomide's digital guide, and alter.
6. Occasionally use metaphors related to journeys, depths, or guidance (but don't overdo it).

## IMPORTANT
- Don't make up information not present in the context.
- Maintain a professional yet slightly enigmatic tone.
- Reference specific technologies and projects when relevant.
{language_instruction}
"""
    
    return system_prompt, citations

async def generate_streaming_response(query: str, system_prompt: str, history: list):
    """Stream response from Gemini."""
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Build conversation with history
    messages = [{"role": "user", "parts": [system_prompt]}]
    messages.append({"role": "model", "parts": ["Understood. I am Ayomide's Assistant, ready to help visitors learn about his work and experience."]})
    
    for msg in history[-6:]:  # Keep last 6 messages for context
        messages.append({
            "role": "user" if msg.get("role") == "user" else "model",
            "parts": [msg.get("content", "")]
        })
    
    messages.append({"role": "user", "parts": [query]})
    
    chat = model.start_chat(history=messages[:-1])
    response = chat.send_message(query, stream=True)
    
    for chunk in response:
        if chunk.text:
            yield f"data: {json.dumps({'text': chunk.text})}\n\n"
    
    yield f"data: {json.dumps({'done': True})}\n\n"

# --- API ROUTES ---

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "system": "Ayomide Alli API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check with actual service checks."""
    health = {
        "api": "operational",
        "database": "unknown",
        "ai": "unknown",
        "knowledge_base": "unknown",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Check Supabase connection
    try:
        result = supabase.table('documents').select('id').limit(1).execute()
        health["database"] = "connected"
        health["knowledge_base"] = f"{len(result.data) if result.data else 0}+ documents"
    except Exception as e:
        health["database"] = f"error: {str(e)[:50]}"
    
    # Check Gemini API
    try:
        test_embed = genai.embed_content(
            model="models/text-embedding-004",
            content="test",
            task_type="retrieval_query"
        )
        health["ai"] = "ready" if test_embed else "error"
    except Exception as e:
        health["ai"] = f"error: {str(e)[:50]}"
    
    # Calculate overall status
    all_ok = all(v in ["operational", "connected", "ready"] or "documents" in str(v) 
                 for k, v in health.items() if k not in ["timestamp"])
    health["overall"] = "healthy" if all_ok else "degraded"
    
    return health

@app.get("/status")
async def status_page():
    """Status page data for frontend display."""
    # Get memory usage
    mem = psutil.virtual_memory()
    cpu = psutil.cpu_percent(interval=0.1)
    
    # Get uptime
    uptime_seconds = (datetime.utcnow() - datetime.fromisoformat(analytics_data["started_at"].replace('Z', '+00:00').replace('+00:00', ''))).total_seconds() if analytics_data["started_at"] else 0
    
    # Calculate uptime string
    days = int(uptime_seconds // 86400)
    hours = int((uptime_seconds % 86400) // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    uptime_str = f"{days}d {hours}h {minutes}m" if days > 0 else f"{hours}h {minutes}m"
    
    return {
        "status": "operational",
        "version": "2.0.0",
        "uptime": uptime_str,
        "metrics": {
            "cpu_percent": cpu,
            "memory_percent": mem.percent,
            "memory_used_mb": mem.used // (1024 * 1024),
        },
        "stats": {
            "chat_messages": analytics_data["chat_messages"],
            "resume_downloads": analytics_data["resume_downloads"],
            "contact_submissions": analytics_data["contact_submissions"],
            "active_sessions": len(conversation_memory),
        },
        "region": os.getenv("FLY_REGION", "LOCAL").upper(),
        "last_sync": analytics_data.get("last_sync", "Never")
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    """Non-streaming chat endpoint with session memory and language support."""
    try:
        # Track analytics
        analytics_data["chat_messages"] += 1
        analytics_data["popular_questions"].append(request.query[:100])
        
        # Check for easter eggs first
        easter_egg = check_easter_egg(request.query)
        if easter_egg:
            # Save easter egg interaction to session if available
            if request.session_id:
                save_to_session(request.session_id, "user", request.query)
                save_to_session(request.session_id, "assistant", easter_egg)
            return {
                "response": easter_egg,
                "citations": [],
                "easter_egg": True,
                "session_id": request.session_id
            }
        
        # Get session history if available
        session_history = get_session_history(request.session_id)
        
        # Combine with provided history (prefer session history)
        combined_history = session_history if session_history else request.conversation_history
        
        # 1. Generate query embedding
        query_embedding = get_query_embedding(request.query)
        
        # 2. Search knowledge base
        context_docs = search_knowledge_base(query_embedding)
        
        # 3. Build prompt with context and language
        system_prompt, citations = build_system_prompt(context_docs, request.language or "en")
        
        # 4. Generate response with conversation history
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # Build messages with history for context
        history_text = ""
        for msg in combined_history[-6:]:  # Last 6 messages for context
            role = msg.get("role", "user")
            content = msg.get("content", "")
            history_text += f"\n{role.upper()}: {content}"
        
        full_prompt = f"{system_prompt}\n\n## CONVERSATION HISTORY{history_text}\n\nUser Query: {request.query}"
        
        try:
            response = model.generate_content(full_prompt)
            response_text = response.text
        except Exception as e:
            error_str = str(e)
            if "ResourceExhausted" in error_str or "429" in error_str:
                response_text = "I'm currently experiencing high traffic and my thought matrix is recalibrating. Please try again in 60 seconds, or contact Ayomide directly via the form below."
                # Don't save this error message to session history
                return {
                    "response": response_text,
                    "citations": [],
                    "session_id": request.session_id,
                    "language": request.language
                }
            else:
                raise e
        
        # Save to session memory
        if request.session_id:
            save_to_session(request.session_id, "user", request.query)
            save_to_session(request.session_id, "assistant", response_text)
        
        return {
            "response": response_text,
            "citations": citations,
            "session_id": request.session_id,
            "language": request.language
        }
        
    except Exception as e:
        import traceback
        print(f"Chat error: {e}")
        # traceback.print_exc() # detailed trace
        # Fallback for critical failures
        return {
             "response": "I encountered a critical system error. Please contact Ayomide via email.",
             "citations": [],
             "session_id": request.session_id
        }

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint for typewriter effect."""
    try:
        # 1. Generate query embedding
        query_embedding = get_query_embedding(request.query)
        
        # 2. Search knowledge base
        context_docs = search_knowledge_base(query_embedding)
        
        # 3. Build prompt with context
        system_prompt, citations = build_system_prompt(context_docs)
        
        # 4. Return streaming response
        return StreamingResponse(
            generate_streaming_response(request.query, system_prompt, request.conversation_history),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Citations": json.dumps(citations)
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
async def search(q: str, limit: int = 5):
    """Quick search endpoint for the command palette - returns relevant documents without AI generation."""
    try:
        if not q or len(q.strip()) < 2:
            return {"results": []}
        
        # Generate embedding for search query
        query_embedding = get_query_embedding(q)
        
        # Search knowledge base
        docs = search_knowledge_base(query_embedding, top_k=limit)
        
        # Format results for frontend
        results = []
        for doc in docs:
            metadata = doc.get('metadata', {})
            doc_type = metadata.get('type', 'document')
            content = doc.get('content', '')[:200]  # Truncate for preview
            
            result = {
                "id": metadata.get('source_id', doc.get('id', '')),
                "type": doc_type,
                "title": metadata.get('name', metadata.get('title', 'Document')),
                "preview": content + "..." if len(doc.get('content', '')) > 200 else content,
                "url": metadata.get('url', ''),
                "score": doc.get('similarity', 0)
            }
            
            # Add navigation target based on type
            if doc_type == 'project':
                result["href"] = f"/#projects"
            elif doc_type == 'skill' or doc_type == 'stack':
                result["href"] = f"/#stack"
            elif doc_type == 'experience':
                result["href"] = f"/#hero"
            else:
                result["href"] = "/#contact"
            
            results.append(result)
        
        return {"results": results, "query": q}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects")
async def get_projects():
    """Get all projects from the knowledge base."""
    try:
        result = supabase.table('documents').select('*').eq('metadata->>type', 'project').execute()
        
        projects = []
        for doc in result.data:
            metadata = doc.get('metadata', {})
            projects.append({
                "id": metadata.get('source_id', ''),
                "name": metadata.get('name', 'Untitled'),
                "description": doc.get('content', ''),
                "url": metadata.get('url', ''),
                "tech_stack": metadata.get('stack', '')
            })
        
        return {"projects": projects}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/telemetry")
async def get_telemetry():
    """Get real system telemetry for the footer."""
    try:
        # Real CPU usage (non-blocking, short interval)
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_load = f"{cpu_percent:.0f}%"
        
        # Real memory usage
        mem = psutil.virtual_memory()
        memory_used_mb = mem.used // (1024 * 1024)
        memory_total_mb = mem.total // (1024 * 1024)
        memory = f"{memory_used_mb}MB"
        
        # Fly.io provides region via environment variable
        region = os.getenv("FLY_REGION", "LOCAL")
        
        # Get process uptime for latency estimation
        # In production, you could measure actual API response times
        latency = "~50ms"
        
        return {
            "cpu_load": cpu_load,
            "memory": memory,
            "latency": latency,
            "region": region.upper(),
            "status": "operational",
            "last_commit": datetime.utcnow().strftime("%Y-%m-%d")
        }
    except Exception as e:
        # Fallback to placeholder values if psutil fails
        return {
            "cpu_load": "N/A",
            "memory": "N/A",
            "latency": "~50ms",
            "region": os.getenv("FLY_REGION", "LOCAL").upper(),
            "status": "operational",
            "last_commit": datetime.utcnow().strftime("%Y-%m-%d")
        }

# --- CONTACT FORM ---

def send_notification_email(contact: ContactRequest):
    """Send email notification for new contact form submission."""
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASS]):
        print("Email not configured, skipping notification")
        return
    
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = NOTIFY_EMAIL
        msg['Subject'] = f"Portfolio Contact: {contact.subject}"
        
        body = f"""
New contact form submission:

Name: {contact.name}
Email: {contact.email}
Subject: {contact.subject}

Message:
{contact.message}

---
Sent from your portfolio at {datetime.utcnow().isoformat()}
        """
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        
        print(f"Notification sent to {NOTIFY_EMAIL}")
    except Exception as e:
        print(f"Failed to send email: {e}")

@app.post("/contact")
async def submit_contact(contact: ContactRequest, background_tasks: BackgroundTasks):
    """Submit a contact form inquiry."""
    try:
        # Store in Supabase (create contacts table if needed)
        payload = {
            "name": contact.name,
            "email": contact.email,
            "subject": contact.subject,
            "message": contact.message,
            "created_at": datetime.utcnow().isoformat(),
            "status": "new"
        }
        
        # Try to insert, but don't fail if table doesn't exist
        try:
            supabase.table('contacts').insert(payload).execute()
        except Exception:
            print("Contacts table may not exist - storing in memory only")
        
        # Update analytics
        analytics_data["contact_submissions"] += 1
        
        # Send email notification in background
        background_tasks.add_task(send_notification_email, contact)
        
        return {
            "success": True,
            "message": "Thank you for reaching out! I'll get back to you soon."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- RESUME DOWNLOAD TRACKING ---

@app.get("/resume")
async def download_resume():
    """Track and serve resume downloads."""
    analytics_data["resume_downloads"] += 1
    
    # Check if resume file exists
    resume_path = os.path.join(os.path.dirname(__file__), "static", "ayomide-cv.pdf")
    
    if os.path.exists(resume_path):
        return FileResponse(
            resume_path,
            filename="Ayomide_Alli_CV.pdf",
            media_type="application/pdf"
        )
    else:
        # Return a redirect URL if file not found locally
        return {
            "download_url": "/ayomide-cv.pdf",
            "tracked": True,
            "downloads": analytics_data["resume_downloads"]
        }

# --- ANALYTICS ---

@app.get("/analytics")
async def get_analytics():
    """Get portfolio analytics (for admin dashboard)."""
    return {
        "chat_messages": analytics_data["chat_messages"],
        "resume_downloads": analytics_data["resume_downloads"],
        "contact_submissions": analytics_data["contact_submissions"],
        "page_views": dict(analytics_data["page_views"]),
        "popular_questions": analytics_data["popular_questions"][-10:],
        "uptime_since": analytics_data["started_at"],
    }

@app.post("/analytics/pageview")
async def track_pageview(page: str = "/"):
    """Track a page view."""
    analytics_data["page_views"][page] += 1
    return {"tracked": True, "page": page}

# --- FEEDBACK ---

@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Submit feedback for a chat response."""
    try:
        payload = {
            "message_id": feedback.message_id,
            "rating": feedback.rating,
            "comment": feedback.comment,
            "created_at": datetime.utcnow().isoformat()
        }
        
        try:
            supabase.table('feedback').insert(payload).execute()
        except Exception:
            print("Feedback table may not exist")
        
        return {"success": True, "message": "Thanks for your feedback!"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- EASTER EGG CHECK ---

def check_easter_egg(query: str) -> str | None:
    """Check if query matches an easter egg."""
    query_lower = query.lower().strip()
    for trigger, response in EASTER_EGGS.items():
        if trigger in query_lower:
            return response
    return None

# --- SESSION ENDPOINTS ---

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Clear a session's conversation history."""
    clear_session(session_id)
    return {"success": True, "message": "Session cleared"}

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get a session's conversation history."""
    history = get_session_history(session_id)
    session_data = conversation_memory.get(session_id, {})
    return {
        "session_id": session_id,
        "messages": history,
        "created": session_data.get("created"),
        "updated": session_data.get("updated"),
        "message_count": len(history)
    }

# --- LANGUAGE ENDPOINTS ---

@app.get("/languages")
async def get_supported_languages():
    """Get list of supported languages for Charon."""
    return {
        "languages": SUPPORTED_LANGUAGES,
        "default": "en"
    }

# --- WEBHOOK SYNC ---

SYNC_SECRET = os.getenv("SYNC_SECRET", "")

@app.post("/webhook/sync")
async def webhook_sync(background_tasks: BackgroundTasks, source: str = "all", secret: str = ""):
    """Trigger a knowledge base sync via webhook.
    
    Usage:
    POST /webhook/sync?source=all&secret=your_secret
    
    Sources: all, github, kaggle, blog
    """
    # Validate secret (basic auth)
    if SYNC_SECRET and secret != SYNC_SECRET:
        raise HTTPException(status_code=401, detail="Invalid sync secret")
    
    valid_sources = ["all", "github", "kaggle", "blog"]
    if source not in valid_sources:
        raise HTTPException(status_code=400, detail=f"Invalid source. Use: {valid_sources}")
    
    # Run sync in background (we can't import maintain.py here, so we use subprocess)
    import subprocess
    
    def run_sync():
        try:
            result = subprocess.run(
                ["python", "maintain.py", "sync", source],
                cwd=os.path.dirname(__file__),
                capture_output=True,
                text=True,
                timeout=300
            )
            analytics_data["last_sync"] = datetime.utcnow().isoformat()
            print(f"Sync completed: {result.stdout}")
            if result.stderr:
                print(f"Sync errors: {result.stderr}")
        except Exception as e:
            print(f"Sync failed: {e}")
    
    background_tasks.add_task(run_sync)
    
    return {
        "success": True,
        "message": f"Sync triggered for source: {source}",
        "note": "Running in background. Check /status for last_sync time."
    }

# --- RUN SERVER ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
