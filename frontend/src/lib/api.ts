// API Configuration and helper functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Citation {
  type: string;
  name: string;
  ref: string;
  url?: string;
}

export interface ChatResponse {
  response: string;
  citations: Citation[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  tech_stack: string;
}

export interface Telemetry {
  cpu_load: string;
  memory: string;
  latency: string;
  region: string;
  status: string;
  last_commit: string;
}

// Fetch with error handling
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Chat API - Non-streaming
export async function sendChatMessage(
  query: string,
  history: ChatMessage[] = []
): Promise<ChatResponse> {
  return fetchAPI<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({ query, conversation_history: history }),
  });
}

// Chat API - Streaming
export async function* streamChatMessage(
  query: string,
  history: ChatMessage[] = []
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, conversation_history: history }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.text) {
            yield data.text;
          }
          if (data.done) {
            return;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}

// Projects API
export async function getProjects(): Promise<{ projects: Project[] }> {
  return fetchAPI<{ projects: Project[] }>('/projects');
}

// Telemetry API
export async function getTelemetry(): Promise<Telemetry> {
  return fetchAPI<Telemetry>('/telemetry');
}

// Health Check
export async function healthCheck(): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>('/health');
}
