'use client';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import ChatSidebar from './ChatSidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatInterface() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const chatList = await api.getChats();
      setChats(chatList);
      if (chatList.length > 0 && !activeChat) {
        selectChat(chatList[0]);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const selectChat = async (chat) => {
    try {
      const chatData = await api.getChat(chat.id);
      setActiveChat(chat);
      setMessages(chatData.messages || []);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const newChat = await api.createChat();
      setChats([newChat, ...chats]);
      setActiveChat(newChat);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const sendMessage = async (content) => {
    if (!activeChat) {
      const newChat = await api.createChat('New Chat');
      setChats([newChat, ...chats]);
      setActiveChat(newChat);
      setMessages([]);
      
      await sendMessageToChat(newChat.id, content);
    } else {
      await sendMessageToChat(activeChat.id, content);
    }
  };

  const sendMessageToChat = async (chatId, content) => {
  const userMessage = { role: 'user', content };
  setMessages(prev => [...prev, userMessage]);

  setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
  setIsStreaming(true);

  try {
    await api.sendMessage(
      chatId,
      content,
      (token, titleUpdate) => {
        if (titleUpdate) {
          setChats(prev =>
            prev.map(chat =>
              chat.id === chatId ? { ...chat, title: titleUpdate } : chat
            )
          );
        } else if (token) {
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + token
            };
            return updated;
          });
        }
      },
      () => {
        setIsStreaming(false);
        loadChats(); 
      },
      error => {
        console.error('Streaming error:', error);
        setIsStreaming(false);
      }
    );
  } catch (error) {
    console.error('Failed to send message:', error);
    setIsStreaming(false);
  }
};


  const stopMessage = async () => {
    if (activeChat) {
      try {
        await api.stopMessage(activeChat.id);
        if (streamingMessage) {
          setMessages(prev => [...prev, { role: 'assistant', content: streamingMessage }]);
        }
        setStreamingMessage('');
        setIsStreaming(false);
      } catch (error) {
        console.error('Failed to stop message:', error);
      }
    }
  };

  const displayMessages = [...messages];
  if (isStreaming && streamingMessage) {
    displayMessages.push({ role: 'assistant', content: streamingMessage });
  }

  return (
    <div className="container">
      <ChatSidebar
        chats={chats}
        activeChat={activeChat}
        onChatSelect={selectChat}
        onNewChat={createNewChat}
      />
      <div className="main-content">
        <MessageList messages={displayMessages} isStreaming={isStreaming && !streamingMessage} />
        <MessageInput
          onSendMessage={sendMessage}
          onStopMessage={stopMessage}
          isStreaming={isStreaming}
          disabled={!activeChat && chats.length === 0}
        />
      </div>
    </div>
  );
}