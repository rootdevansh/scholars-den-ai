import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, BookOpen, History, ChevronRight, X, MessageSquare } from 'lucide-react';
import { api, useTopics } from '../hooks/useApi';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function AITutor() {
  const { activePlanId, activeTopic, setActiveTopic } = useStore();
  const { data: topics = [] } = useTopics(activePlanId);

  const [activeTab, setActiveTab] = useState('topics'); // 'topics' or 'doubts'
  const [pastDoubts, setPastDoubts] = useState([]);
  const [loadingDoubts, setLoadingDoubts] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your dedicated **Scholar's Den AI Tutor** 🎓.\n\nSelect a topic from the left sidebar to ground our discussion, or ask me any question about your exam syllabus right now!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load doubts when switching to doubts tab
  useEffect(() => {
    if (activeTab === 'doubts' && activePlanId) {
      loadPastDoubts();
    }
  }, [activeTab, activePlanId]);

  const loadPastDoubts = async () => {
    setLoadingDoubts(true);
    try {
      const { data } = await api.get(`/tutor/doubts/${activePlanId}`);
      setPastDoubts(data.doubts || []);
    } catch (err) {
      console.warn('Failed to load past doubts', err);
    } finally {
      setLoadingDoubts(false);
    }
  };

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
      }));

      const { data } = await api.post('/tutor/ask', {
        planId: activePlanId,
        topicId: activeTopic?.id || null,
        subject: activeTopic?.subject || 'General',
        topicName: activeTopic?.name || 'General Curriculum',
        question,
        conversationHistory: history,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      toast.error('Failed to get answer. Check your connection or API key.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Group topics by subject
  const topicsBySubject = topics.reduce((acc, t) => {
    acc[t.subject] = acc[t.subject] || [];
    acc[t.subject].push(t);
    return acc;
  }, {});

  const formatText = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

  return (
    <div className="pt-16 pb-6 h-screen flex flex-col md:flex-row max-w-7xl mx-auto px-4 gap-4">
      {/* Left Sidebar */}
      <div className="w-full md:w-80 shrink-0 bg-den-card border border-den-border rounded-3xl flex flex-col overflow-hidden h-[300px] md:h-full">
        {/* Sidebar Tabs */}
        <div className="flex border-b border-den-border bg-black/20 p-1">
          <button
            onClick={() => setActiveTab('topics')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all
              ${activeTab === 'topics' ? 'bg-den-yellow text-black' : 'text-den-muted hover:text-den-text'}`}
          >
            <BookOpen size={14} /> Topics
          </button>
          <button
            onClick={() => setActiveTab('doubts')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all
              ${activeTab === 'doubts' ? 'bg-den-yellow text-black' : 'text-den-muted hover:text-den-text'}`}
          >
            <History size={14} /> Past Doubts
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {activeTab === 'topics' ? (
            Object.keys(topicsBySubject).length === 0 ? (
              <p className="text-den-muted text-xs text-center py-6">No topics available.</p>
            ) : (
              Object.entries(topicsBySubject).map(([sub, subTopics]) => (
                <div key={sub} className="space-y-1">
                  <span className="text-[11px] font-bold text-den-muted uppercase tracking-wider px-2">
                    {sub}
                  </span>
                  {subTopics.map((t) => {
                    const isSelected = activeTopic?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveTopic(t)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors
                          ${isSelected
                            ? 'bg-den-yellow/15 text-den-yellow border border-den-yellow/30 font-semibold'
                            : 'text-den-text hover:bg-white/5'
                          }`}
                      >
                        <span className="truncate">{t.name}</span>
                        {isSelected && <ChevronRight size={13} className="shrink-0 text-den-yellow" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )
          ) : (
            /* Doubts Tab */
            loadingDoubts ? (
              <div className="space-y-2 py-2">
                <div className="skeleton h-12 w-full" />
                <div className="skeleton h-12 w-full" />
              </div>
            ) : pastDoubts.length === 0 ? (
              <p className="text-den-muted text-xs text-center py-6">No doubts logged yet.</p>
            ) : (
              <div className="space-y-2">
                {pastDoubts.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setMessages((prev) => [
                        ...prev,
                        { role: 'user', content: d.question },
                        { role: 'assistant', content: d.answer },
                      ]);
                    }}
                    className="p-2.5 bg-black/40 border border-den-border rounded-xl text-xs hover:border-den-yellow/30 cursor-pointer transition-colors"
                  >
                    <p className="font-semibold text-den-text truncate mb-0.5">{d.question}</p>
                    <p className="text-[10px] text-den-muted">{d.subject || 'General'}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Clear Topic Context Button */}
        {activeTopic && (
          <div className="p-3 border-t border-den-border">
            <button
              onClick={() => setActiveTopic(null)}
              className="w-full py-1.5 rounded-xl border border-den-border text-den-muted text-xs hover:text-den-text flex items-center justify-center gap-1.5 transition-colors"
            >
              <X size={12} /> Clear Active Topic
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-den-card border border-den-border rounded-3xl flex flex-col overflow-hidden h-[500px] md:h-full">
        {/* Context Bar */}
        <div className="p-4 border-b border-den-border bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-den-yellow flex items-center justify-center yellow-glow-sm">
              <Bot size={20} className="text-black" />
            </div>
            <div>
              <h2 className="font-syne font-bold text-den-text text-base">Scholar's AI Tutor</h2>
              <p className="text-xs text-den-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-den-success" />
                {activeTopic ? (
                  <span>Grounding: <strong className="text-den-yellow">{activeTopic.name}</strong> ({activeTopic.subject})</span>
                ) : (
                  <span>General Syllabus Mode</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-den-yellow/20 flex items-center justify-center mr-2.5 mt-1 shrink-0">
                  <Bot size={15} className="text-den-yellow" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-den-yellow text-black font-medium rounded-tr-sm'
                    : 'bg-black/40 border border-den-border text-den-text rounded-tl-sm'
                  }`}
              >
                {msg.role === 'assistant' ? (
                  <div>
                    <div
                      className="prose-sm"
                      dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                    />
                    <button
                      onClick={() => sendMessage('Can you explain that more simply with a real-life analogy?')}
                      className="mt-3 flex items-center gap-1.5 text-xs text-den-muted hover:text-den-yellow transition-colors"
                    >
                      <Sparkles size={12} /> Explain like I'm new to this
                    </button>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-den-yellow/20 flex items-center justify-center shrink-0">
                <Bot size={15} className="text-den-yellow" />
              </div>
              <div className="bg-black/40 border border-den-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-den-muted typing-dot" />
                <span className="w-2 h-2 rounded-full bg-den-muted typing-dot" />
                <span className="w-2 h-2 rounded-full bg-den-muted typing-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-den-border flex gap-2 overflow-x-auto scrollbar-none">
          {['Give me a step-by-step worked example', 'What are top pitfalls students face?', 'Summarize high-frequency exam questions'].map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              className="shrink-0 px-3 py-1.5 bg-black/40 border border-den-border rounded-full text-xs text-den-muted hover:text-den-text hover:border-den-yellow/40 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-den-border bg-black/30">
          <div className="flex items-end gap-2 bg-black/60 border border-den-border rounded-2xl p-1.5 focus-within:border-den-yellow/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeTopic ? `Ask about ${activeTopic.name}...` : 'Ask your exam doubt...'}
              rows={1}
              className="flex-1 bg-transparent text-den-text placeholder-den-muted text-sm px-3 py-2 resize-none focus:outline-none font-grotesk max-h-28"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-den-yellow flex items-center justify-center shrink-0 mb-1 mr-1 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all"
            >
              <Send size={16} className="text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
