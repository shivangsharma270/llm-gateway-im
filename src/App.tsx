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
  Globe,
  Activity,
  Shield,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Types
interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64
  previewUrl?: string;
}

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
  attachments?: Attachment[];
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
  capabilities: {
    images: boolean;
    streaming: boolean;
    maxContext: string;
  };
}

const MODELS: ModelConfig[] = [
  { 
    id: 'anthropic/claude-sonnet-4.5', 
    name: 'Claude 4.5 Sonnet', 
    description: 'Next-gen intelligence and speed',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    icon: <Zap className="w-4 h-4 text-orange-500" />,
    capabilities: { images: true, streaming: true, maxContext: '200k' }
  },
  { 
    id: 'anthropic/claude-sonnet-4', 
    name: 'Claude 4 Sonnet', 
    description: 'High-performance reasoning',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    icon: <Zap className="w-4 h-4 text-orange-400" />,
    capabilities: { images: true, streaming: true, maxContext: '200k' }
  },
  { 
    id: 'openai/gpt-5', 
    name: 'GPT-5', 
    description: 'Ultimate reasoning and intelligence',
    inputCostPer1M: 15.00,
    outputCostPer1M: 45.00,
    icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
    capabilities: { images: true, streaming: true, maxContext: '128k' }
  },
  { 
    id: 'openai/gpt-5-mini', 
    name: 'GPT-5 Mini', 
    description: 'Efficient next-gen intelligence',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    icon: <Zap className="w-4 h-4 text-emerald-500" />,
    capabilities: { images: true, streaming: true, maxContext: '128k' }
  },
  { 
    id: 'openai/gpt-5-nano', 
    name: 'GPT-5 Nano', 
    description: 'Ultra-fast edge intelligence',
    inputCostPer1M: 0.05,
    outputCostPer1M: 0.20,
    icon: <Zap className="w-4 h-4 text-emerald-400" />,
    capabilities: { images: false, streaming: true, maxContext: '32k' }
  },
  { 
    id: 'openai/gpt-5-chat', 
    name: 'GPT-5 Chat', 
    description: 'Optimized for conversational flow',
    inputCostPer1M: 5.00,
    outputCostPer1M: 15.00,
    icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
    capabilities: { images: true, streaming: true, maxContext: '128k' }
  },
  { 
    id: 'openai/o4-mini', 
    name: 'o4 Mini', 
    description: 'Advanced reasoning in a small package',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    icon: <Cpu className="w-4 h-4 text-purple-600" />,
    capabilities: { images: true, streaming: true, maxContext: '128k' }
  },
  { 
    id: 'openai/o3', 
    name: 'o3', 
    description: 'Specialized reasoning model',
    inputCostPer1M: 10.00,
    outputCostPer1M: 30.00,
    icon: <Cpu className="w-4 h-4 text-purple-500" />,
    capabilities: { images: true, streaming: true, maxContext: '128k' }
  },
  { 
    id: 'openai/gpt-4.1', 
    name: 'GPT-4.1', 
    description: 'Refined GPT-4 intelligence',
    inputCostPer1M: 5.00,
    outputCostPer1M: 15.00,
    icon: <Sparkles className="w-4 h-4 text-blue-600" />,
    capabilities: { images: true, streaming: true, maxContext: '128k' }
  },
  { 
    id: 'openai/gpt-4.1-mini', 
    name: 'GPT-4.1 Mini', 
    description: 'Fast and capable GPT-4 variant',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    icon: <Zap className="w-4 h-4 text-blue-500" />,
    capabilities: { images: true, streaming: true, maxContext: '128k' }
  },
  { 
    id: 'openai/gpt-4.1-nano', 
    name: 'GPT-4.1 Nano', 
    description: 'Lightweight GPT-4 intelligence',
    inputCostPer1M: 0.05,
    outputCostPer1M: 0.20,
    icon: <Zap className="w-4 h-4 text-blue-400" />,
    capabilities: { images: false, streaming: true, maxContext: '32k' }
  },
  { 
    id: 'google/gemini-2.5-pro', 
    name: 'Gemini 2.5 Pro', 
    description: 'Google\'s state-of-the-art reasoning',
    inputCostPer1M: 3.50,
    outputCostPer1M: 10.50,
    icon: <Bot className="w-4 h-4 text-blue-600" />,
    capabilities: { images: true, streaming: true, maxContext: '2M' }
  },
  { 
    id: 'google/gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    description: 'Fast and versatile multimodal model',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.30,
    icon: <Zap className="w-4 h-4 text-blue-500" />,
    capabilities: { images: true, streaming: true, maxContext: '1M' }
  },
  { 
    id: 'google/gemini-2.5-flash-lite', 
    name: 'Gemini 2.5 Flash Lite', 
    description: 'Ultra-efficient multimodal model',
    inputCostPer1M: 0.07,
    outputCostPer1M: 0.21,
    icon: <Zap className="w-4 h-4 text-blue-400" />,
    capabilities: { images: true, streaming: true, maxContext: '1M' }
  },
  { 
    id: 'google/gemini-2.0-flash', 
    name: 'Gemini 2.0 Flash', 
    description: 'High-speed multimodal intelligence',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.30,
    icon: <Zap className="w-4 h-4 text-cyan-500" />,
    capabilities: { images: true, streaming: true, maxContext: '1M' }
  },
  { 
    id: 'google/gemini-2.0-flash-lite', 
    name: 'Gemini 2.0 Flash Lite', 
    description: 'Efficient multimodal intelligence',
    inputCostPer1M: 0.07,
    outputCostPer1M: 0.21,
    icon: <Zap className="w-4 h-4 text-cyan-400" />,
    capabilities: { images: true, streaming: true, maxContext: '1M' }
  },
  { 
    id: 'x-ai/grok-4', 
    name: 'Grok-4', 
    description: 'Real-time knowledge and reasoning',
    inputCostPer1M: 5.00,
    outputCostPer1M: 15.00,
    icon: <Globe className="w-4 h-4 text-gray-400" />,
    capabilities: { images: true, streaming: true, maxContext: '128k' }
  },
  { 
    id: 'openai/gpt-oss-120b', 
    name: 'GPT-OSS 120B', 
    description: 'Open-source massive scale model',
    inputCostPer1M: 2.00,
    outputCostPer1M: 6.00,
    icon: <Activity className="w-4 h-4 text-indigo-500" />,
    capabilities: { images: false, streaming: true, maxContext: '32k' }
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
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem('llm_temperature');
    const val = saved ? parseFloat(saved) : 0.7;
    return val > 1 ? 1 : val;
  });
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
  
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    localStorage.setItem('llm_temperature', temperature.toString());

    // Sync dark mode class to root element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [sessions, activeSessionId, totalCost, totalTokens, userApiKey, darkMode, temperature]);

  const calculateCost = (usage: Message['usage'], model: ModelConfig) => {
    if (!usage) return 0;
    const inputCost = ((usage.prompt_tokens || 0) / 1_000_000) * model.inputCostPer1M;
    const outputCost = ((usage.completion_tokens || 0) / 1_000_000) * model.outputCostPer1M;
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
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

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
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    const newMessages = [...messages, userMessage];
    updateSessionMessages(newMessages);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: newMessages.map(m => {
            // If there are no attachments, use simple string content
            if (!m.attachments || m.attachments.length === 0) {
              return { role: m.role, content: m.content };
            }

            // If there are attachments, use the multimodal array format
            const contentParts: any[] = [];
            
            // Add the text content
            contentParts.push({ type: 'text', text: m.content });

            // Add image attachments
            m.attachments.forEach(a => {
              if (a.type.startsWith('image/')) {
                contentParts.push({
                  type: 'image_url',
                  image_url: {
                    url: `data:${a.type};base64,${a.data}`
                  }
                });
              }
            });

            return { role: m.role, content: contentParts };
          }),
          temperature: temperature,
          apiKey: userApiKey,
          stream: selectedModel.capabilities.streaming
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to fetch response');
      }

      if (selectedModel.capabilities.streaming) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const assistantMessageId = (Date.now() + 1).toString();
        let assistantContent = '';
        let finalUsage: any = null;
        
        const initialAssistantMessage: Message = {
          role: 'assistant',
          content: '',
          id: assistantMessageId,
          timestamp: Date.now()
        };
        
        updateSessionMessages([...newMessages, initialAssistantMessage]);

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') break;
              
              try {
                const data = JSON.parse(dataStr);
                
                // Capture usage if available (usually in the last chunk with stream_options)
                if (data.usage) {
                  finalUsage = data.usage;
                }

                const content = data.choices?.[0]?.delta?.content || '';
                if (content) {
                  assistantContent += content;
                  
                  // Update the message in state
                  setSessions(prev => prev.map(s => {
                    if (s.id === activeSessionId) {
                      const updatedMessages = s.messages.map(m => 
                        m.id === assistantMessageId ? { ...m, content: assistantContent } : m
                      );
                      return { ...s, messages: updatedMessages };
                    }
                    return s;
                  }));
                }
              } catch (e) {
                // Not JSON or partial JSON, ignore
              }
            }
          }
        }

        // Final update with usage and cost for streaming
        if (finalUsage) {
          const cost = calculateCost(finalUsage, selectedModel);
          setTotalTokens(prev => prev + finalUsage.total_tokens);
          setTotalCost(prev => prev + cost);
          
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const updatedMessages = s.messages.map(m => 
                m.id === assistantMessageId ? { 
                  ...m, 
                  usage: finalUsage,
                  cost: cost
                } : m
              );
              return { ...s, messages: updatedMessages };
            }
            return s;
          }));
        }
      } else {
        const data = await response.json();
        const cost = calculateCost(data.usage, selectedModel);
        
        if (data.usage) {
          setTotalTokens(prev => prev + data.usage.total_tokens);
          setTotalCost(prev => prev + cost);
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.choices[0].message.content,
          id: (Date.now() + 1).toString(),
          timestamp: Date.now(),
          usage: data.usage,
          cost: cost
        };
        updateSessionMessages([...newMessages, assistantMessage]);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Only handle images
      if (!file.type.startsWith('image/')) continue;
      
      // Read as base64 for images
      const base64Reader = new FileReader();
      base64Reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (!base64) return;
        
        const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
        
        const newAttachment: Attachment = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data,
          previewUrl: base64
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      base64Reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
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

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Sidebar */}
      <aside className={`w-72 border-r flex flex-col hidden md:flex transition-colors duration-300 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`p-4 border-b transition-colors duration-300 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-lg font-bold tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>LLM Gateway App</h1>
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

          {/* Model Selection Dropdown */}
          <div className="px-2">
            <label className={`text-[10px] uppercase tracking-widest font-bold mb-2 block transition-colors duration-300 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Select Model
            </label>
            <div className="relative">
              <select
                value={selectedModel.id}
                onChange={(e) => {
                  const model = MODELS.find(m => m.id === e.target.value);
                  if (model) setSelectedModel(model);
                }}
                className={`w-full appearance-none p-3 pr-10 rounded-xl text-xs font-medium transition-all border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                {MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            
            {/* Selected Model Info */}
            <div className={`mt-3 p-3 rounded-xl border transition-colors duration-300 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50/50 border-blue-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                  {selectedModel.icon}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Capabilities
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed italic">
                {selectedModel.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedModel.capabilities.images && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                    Vision
                  </span>
                )}
                {selectedModel.capabilities.streaming && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${darkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                    Streaming
                  </span>
                )}
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${darkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                  {selectedModel.capabilities.maxContext} Context
                </span>
              </div>
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
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                AI
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold truncate transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>LLM Gateway</div>
                <div className="text-[10px] text-gray-500 truncate">v1.0.0</div>
              </div>
            </div>
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
              <h2 className={`text-2xl font-bold mb-3 tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome to LLM Gateway App</h2>
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
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {message.attachments.map(a => (
                            <div key={a.id} className={`p-2 rounded-xl border flex items-center gap-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                              {a.previewUrl && (
                                <img src={a.previewUrl} alt={a.name} className="w-12 h-12 rounded object-cover" />
                              )}
                              <div className="flex flex-col">
                                <span className="text-xs font-medium truncate max-w-[100px]">{a.name}</span>
                                <span className="text-[10px] text-gray-500">{(a.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : darkMode 
                            ? 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none' 
                            : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-none'
                      }`}>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      
                      {message.usage && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400 font-mono font-medium">
                          <div className="flex items-center gap-1">
                            <span className="opacity-60 uppercase tracking-tighter">In:</span>
                            <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>{message.usage.prompt_tokens}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="opacity-60 uppercase tracking-tighter">Out:</span>
                            <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>{message.usage.completion_tokens}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="opacity-60 uppercase tracking-tighter">Total:</span>
                            <span>{message.usage.total_tokens}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <span className="opacity-60 uppercase tracking-tighter">Cost:</span>
                            <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>${message.cost?.toFixed(6)}</span>
                          </div>
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
          <div className="max-w-3xl mx-auto">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-1">
                {attachments.map(a => (
                  <div key={a.id} className={`relative p-2 rounded-xl border flex items-center gap-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    {a.previewUrl ? (
                      <img src={a.previewUrl} alt={a.name} className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-500" />
                    )}
                    <span className="text-xs font-medium truncate max-w-[100px]">{a.name}</span>
                    <button 
                      onClick={() => removeAttachment(a.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form 
              onSubmit={handleSubmit}
              className={`relative border rounded-2xl focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all shadow-lg ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
            >
              <div className="absolute left-3 top-4 flex items-center gap-1">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  multiple 
                  accept="image/*"
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || !selectedModel.capabilities.images}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                  title={!selectedModel.capabilities.images ? "Images not supported by this model" : "Add images"}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={isLoading ? "Thinking..." : `Message ${selectedModel.name}...`}
                className={`w-full bg-transparent p-4 pl-12 pr-16 focus:outline-none text-sm resize-none min-h-[56px] max-h-48 scrollbar-hide transition-colors duration-300 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                rows={1}
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={(!input.trim() && attachments.length === 0) || isLoading}
                  className={`p-2 rounded-xl transition-all shadow-sm ${
                    (input.trim() || attachments.length > 0) && !isLoading
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
            
            <div className="flex items-center justify-between mt-3 px-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedModel.capabilities.streaming ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {selectedModel.capabilities.streaming ? 'Streaming' : 'Static'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedModel.capabilities.images ? 'bg-blue-500' : 'bg-gray-400'}`} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {selectedModel.capabilities.images ? 'Vision' : 'Text-only'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Context: {selectedModel.capabilities.maxContext}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                LLM Gateway App • {selectedModel.name}
              </p>
            </div>
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
                      max="1" 
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
