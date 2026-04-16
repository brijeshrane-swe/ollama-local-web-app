import { useState, useCallback } from 'react';
import { Message, Settings } from '../types';

export function useOllama() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    host: string,
    model: string,
    messages: Message[],
    onChunk: (chunk: string, type?: 'content' | 'thinking') => void,
    signal?: AbortSignal
  ) => {
    setIsStreaming(true);
    setError(null);

    try {
      // Clean and Prune messages for API (Last 12 messages to keep it fast)
      // This reduces Prompt Evaluation time significantly
      const chatHistory = messages.length > 12 ? messages.slice(-12) : messages;
      
      const apiMessages = chatHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(`${host}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: apiMessages,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to connect to Ollama: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        // Ollama sends multiple JSON objects in one chunk sometimes
        const lines = chunkValue.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            
            // Handle standard content
            if (json.message?.content) {
              onChunk(json.message.content, 'content');
            }
            
            // Handle "thinking" or "reasoning" fields from newer models
            if (json.message?.thinking) {
              onChunk(json.message.thinking, 'thinking');
            }

            if (json.done) {
              done = true;
            }
          } catch (e) {
            console.error('Error parsing Ollama chunk:', e);
          }
        }
      }
    } catch (err: any) {
      let errorMessage = err.message || 'An unknown error occurred';
      
      // Diagnose common local fetch errors
      if (err instanceof TypeError && errorMessage === 'Failed to fetch') {
        const isHttpsApp = window.location.protocol === 'https:';
        const isHttpHost = host.startsWith('http:');

        if (isHttpsApp && isHttpHost) {
          errorMessage = 'Mixed Content Blocked: Browser blocks HTTPS (this app) from talking to HTTP (your Ollama). You must use an HTTPS tunnel (like ngrok) or an HTTPS-enabled host address.';
        } else {
          errorMessage = 'Connection Refused: Check if Ollama is running, your firewall allows port 11434, and OLLAMA_ORIGINS="*" is set.';
        }
      }

      setError(errorMessage);
      console.error('Ollama Error:', err);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { sendMessage, isStreaming, error };
}
