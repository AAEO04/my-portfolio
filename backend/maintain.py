import os
import argparse
import sys
import requests
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Optional
import base64

# --- CONFIGURATION ---
load_dotenv()

# Check for API Keys
if not os.getenv("GEMINI_API_KEY") or not os.getenv("SUPABASE_KEY"):
    print("❌ Error: Missing API keys in .env file.")
    sys.exit(1)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# --- CONFIGURATION VARS ---
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "AAEO04")
KAGGLE_USERNAME = os.getenv("KAGGLE_USERNAME", "allieniola")
KAGGLE_KEY = os.getenv("KAGGLE_KEY", "")
HASHNODE_USERNAME = os.getenv("HASHNODE_USERNAME", "AAEO")

# --- CORE FUNCTIONS ---

def get_embedding(text: str) -> list:
    """Generates vector using Gemini 1.5 embedding model."""
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document",
            title="Ayomide Portfolio Asset"
        )
        return result['embedding']
    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
        return None

def upload_knowledge(source_id: str, content: str, metadata: dict) -> bool:
    """Idempotent upload: Deletes old version, inserts new version."""
    print(f"⚙  Processing '{source_id}'...")
    
    # 1. Purge old data to prevent duplicates
    try:
        supabase.table('documents').delete().eq('metadata->>source_id', source_id).execute()
        print(f"   - Old records purged.")
    except Exception as e:
        print(f"   - Warning: Could not purge old data (might be new). {e}")

    # 2. Generate Vector
    print(f"   - Generating embedding with Gemini...")
    vector = get_embedding(content)
    
    if vector is None:
        print(f"   - ❌ Failed to generate embedding.\n")
        return False

    # 3. Insert New Data
    metadata['source_id'] = source_id
    payload = {
        "content": content,
        "metadata": metadata,
        "embedding": vector
    }
    
    try:
        supabase.table('documents').insert(payload).execute()
        print(f"   - ✅ Success: Knowledge base updated.\n")
        return True
    except Exception as e:
        print(f"   - ❌ Failed to insert: {e}\n")
        return False

# --- SYNC FUNCTIONS ---

def sync_github() -> int:
    """Sync GitHub projects to knowledge base."""
    print(f"\n🐙 Syncing GitHub projects from @{GITHUB_USERNAME}...")
    
    try:
        response = requests.get(
            f"https://api.github.com/users/{GITHUB_USERNAME}/repos",
            params={"sort": "pushed", "per_page": 20, "type": "owner"},
            headers={"Accept": "application/vnd.github.v3+json"}
        )
        response.raise_for_status()
        repos = response.json()
    except Exception as e:
        print(f"❌ GitHub API Error: {e}")
        return 0
    
    synced = 0
    for repo in repos:
        # Skip forks only
        if repo.get('fork'):
            continue
        
        name = repo['name']
        source_id = f"github_{name.lower().replace('-', '_')}"
        
        # Build rich content for better RAG
        content = f"""Project: {name}
Description: {repo.get('description', 'No description')}
Language: {repo.get('language', 'Unknown')}
Topics: {', '.join(repo.get('topics', []))}
Stars: {repo.get('stargazers_count', 0)}
URL: {repo['html_url']}

This is a GitHub project by Ayomide Alli. It demonstrates skills in {repo.get('language', 'programming')}."""
        
        metadata = {
            "type": "project",
            "source": "github",
            "name": name,
            "url": repo['html_url'],
            "language": repo.get('language'),
            "stars": repo.get('stargazers_count', 0),
            "topics": repo.get('topics', []),
        }
        
        if upload_knowledge(source_id, content, metadata):
            synced += 1
    
    print(f"✅ Synced {synced} GitHub projects.\n")
    return synced

