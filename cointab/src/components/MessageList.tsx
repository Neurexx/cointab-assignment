'use client';

export default function MessageList({ messages, isStreaming }) {
  return (
    <div className="messages-container">
      {messages.length === 0 && !isStreaming ? (
        <div className="welcome">
          <div>
            <h1>How can I help you today?</h1>
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'user' ? 'U' : 'AI'}
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))
      )}
      {isStreaming && (
        <div className="message assistant">
          <div className="message-avatar">AI</div>
          <div className="message-content">
            <span className="typing-indicator"></span>
          </div>
        </div>
      )}
    </div>
  );
}