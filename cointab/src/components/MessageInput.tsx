'use client';
import { useState } from 'react';

export default function MessageInput({ onSendMessage, onStopMessage, isStreaming, disabled }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="input-container">
      <form onSubmit={handleSubmit} className="input-wrapper">
        <textarea
          className="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          disabled={disabled}
          rows={1}
        />
        {isStreaming ? (
          <button
            type="button"
            className="stop-btn"
            onClick={onStopMessage}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="send-btn"
            disabled={!input.trim() || disabled}
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}