def sync_kaggle() -> int:
    """Sync Kaggle notebooks to knowledge base."""
    print(f"\n📊 Syncing Kaggle notebooks from @{KAGGLE_USERNAME}...")
    
    if not KAGGLE_KEY:
        print("⚠️  KAGGLE_KEY not configured. Skipping Kaggle sync.")
        return 0
    
    try:
        auth = base64.b64encode(f"{KAGGLE_USERNAME}:{KAGGLE_KEY}".encode()).decode()
        response = requests.get(
            f"https://www.kaggle.com/api/v1/kernels/list",
            params={"user": KAGGLE_USERNAME, "pageSize": 20},
            headers={"Authorization": f"Basic {auth}"}
        )
        response.raise_for_status()
        kernels = response.json()
    except Exception as e:
        print(f"❌ Kaggle API Error: {e}")
        return 0
    
    synced = 0
    for kernel in kernels:
        title = kernel.get('title', 'Untitled')
        slug = kernel.get('slug', '')
        source_id = f"kaggle_{slug.replace('/', '_').lower()}"
        
        content = f"""Kaggle Notebook: {title}
Author: {kernel.get('author', KAGGLE_USERNAME)}
Language: {kernel.get('language', 'Python')}
Type: {kernel.get('kernelType', 'notebook')}
Votes: {kernel.get('totalVotes', 0)}
URL: https://www.kaggle.com/code/{kernel.get('ref', '')}

This is a Kaggle notebook/kernel by Ayomide Alli showcasing data science and machine learning skills."""
        
        metadata = {
            "type": "notebook",
            "source": "kaggle",
            "name": title,
            "url": f"https://www.kaggle.com/code/{kernel.get('ref', '')}",
            "language": kernel.get('language', 'Python'),
            "votes": kernel.get('totalVotes', 0),
        }
        
        if upload_knowledge(source_id, content, metadata):
            synced += 1
    
    print(f"✅ Synced {synced} Kaggle notebooks.\n")
    return synced

def sync_blog() -> int:
    """Sync Hashnode blog posts to knowledge base."""
    print(f"\n✍️  Syncing blog posts from @{HASHNODE_USERNAME}...")
    
    # Hashnode GraphQL query
    query = """
    query GetUserArticles($username: String!) {
        user(username: $username) {
            publications(first: 1) {
                edges {
                    node {
                        posts(first: 20) {
                            edges {
                                node {
                                    id
                                    title
                                    brief
                                    content {
                                        text
                                    }
                                    slug
                                    url
                                    publishedAt
                                    tags {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    """
    
    try:
        response = requests.post(
            "https://gql.hashnode.com",
            json={"query": query, "variables": {"username": HASHNODE_USERNAME}},
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"❌ Hashnode API Error: {e}")
        return 0
    
    # Extract posts from nested structure
    try:
        publications = data.get('data', {}).get('user', {}).get('publications', {}).get('edges', [])
        if not publications:
            print("   No publications found.")
            return 0
        
        posts_edges = publications[0].get('node', {}).get('posts', {}).get('edges', [])
        posts = [edge['node'] for edge in posts_edges]
    except Exception as e:
        print(f"❌ Error parsing Hashnode response: {e}")
        return 0
    
    synced = 0
    for post in posts:
        title = post.get('title', 'Untitled')
        slug = post.get('slug', '')
        source_id = f"blog_{slug.replace('-', '_').lower()}"
        
        # Get full content or brief
        full_content = post.get('content', {}).get('text', '') if post.get('content') else ''
        brief = post.get('brief', '')
        content_text = full_content[:2000] if full_content else brief  # Limit for embedding
        
        tags = [tag['name'] for tag in post.get('tags', [])]
        
        content = f"""Blog Post: {title}
Author: Ayomide Alli
Tags: {', '.join(tags)}
URL: {post.get('url', '')}

{content_text}

This is a technical blog post by Ayomide Alli discussing topics related to {', '.join(tags) if tags else 'software engineering'}."""
        
        metadata = {
            "type": "blog",
            "source": "hashnode",
            "name": title,
            "url": post.get('url', ''),
            "tags": tags,
            "published_at": post.get('publishedAt', ''),
        }
        
        if upload_knowledge(source_id, content, metadata):
            synced += 1
    
    print(f"✅ Synced {synced} blog posts.\n")
    return synced

