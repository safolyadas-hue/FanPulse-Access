/**
 * MessageBubble.jsx — Individual Chat Message
 *
 * Renders a single message with M3 tokens differentiating sender:
 *   - User:      align-right, bg-primary/20, border-primary/30
 *   - Assistant:  align-left,  bg-surface-container-high/60, border-white/10
 *   - System:    centered,    subtle, informational
 *
 * Supports basic markdown-like formatting in assistant responses:
 *   - **bold** → <strong>
 *   - Numbered lists and bullet points preserved
 */

/**
 * Lightweight formatter: converts **bold** markers and preserves line breaks.
 * Keeps things simple and XSS-safe (no dangerouslySetInnerHTML).
 */
function formatText(text) {
  if (!text) return null

  // Split by lines to preserve structure
  return text.split('\n').map((line, i, arr) => {
    // Convert **bold** markers
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const formatted = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={j} className="font-bold text-on-surface">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })

    return (
      <span key={i}>
        {formatted}
        {i < arr.length - 1 && <br />}
      </span>
    )
  })
}

export default function MessageBubble({ message }) {
  const { role, text, timestamp } = message

  // ── System messages (rate limit warnings, truncation notices) ──
  if (role === 'system') {
    return (
      <div className="flex justify-center my-sm">
        <div className="bg-surface-container-low px-md py-sm rounded-full text-sm text-on-surface-variant border border-white/5 flex items-center gap-2 backdrop-blur-sm max-w-[90%]">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
          <span>{text}</span>
        </div>
      </div>
    )
  }

  const isUser = role === 'user'
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex gap-sm ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={[
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isUser
            ? 'bg-primary border border-primary/50'
            : 'bg-surface-container border border-white/10',
        ].join(' ')}
      >
        <span
          className={[
            'material-symbols-outlined',
            isUser ? 'text-on-primary' : 'text-on-surface-variant',
          ].join(' ')}
          style={{ fontSize: '16px' }}
        >
          {isUser ? 'person' : 'support_agent'}
        </span>
      </div>

      {/* Bubble */}
      <div
        className={[
          'rounded-2xl p-sm max-w-[80%]',
          isUser
            ? 'rounded-tr-none bg-primary/15 border border-primary/30'
            : 'rounded-tl-none glass-card bg-surface-container-high/60',
        ].join(' ')}
      >
        {/* Message text */}
        <p className="text-on-surface text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {formatText(text)}
        </p>

        {/* Timestamp */}
        <p className={`text-xs mt-1 ${isUser ? 'text-primary/60 text-right' : 'text-on-surface-variant/60'}`}>
          {time}
        </p>
      </div>
    </div>
  )
}
