const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
  async createChat(title = 'New Chat') {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return response.json();
  },

  async getChats() {
    const response = await fetch(`${API_BASE_URL}/chats`);
    return response.json();
  },

  async getChat(chatId) {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`);
    return response.json();
  },

  async sendMessage(chatId, content, onToken, onComplete, onError) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log(data)
              if (data.token) {
                onToken(data.token);
              } else if (data.titleUpdate) {
                onToken(null, data.titleUpdate); 
              } else if (data.done) {
                onComplete();
                return;
              } else if (data.error) {
                onError(new Error(data.error));
                return;
              }
            } catch (e) {
            }
          }
        }
      }
    } catch (error) {
      onError(error);
    }
  },

  async stopMessage(chatId) {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/stop`, {
      method: 'POST',
    });
    return response.json();
  },
};