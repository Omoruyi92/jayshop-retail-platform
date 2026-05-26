'use client'
import { useState, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatFAB() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Birdie, your Jays Shop assistant. Ask me about products, holds, or how to find your size!" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-chat', handler)
    return () => window.removeEventListener('open-chat', handler)
  }, [])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })
      const data = await res.json()
      if (data.demoMode) setDemoMode(true)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply ?? 'Sorry, I had trouble responding.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I'm unavailable right now." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 sm:bottom-6 right-4 z-50 bg-jays-royal text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-jays-navy transition-colors"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {open && (
        <>
          {/* Backdrop (mobile) */}
          <div
            className="sm:hidden fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
          />

          {/* Chat drawer */}
          <div className="fixed bottom-0 sm:bottom-6 right-0 sm:right-4 z-50 w-full sm:w-80 bg-white sm:rounded-2xl shadow-2xl border border-border flex flex-col max-h-[85dvh] sm:max-h-[70vh]">
            {/* Header */}
            <div className="bg-jays-navy text-white px-4 py-3 sm:rounded-t-2xl flex items-center justify-between shrink-0">
              <div>
                <p className="font-display font-semibold uppercase text-sm">Birdie</p>
                <p className="text-blue-200 text-xs">Jays Shop Assistant</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center hover:opacity-70 transition-opacity"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            {demoMode && (
              <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-xs text-amber-700 font-medium shrink-0">
                Demo mode — canned replies (set OPENAI_API_KEY for live AI)
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-jays-navy text-white rounded-br-sm'
                      : 'bg-jays-ice text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-jays-ice rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-jays-steel">
                    Typing...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2 shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask about products or holds..."
                className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="bg-jays-red text-white w-11 h-11 flex items-center justify-center rounded-xl hover:bg-red-600 disabled:opacity-40 transition-colors"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