def sync_all() -> dict:
    """Sync all sources to knowledge base."""
    print("\n" + "="*50)
    print("🔄 CHARON KNOWLEDGE BASE SYNC")
    print("="*50)
    
    results = {
        "github": sync_github(),
        "kaggle": sync_kaggle(),
        "blog": sync_blog(),
    }
    
    print("="*50)
    print("📊 SYNC SUMMARY")
    print("="*50)
    print(f"   GitHub projects: {results['github']}")
    print(f"   Kaggle notebooks: {results['kaggle']}")
    print(f"   Blog posts: {results['blog']}")
    print(f"   Total: {sum(results.values())}")
    print("="*50 + "\n")
    
    return results

# --- CLI COMMANDS ---

def handle_cv_update(args):
    """Reads a text file and updates the CV section."""
    if not os.path.exists(args.file):
        print(f"❌ Error: File '{args.file}' not found.")
        return

    with open(args.file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"📄 Updating CV from {args.file}...")
    upload_knowledge("cv_main", content, {"type": "resume", "category": "core_bio"})

def handle_project_add(args):
    """Adds a new project entry."""
    full_text = f"Project Name: {args.name}. Description: {args.desc}. Tech Stack: {args.stack}."
    source_id = f"project_{args.name.lower().replace(' ', '_')}"
    
    print(f"🛠  Adding Project: {args.name}...")
    upload_knowledge(source_id, full_text, {
        "type": "project", 
        "name": args.name, 
        "url": args.url
    })

def handle_philosophy(args):
    """Adds a 'Hidden Context' thought/philosophy."""
    source_id = f"thought_{args.topic.lower()}"
    print(f"🧠 Adding Philosophy on {args.topic}...")
    upload_knowledge(source_id, args.text, {"type": "philosophy", "topic": args.topic})

def handle_sync(args):
    """Handle sync command with sub-commands."""
    source = args.source.lower() if args.source else 'all'
    
    if source == 'all':
        sync_all()
    elif source == 'github':
        sync_github()
    elif source == 'kaggle':
        sync_kaggle()
    elif source == 'blog':
        sync_blog()
    else:
        print(f"❌ Unknown source: {source}")
        print("   Valid options: all, github, kaggle, blog")

# --- MAIN DRIVER ---

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Charon Knowledge Base Manager - Keep Ayomide's AI assistant up to date"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Command: update-cv
    cv_parser = subparsers.add_parser("update-cv", help="Update your CV from a text file")
    cv_parser.add_argument("--file", required=True, help="Path to your CV text file (e.g., cv.txt)")

    # Command: add-project
    proj_parser = subparsers.add_parser("add-project", help="Add a new project to the RAG")
    proj_parser.add_argument("--name", required=True, help="Project Name")
    proj_parser.add_argument("--desc", required=True, help="Project Description")
    proj_parser.add_argument("--stack", required=True, help="Tech Stack (comma separated)")
    proj_parser.add_argument("--url", help="GitHub or Live URL", default="")

    # Command: add-thought
    thought_parser = subparsers.add_parser("add-thought", help="Add a philosophical note")
    thought_parser.add_argument("--topic", required=True, help="Topic (e.g., 'testing')")
    thought_parser.add_argument("--text", required=True, help="The content text")

    # Command: sync
    sync_parser = subparsers.add_parser("sync", help="Sync knowledge from external sources")
    sync_parser.add_argument(
        "source", 
        nargs="?",
        default="all",
        help="Source to sync: all, github, kaggle, blog (default: all)"
    )

    args = parser.parse_args()

    if args.command == "update-cv":
        handle_cv_update(args)
    elif args.command == "add-project":
        handle_project_add(args)
    elif args.command == "add-thought":
        handle_philosophy(args)
    elif args.command == "sync":
        handle_sync(args)
    else:
        parser.print_help()
