import { useState, useRef, useEffect } from 'react'
import { useChat } from '../../hooks/useChat.js'
import { useProfile } from '../../hooks/useProfile.js'
import MessageBubble from './MessageBubble.jsx'

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-sm">
      <div className="w-8 h-8 rounded-full bg-surface-container border border-white/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '16px' }}>
          support_agent
        </span>
      </div>
      <div className="backdrop-blur-md bg-surface-container-high/40 border border-white/10 rounded-2xl rounded-tl-none p-sm">
        <div className="flex items-center gap-1.5 px-1 py-1">
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

export default function ChatPanel() {
  const { messages, isLoading, error, sendMessage, clearChat, isAvailable } = useChat()
  const { profileId, profile, uiPreferences } = useProfile()
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // ── Auto-scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Submit handler ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = inputText.trim()
    if (!text || isLoading) return

    setInputText('')
    await sendMessage(text)
    inputRef.current?.focus()
  }

  // ── Keyboard: Enter to send, Shift+Enter for newline ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex-1 h-full w-full flex flex-col border border-white/5 rounded-xl overflow-hidden bg-surface-container-lowest/30 backdrop-blur-sm shadow-2xl relative min-h-0">
        
        {/* ── Header ── */}
        <header className="shrink-0 p-6 flex items-center justify-between bg-surface-container-high/20 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="font-title-lg text-title-lg text-on-surface tracking-tight">Chat Assistance</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Real-time support</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 hidden sm:flex">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/30">
                <img 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNDLYRgjI9mWRXL9J095ffvM3KhNvI-QrvdukQEvB0AgYHRUO1IKXUmzJoHoj3i2LomVlfMmXxfEj9DzWbziknVry1PpxaTkOpPc4xeS-0jyQcqK8WWTYQzYaL9NZYPmmo6q7uMFrzcmCDBeGTFxIuGOkvjhcJYkkKlVRD7q_Nd_5ZLKB1d-64WffocMfdM9eJ7ZX89JfP-iBKEY8escEjEM6LdmMO2U0YIhO8tq2PrJSmW0pq18Fc1qbTcdbfXFgbt2asY9wYyZSH" 
                  alt="FanPulse AI"
                />
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-secondary rounded-full border border-surface-container-low animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold text-on-surface">FanPulse AI</span>
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                  {isLoading ? 'Thinking' : 'Online'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-error-container/20 text-error transition-all active:scale-95 group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
            <span className="font-label-lg text-label-lg">Clear</span>
          </button>
        </header>

        {/* ── Banners Section ── */}
        <div className="shrink-0 flex flex-col">
          {/* Privacy Warning */}
          <div className="px-6 py-3 bg-surface-container-low/60 border-b border-white/10 flex items-start gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] mt-0.5">lock</span>
            <p className="font-body-md text-[12px] text-on-surface-variant leading-relaxed">
              Messages are processed by AI to help you. No personal data is stored beyond the session to ensure your privacy and security. 
              <span className="text-primary hover:underline ml-1 cursor-pointer">Learn more about our AI ethics.</span>
            </p>
          </div>
          
          {/* Error Banner */}
          {error && (
            <div className="px-6 py-3 bg-error-container/30 border-b border-error/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-error text-[18px] mt-0.5">error</span>
              <p className="font-body-md text-[12px] text-error leading-relaxed">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* ── Message History ── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar" id="message-container">
          {/* Date Badge */}
          <div className="flex justify-center my-2">
            <span className="px-4 py-1 bg-surface-container-highest/40 backdrop-blur-sm border border-white/5 rounded-full text-[12px] font-medium text-on-surface-variant">
              {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Message Bubbles */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator />}

          {/* Scroll Anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <footer className="shrink-0 p-4 border-t border-white/5 bg-surface-container-lowest/80 backdrop-blur-xl mt-auto">
          {isAvailable ? (
            <form className="flex items-center gap-3 relative" onSubmit={handleSubmit}>
              <div className="relative flex-1 group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 group-focus-within:text-primary transition-colors">attachment</span>
                <input 
                  ref={inputRef}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-on-surface placeholder:text-on-surface-variant/40 transition-all outline-none font-body-md" 
                  placeholder="Type a message or request..." 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined font-bold text-[28px]">send</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-on-surface-variant text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cloud_off</span>
                AI assistant unavailable. Please check API key configuration.
              </p>
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
