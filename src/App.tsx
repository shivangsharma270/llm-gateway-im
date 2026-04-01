/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Settings, 
  Trash2, 
  ChevronDown, 
  Zap, 
  Cpu, 
  Sparkles, 
  BarChart3, 
  DollarSign,
  Info,
  Terminal,
  Plus,
  MessageSquare,
  MoreVertical,
  Check,
  Sun,
  Moon,
  Lock,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
  timestamp: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  lastUpdatedAt: number;
}

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  icon: React.ReactNode;
}

const MODELS: ModelConfig[] = [
  { 
    id: 'anthropic/claude-sonnet-4-6', 
    name: 'Claude 3.5 Sonnet', 
    description: 'Best balance of speed and intelligence',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    icon: <Zap className="w-4 h-4 text-orange-500" />
  },
  { 
    id: 'anthropic/claude-opus-4-6', 
    name: 'Claude 3 Opus', 
    description: 'Most powerful model for complex tasks',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    icon: <Cpu className="w-4 h-4 text-purple-500" />
  },
  { 
    id: 'anthropic/claude-haiku-4-5', 
    name: 'Claude 3 Haiku', 
    description: 'Fastest and most affordable model',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    icon: <Zap className="w-4 h-4 text-yellow-500" />
  },
  { 
    id: 'openai/gpt-5.4', 
    name: 'GPT-5.4', 
    description: 'Next-gen reasoning and multimodal capabilities',
    inputCostPer1M: 10.00,
    outputCostPer1M: 30.00,
    icon: <Sparkles className="w-4 h-4 text-emerald-500" />
  },
  { 
    id: 'google/gemini-3.1-pro-preview', 
    name: 'Gemini 3.1 Pro', 
    description: 'Google\'s most capable model for reasoning',
    inputCostPer1M: 3.50,
    outputCostPer1M: 10.50,
    icon: <Bot className="w-4 h-4 text-blue-500" />
  }
];

