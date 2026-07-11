import React from 'react';

export default function MobileChatView({
  activeView,
  chatScrollRef,
  messages,
  chatInput,
  setChatInput,
  handleChatSubmit,
  isLoading
}) {
  return (
    <section className={`view chat-view ${activeView === 'chat' ? 'active' : ''}`} style={{ display: activeView === 'chat' ? 'flex' : 'none' }}>
      <div className="chat-banner">
        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock</span>
        <span>Messages are processed by AI to help you. No personal data is stored beyond the session.</span>
      </div>
      <div className="chat-scroll" ref={chatScrollRef}>
        <span className="date-badge">{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        {messages.map((msg, i) => (
          <div key={i} className={`msg-row ${msg.role === 'user' ? 'user' : 'bot'}`}>
            <div className="msg-avatar"><span className="material-symbols-outlined">{msg.role === 'user' ? 'person' : 'support_agent'}</span></div>
            <div className="bubble">
              {msg.text}
              <time>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
            </div>
          </div>
        ))}
      </div>
      <form className="chat-input-bar" onSubmit={handleChatSubmit}>
        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message or request..." autoComplete="off" />
        <button type="submit" className="send-btn" disabled={isLoading || !chatInput.trim()}><span className="material-symbols-outlined">send</span></button>
      </form>
    </section>
  );
}
