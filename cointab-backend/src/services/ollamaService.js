import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

export class OllamaService {
  constructor() {
    this.abortControllers = new Map();
  }



  async generateChatTitle(userMessage, assistantResponse) {
    try {
      const titlePrompt = `Based on this conversation, generate a concise, descriptive title (maximum 6 words) that captures the main topic or purpose:

User: ${userMessage}

Generate only the title, nothing else. Examples of good titles:
- "React Component Debugging Help"
- "Marketing Strategy Planning"
- "Python Data Analysis Guide"
- "Investment Portfolio Review"

Title:`;

      const response = await axios.post(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          model: 'gemma3:1b',
          prompt: titlePrompt,
          stream: false,
        }
      );

      const title = response.data.response.trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^Title:\s*/i, '') 
        .trim();

      if (!title || title.length > 60) {
        return userMessage.length > 50 ? userMessage.substring(0, 47) + '...' : userMessage;
      }

      return title;
    } catch (error) {
      console.error('Failed to generate title:', error);
      return userMessage.length > 50 ? userMessage.substring(0, 47) + '...' : userMessage;
    }
  }

  async streamChat(chatId, messages, onToken, onComplete, onError) {
    const abortController = new AbortController();
    this.abortControllers.set(chatId, abortController);

    try {
      const response = await axios.post(
        `${OLLAMA_BASE_URL}/api/chat`,
        {
          model: 'gemma3:1b', 
          messages: messages,
          stream: true,
        },
        {
          responseType: 'stream',
          signal: abortController.signal,
        }
      );

      let fullResponse = '';

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              fullResponse += parsed.message.content;
              onToken(parsed.message.content);
            }
            if (parsed.done) {
              this.abortControllers.delete(chatId);
              onComplete(fullResponse);
              return;
            }
          } catch (e) {
          }
        }
      });

      response.data.on('error', (error) => {
        this.abortControllers.delete(chatId);
        onError(error);
      });

    } catch (error) {
      this.abortControllers.delete(chatId);
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        onComplete(''); 
      } else {
        onError(error);
      }
    }
  }

  stopStream(chatId) {
    const controller = this.abortControllers.get(chatId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(chatId);
      return true;
    }
    return false;
  }
}

export default new OllamaService();