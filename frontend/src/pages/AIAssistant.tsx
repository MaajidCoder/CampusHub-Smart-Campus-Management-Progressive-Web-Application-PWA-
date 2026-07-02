import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  User,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Suggested Prompts
  const suggestedPrompts = [
    { label: 'QR Attendance geofence rules', query: 'How does the geofenced QR code attendance work?' },
    { label: 'List items in Marketplace', query: 'How do I sell my old textbooks or calculators in the Marketplace?' },
    { label: 'Avoid attendance warnings', query: 'What is the attendance threshold to avoid warnings?' },
    { label: 'Find study materials', query: 'How do I upload or download study materials notes?' },
  ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load welcome prompt on start
  useEffect(() => {
    const welcomeText = `Hello ${user?.name || 'Student'}! 👋 I am the **CampusHub AI Advisor**.

I can guide you through:
- **QR Attendance check-ins:** scanning, geofences (30m), manual overrides.
- **Student Marketplace:** how to sell items and moderate listings.
- **Academic Study Materials:** note sharing uploads.
- **Placement Dashboard:** applications status pipelines.

*How can I help you today?*`;

    setMessages([{ role: 'model', text: welcomeText }]);
  }, [user]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMessage: ChatMessage = { role: 'user', text: textToSend };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const apiHistory = updatedMessages.slice(0, -1).map((msg) => ({
        role: msg.role,
        text: msg.text,
      }));

      const res = await api.post('/ai/chat', {
        message: textToSend,
        history: apiHistory,
      });

      const reply: ChatMessage = {
        role: 'model',
        text: res.data.data.reply,
      };

      setMessages((prev) => [...prev, reply]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'AI engine failed to respond. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (!window.confirm('Clear conversation history?')) return;
    const welcomeText = `Welcome back **${user?.name || 'Student'}**! How can I help you next?`;
    setMessages([{ role: 'model', text: welcomeText }]);
    setError(null);
  };

  // Custom inline Markdown parser
  const renderFormattedText = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    let html = text.replace(boldRegex, '<strong>$1</strong>');

    const codeRegex = /`(.*?)`/g;
    html = html.replace(
      codeRegex,
      '<code class="px-1.5 py-0.5 bg-brand-500/10 text-brand-500 dark:text-brand-400 font-mono text-sm rounded">$1</code>'
    );

    const lines = html.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemContent = trimmed.substring(2);
        return (
          <li
            key={idx}
            className="ml-5 list-disc text-sm text-light-text dark:text-dark-text leading-relaxed my-1.5"
            dangerouslySetInnerHTML={{ __html: itemContent }}
          />
        );
      }

      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p
          key={idx}
          className="text-sm text-light-text dark:text-dark-text leading-relaxed mb-1.5"
          dangerouslySetInnerHTML={{ __html: line }}
        />
      );
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col justify-between glass-panel-light dark:glass-panel-dark rounded-3xl border border-light-border dark:border-dark-border/30 overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="px-6 py-5 bg-white/50 dark:bg-dark-card/50 border-b border-light-border dark:border-dark-border/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-light-text dark:text-dark-text leading-none flex items-center gap-2">
              <span>Campus AI Assistant</span>
              <span className="text-[10px] bg-brand-500/15 text-brand-500 font-extrabold uppercase px-2 py-0.5 rounded">
                Gemini 3.5
              </span>
            </h3>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-1.5">
              Context-aware college regulations tutor
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="p-2.5 hover:bg-red-500/10 text-light-muted dark:text-dark-muted hover:text-red-500 rounded-xl transition-all"
          title="Clear Conversation"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Message Vault Workspace */}
      <div className="flex-grow overflow-y-auto p-6 space-y-5">
        {/* Suggested Prompts */}
        {messages.length === 1 && (
          <div className="max-w-lg mx-auto mb-6 text-center space-y-4 pt-4">
            <Sparkles className="w-12 h-12 text-brand-500/40 mx-auto" />
            <h4 className="text-sm font-bold text-light-text dark:text-dark-text">Suggested questions you can ask:</h4>
            <div className="grid grid-cols-1 gap-3">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p.query)}
                  className="w-full text-left p-4 bg-white dark:bg-dark-card hover:bg-brand-500/5 dark:hover:bg-brand-500/5 hover:border-brand-500/30 border border-light-border dark:border-dark-border/20 rounded-2xl transition-all flex items-center justify-between group shadow-sm"
                >
                  <span className="text-sm font-semibold text-light-text dark:text-dark-text">{p.label}</span>
                  <ArrowRight className="w-4 h-4 text-light-muted dark:text-dark-muted group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread bubbles */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                msg.role === 'user' ? 'bg-brand-500' : 'bg-slate-200 dark:bg-dark-bg text-brand-500 border border-light-border dark:border-dark-border/30'
              }`}
            >
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Bubble content */}
            <div
              className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-brand-500 text-white rounded-tr-none'
                  : 'bg-white dark:bg-dark-card text-light-text dark:text-dark-text rounded-tl-none border border-light-border dark:border-dark-border/20'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-line text-sm font-semibold leading-relaxed">{msg.text}</p>
              ) : (
                <div className="space-y-1">{renderFormattedText(msg.text)}</div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Dots indicator */}
        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-dark-bg flex items-center justify-center text-brand-500 flex-shrink-0 border border-light-border dark:border-dark-border/30">
              <Bot className="w-5 h-5" />
            </div>

            <div className="p-4 bg-white dark:bg-dark-card rounded-3xl rounded-tl-none border border-light-border dark:border-dark-border/20 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-sm max-w-sm mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <div className="p-4 bg-white/50 dark:bg-dark-card/50 border-t border-light-border dark:border-dark-border/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-3 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 focus-within:border-brand-500 rounded-2xl p-2 transition-colors"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={`Ask anything about CampusHub, ${user?.name || 'student'}...`}
            className="flex-grow pl-3 bg-transparent outline-none text-sm text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-brand-500/10 disabled:opacity-50 transition-all flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
export default AIAssistant;
