import { query } from '../models/database.js';
import ollamaService from '../services/ollamaService.js';

export const createChat = async (req, res) => {
  try {
    const { title } = req.body;
    const result = await query(
      'INSERT INTO chats (title) VALUES ($1) RETURNING *',
      [title || 'New Chat']
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChats = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM chats ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chatResult = await query('SELECT * FROM chats WHERE id = $1', [chatId]);
    const messagesResult = await query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chatId]
    );

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({
      chat: chatResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendMessage = async (req, res) => {
   try {

    const { chatId } = req.params;
    const { content } = req.body;


    await query(
      'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chatId, 'user', content]
    );

    const messageCount = await query(
      'SELECT COUNT(*) FROM messages WHERE chat_id = $1 AND role = $2',
      [chatId, 'user']
    );

    const isFirstMessage = messageCount.rows[0].count === '1';

    const messagesResult = await query(
      'SELECT role, content FROM messages WHERE chat_id = $1 ORDER BY timestamp ASC',
      [chatId]
    );

    const messages = messagesResult.rows.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    let assistantResponse = '';
    await ollamaService.streamChat(
      chatId,
      messages,
      (token) => {
        assistantResponse += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      async (fullResponse) => {
        const finalResponse = assistantResponse || fullResponse;
        
        if (finalResponse) {
          await query(
            'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
            [chatId, 'assistant', finalResponse]
          );

          if (isFirstMessage) {
            try {
              const intelligentTitle = await ollamaService.generateChatTitle(content, finalResponse);
              await query('UPDATE chats SET title = $1 WHERE id = $2', [intelligentTitle, chatId]);
              
              res.write(`data: ${JSON.stringify({ titleUpdate: intelligentTitle })}\n\n`);
            } catch (error) {
              console.error('Failed to generate title:', error);
              const fallbackTitle = content.length > 50 ? content.substring(0, 47) + '...' : content;
              await query('UPDATE chats SET title = $1 WHERE id = $2', [fallbackTitle, chatId]);
            }
          }
        }
        
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      },
      (error) => {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    );

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const stopMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const stopped = ollamaService.stopStream(chatId);
    res.json({ stopped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};