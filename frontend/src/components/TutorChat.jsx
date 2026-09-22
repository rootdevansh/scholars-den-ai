import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, ChevronDown } from 'lucide-react';
import { api } from '../hooks/useApi';
import toast from 'react-hot-toast';

export default function TutorChat({ topicId, topicName, subject, planId, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey! 👋 I'm your AI Tutor. I'm here to help you with **${topicName}** in **${subject}**.\n\nAsk me anything — concepts, worked examples, or just say "explain simpler" for a basic breakdown!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on open
  useEffect(() => { inputRef.current?.focus(); }, []);

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content }));
      const { data } = await api.post('/tutor/ask', {
        planId,
        topicId,
        subject,
        topicName,
        question,
        conversationHistory: history,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      toast.error('Tutor unavailable — check your connection');
      setMessages((prev) => prev.slice(0, -1)); // Remove user msg on error
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Format markdown-like text simply
  const formatText = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-50 flex flex-col
                 bg-den-card border-l border-den-border shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-den-border">
        <div className="w-9 h-9 bg-den-yellow rounded-xl flex items-center justify-center yellow-glow-sm">
          <Bot size={18} className="text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-syne font-bold text-den-text text-sm">AI Tutor</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-den-success" />
            <span className="text-den-muted text-xs truncate">
              {topicName} · {subject}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-den-muted hover:text-den-text hover:bg-white/5 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-den-yellow/20 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Bot size={13} className="text-den-yellow" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-den-yellow text-black font-medium rounded-tr-sm'
                    : 'bg-black/40 border border-den-border text-den-text rounded-tl-sm'
                  }`}
              >
                {msg.role === 'assistant' ? (
                  <>
                    <div
                      className="prose-sm"
                      dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                    />
                    {/* Simplify button */}
                    <button
                      onClick={() => sendMessage('Can you explain that more simply? Use an analogy.')}
                      className="mt-2 flex items-center gap-1 text-xs text-den-muted hover:text-den-yellow transition-colors"
                    >
                      <Sparkles size={11} /> Explain simpler
                    </button>
                  </>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-den-yellow/20 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-den-yellow" />
            </div>
            <div className="bg-black/40 border border-den-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-den-muted typing-dot" />
              <span className="w-2 h-2 rounded-full bg-den-muted typing-dot" />
              <span className="w-2 h-2 rounded-full bg-den-muted typing-dot" />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-den-border">
        {['Give me a worked example', 'What are common mistakes?', 'Quick formula summary'].map((p) => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-den-border text-den-muted text-xs
                       hover:border-den-yellow/40 hover:text-den-text border border-transparent transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-den-border">
        <div className="flex items-end gap-2 bg-black/40 border border-den-border rounded-xl p-1 focus-within:border-den-yellow/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${topicName}...`}
            rows={1}
            className="flex-1 bg-transparent text-den-text placeholder-den-muted text-sm
                       px-3 py-2 resize-none focus:outline-none font-grotesk leading-relaxed"
            style={{ maxHeight: '100px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-lg bg-den-yellow flex items-center justify-center shrink-0 mb-1 mr-1
                       disabled:opacity-40 hover:brightness-110 transition-all active:scale-95"
          >
            <Send size={16} className="text-black" />
          </button>
        </div>
        <p className="text-den-muted text-[10px] text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  );
}