export default function App() {
  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('llm_chat_sessions');
    if (saved) return JSON.parse(saved);
    const initialSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      lastUpdatedAt: Date.now()
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('llm_active_session_id');
    return saved || (sessions.length > 0 ? sessions[0].id : '');
  });

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  
  const [totalCost, setTotalCost] = useState(() => {
    const saved = localStorage.getItem('llm_total_cost');
    return saved ? parseFloat(saved) : 0;
  });
  const [totalTokens, setTotalTokens] = useState(() => {
    const saved = localStorage.getItem('llm_total_tokens');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [userApiKey, setUserApiKey] = useState(() => {
    return localStorage.getItem('llm_user_api_key') || '';
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('llm_dark_mode');
    return saved === 'true';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('llm_is_logged_in') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('llm_chat_sessions', JSON.stringify(sessions));
    localStorage.setItem('llm_active_session_id', activeSessionId);
    localStorage.setItem('llm_total_cost', totalCost.toString());
    localStorage.setItem('llm_total_tokens', totalTokens.toString());
    localStorage.setItem('llm_user_api_key', userApiKey);
    localStorage.setItem('llm_dark_mode', darkMode.toString());
    localStorage.setItem('llm_is_logged_in', isLoggedIn.toString());

    // Sync dark mode class to root element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [sessions, activeSessionId, totalCost, totalTokens, userApiKey, darkMode]);

  const calculateCost = (usage: Message['usage'], model: ModelConfig) => {
    if (!usage) return 0;
    const inputCost = (usage.prompt_tokens / 1_000_000) * model.inputCostPer1M;
    const outputCost = (usage.completion_tokens / 1_000_000) * model.outputCostPer1M;
    return inputCost + outputCost;
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      lastUpdatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      clearChat();
      return;
    }
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!userApiKey) {
      const warningMessage: Message = {
        role: 'assistant',
        content: 'Please provide your LLM Gateway API key in the settings (gear icon) to start chatting.',
        id: Date.now().toString(),
        timestamp: Date.now()
      };
      updateSessionMessages([...messages, warningMessage]);
      setShowSettings(true);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    updateSessionMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          temperature: temperature,
          apiKey: userApiKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to fetch response');
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from gateway');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
        id: (Date.now() + 1).toString(),
        timestamp: Date.now(),
        usage: data.usage,
        cost: calculateCost(data.usage, selectedModel)
      };

      const finalMessages = [...newMessages, assistantMessage];
      updateSessionMessages(finalMessages);
      
      if (data.usage) {
        setTotalTokens(prev => prev + data.usage.total_tokens);
        setTotalCost(prev => prev + calculateCost(data.usage, selectedModel));
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the gateway connection.`,
        id: (Date.now() + 1).toString(),
        timestamp: Date.now()
      };
      updateSessionMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionMessages = (newMessages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        // Update title if it's the first user message
        let newTitle = s.title;
        if (s.messages.length === 0 && newMessages.length > 0) {
          newTitle = newMessages[0].content.slice(0, 30) + (newMessages[0].content.length > 30 ? '...' : '');
        }
        return { ...s, messages: newMessages, title: newTitle, lastUpdatedAt: Date.now() };
      }
      return s;
    }));
  };

  const clearChat = () => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [], title: 'New Chat', lastUpdatedAt: Date.now() };
      }
      return s;
    }));
    setTotalCost(0);
    setTotalTokens(0);
  };

  const deleteAllHistory = () => {
    const initialSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      lastUpdatedAt: Date.now()
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
    setTotalCost(0);
    setTotalTokens(0);
    localStorage.removeItem('llm_chat_sessions');
    localStorage.removeItem('llm_active_session_id');
    localStorage.removeItem('llm_total_cost');
    localStorage.removeItem('llm_total_tokens');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsLoggedIn(true);
        setLoginError('');
      } else {
        setLoginError(data.error || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login Error:', error);
      setLoginError('Failed to connect to login service');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('llm_is_logged_in');
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Terminal className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>LLM Gateway</h1>
            <p className="text-gray-500 text-sm mt-1">Please sign in to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className={`text-xs font-bold uppercase tracking-widest block mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="user@indiamart.com"
                  required
                  className={`w-full border rounded-xl p-3 text-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all pr-10 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-widest block mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full border rounded-xl p-3 text-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all pr-10 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center"
              >
                {loginError}
              </motion.div>
            )}

            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800/10 flex justify-center">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Sidebar */}
      <aside className={`w-72 border-r flex flex-col hidden md:flex transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`p-4 border-b transition-colors duration-300 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-lg font-bold tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>LLM Gateway</h1>
          </div>
          
          <button 
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Chat History List */}
          <div>
            <label className={`text-[10px] uppercase tracking-widest font-bold mb-2 block px-2 transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Recent Chats
            </label>
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group relative ${
                    activeSessionId === session.id 
                      ? darkMode ? 'bg-gray-800 border-gray-700 shadow-sm' : 'bg-white border border-gray-200 shadow-sm' 
                      : darkMode ? 'hover:bg-gray-800/50 border border-transparent' : 'hover:bg-gray-200/50 border border-transparent'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 ${activeSessionId === session.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-xs truncate flex-1 ${activeSessionId === session.id ? darkMode ? 'font-semibold text-white' : 'font-semibold text-gray-900' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {session.title}
                  </span>
                  <button 
                    onClick={(e) => deleteSession(session.id, e)}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                  >
                    <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </button>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className={`text-[10px] uppercase tracking-widest font-bold mb-2 block px-2 transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Select Model
            </label>
            <div className="space-y-1">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all text-left group ${
                    selectedModel.id === model.id 
                      ? darkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-100' 
                      : 'hover:bg-gray-200/50 border border-transparent'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg ${selectedModel.id === model.id ? darkMode ? 'bg-blue-800' : 'bg-blue-100' : darkMode ? 'bg-gray-800' : 'bg-gray-200/50'}`}>
                    {model.icon}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-semibold truncate ${selectedModel.id === model.id ? darkMode ? 'text-blue-400' : 'text-blue-700' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{model.name}</div>
                    <div className={`text-[10px] truncate group-hover:text-gray-600 transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {model.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div className={`rounded-2xl p-4 border shadow-sm transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-[10px] uppercase tracking-widest font-bold transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Analytics
              </label>
              <BarChart3 className="w-4 h-4 text-gray-300" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-gray-500 font-medium">Total Tokens</span>
                <span className={`text-sm font-mono font-bold transition-colors duration-300 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {totalTokens.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-gray-500 font-medium">Est. Cost</span>
                <span className={`text-sm font-mono font-bold transition-colors duration-300 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  ${totalCost.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-4 border-t transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              SS
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-bold truncate transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Made By Shivang Sharma</div>
              <div className="text-[10px] text-gray-500 truncate">Email: shivang.sharma@indiamart.com</div>
            </div>
            <button 
              onClick={handleLogout}
              className={`p-2 rounded-lg transition-colors text-gray-400 hover:text-red-500 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-red-50'}`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button 
              onClick={deleteAllHistory}
              className={`p-2 rounded-lg transition-colors text-gray-400 hover:text-red-500 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-red-50'}`}
              title="Clear All History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col relative transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
        {/* Header */}
        <header className={`h-14 border-b flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300 ${darkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedModel.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all shadow-sm border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700' 
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Dark</span>
                </>
              )}
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-8 transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-blue-50 border-blue-100'}`}>
                <Bot className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h2 className={`text-2xl font-bold mb-3 tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome to LLM Gateway</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Start a new conversation or select a model to begin. 
                Your chats are saved automatically.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-8 w-full">
                {['Explain quantum computing', 'Write a React hook', 'Debug my Python code', 'Summarize this text'].map((prompt) => (
                  <button 
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className={`p-3 text-xs text-left border rounded-xl transition-all shadow-sm ${
                      darkMode 
                        ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800' 
                        : 'bg-gray-50 border-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-8 pb-12">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : darkMode ? 'bg-gray-900 border border-gray-800 text-gray-400' : 'bg-white border border-gray-200 text-gray-600'
                    }`}>
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    
                    <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : ''}`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : darkMode 
                            ? 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none' 
                            : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none'
                      }`}>
                        {message.content}
                      </div>
                      
                      {message.usage && (
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400 font-mono font-medium">
                          <span>{message.usage.total_tokens} tokens</span>
                          <span>•</span>
                          <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>${message.cost?.toFixed(5)}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <Bot className={`w-4 h-4 animate-pulse ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className={`p-4 rounded-2xl rounded-tl-none shadow-sm border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} style={{ animationDelay: '0ms' }} />
                      <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} style={{ animationDelay: '150ms' }} />
                      <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 md:p-8 bg-gradient-to-t transition-colors duration-300 ${darkMode ? 'from-gray-950 via-gray-950 to-transparent' : 'from-white via-white to-transparent'}`}>
          <div className="max-w-3xl mx-auto relative">
            <form 
              onSubmit={handleSubmit}
              className={`relative border rounded-2xl focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all shadow-lg ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={`Message ${selectedModel.name}...`}
                className={`w-full bg-transparent p-4 pr-16 focus:outline-none text-sm resize-none min-h-[56px] max-h-48 scrollbar-hide transition-colors duration-300 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                rows={1}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-xl transition-all shadow-sm ${
                    input.trim() && !isLoading
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            <p className="mt-3 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Intermesh LLM Gateway • {selectedModel.name}
            </p>
          </div>
        </div>

        {/* Settings Overlay */}
        <AnimatePresence>
          {showSettings && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-20"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md border rounded-3xl p-8 z-30 shadow-2xl transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-xl font-bold tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Configuration</h3>
                  <button onClick={() => setShowSettings(false)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Gateway API Key</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={userApiKey}
                        onChange={(e) => setUserApiKey(e.target.value)}
                        placeholder="sk-..."
                        className={`w-full border rounded-xl p-3 text-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 focus:outline-none transition-all pr-10 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Terminal className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-gray-500 italic">
                      Your key is saved locally in your browser.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Temperature</label>
                      <span className={`text-xs font-mono font-bold transition-colors duration-300 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{temperature}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-600 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold">
                      <span>PRECISE</span>
                      <span>CREATIVE</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-colors duration-300 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pricing Info</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Input (1M tokens)</span>
                        <span className={`font-medium transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>${selectedModel.inputCostPer1M.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Output (1M tokens)</span>
                        <span className={`font-medium transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>${selectedModel.outputCostPer1M.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full mt-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98]"
                >
                  Save Configuration
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
