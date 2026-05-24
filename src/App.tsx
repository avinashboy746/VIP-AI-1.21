/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Sparkles, Trash2, Command, ShieldCheck, Crown, Smartphone, MessageSquare, LogOut, Github, Mail, Lock, Key, ChevronRight, UserPlus, LogIn, Globe, Cpu, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/src/lib/utils";
export interface Message {
  role: "user" | "model";
  content: string;
}
const SUGGESTIONS = [
  "Build a premium React website for my luxury brand.",
  "Create a Python Discord bot with high-security features.",
  "Architect a scalable Mobile App for an e-commerce empire.",
  "Write me a professional landing page code in Tailwind CSS."
];

const FEATURES = [
  { id: 'web', name: 'Web Dev Oracle', icon: <Command className="w-4 h-4" />, desc: 'Custom Full-Stack Sites' },
  { id: 'app', name: 'Mobile Architect', icon: <Smartphone className="w-4 h-4" />, desc: 'iOS & Android Native' },
  { id: 'bot', name: 'Bot Master', icon: <MessageSquare className="w-4 h-4" />, desc: 'Discord & Telegram Automation' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'profile'>('chat');
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'black'>(() => {
    return (localStorage.getItem("vip_theme") as 'light' | 'black') || 'black';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'black' ? 'light' : 'black';
    setTheme(nextTheme);
    localStorage.setItem("vip_theme", nextTheme);
  };

  // Profile Update State
  const [editUsername, setEditUsername] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editIsVerified, setEditIsVerified] = useState(true);

  const [isReady, setIsReady] = useState(false);
  
  // Direct Login/Register State
  const [isRegistering, setIsRegistering] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const toggleRegisterMode = () => {
    setIsRegistering(!isRegistering);
    setGuestName("");
    setGuestEmail("");
    setGuestPassword("");
    setAuthError(null);
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleBypassLogin = () => {
    const bypassUser = {
      id: "guest_" + Math.random().toString(36).substr(2, 9),
      username: "VIP Guest",
      avatar_url: `https://ui-avatars.com/api/?name=VIP+Guest&background=2563eb&color=fff`,
      email: "guest@vipchat.ai",
      bio: "Direct Bypass Authenticated Operator",
      authType: 'guest',
      isVerified: true
    };
    setCurrentUser(bypassUser);
    localStorage.setItem("vip_session", JSON.stringify(bypassUser));
  };

  useEffect(() => {
    if (currentUser) {
      setEditUsername(currentUser.username || "");
      setEditAvatar(currentUser.avatar_url || "");
      setEditBio(currentUser.bio || "");
      setEditIsVerified(currentUser.isVerified !== false);
    }
  }, [currentUser]);

  useEffect(() => {
    // Check local direct session first
    const savedSession = localStorage.getItem("vip_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setCurrentUser(parsed);
        setIsReady(true);
        return;
      } catch (err) {
        console.error("Failed to parse vip_session", err);
      }
    }

    // Check Discord Auth
    fetchUser();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUser();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (data && !data.error) {
        data.authType = 'discord';
        data.bio = data.bio || "Elite Terminal Operator";
        data.isVerified = true;
        data.avatar_url = data.avatar_url || (data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : `https://ui-avatars.com/api/?name=${data.username}&background=random`);
        setCurrentUser(data);
      }
    } catch (e) {
      console.error("Fetch user failed", e);
    } finally {
      setIsReady(true);
    }
  };

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    // Load existing registered users
    let registeredUsers: any[] = [];
    const savedUsers = localStorage.getItem("vip_users");
    if (savedUsers) {
      try {
        registeredUsers = JSON.parse(savedUsers);
      } catch (err) {
        console.error("Failed to parse vip_users", err);
      }
    }

    if (isRegistering) {
      if (!guestName || !guestEmail || !guestPassword) return;

      // Check if email is already taken
      const emailTaken = registeredUsers.some(
        (u: any) => u.email.toLowerCase() === guestEmail.toLowerCase()
      );

      if (emailTaken) {
        setAuthError("This email is already registered. Please login instead.");
        return;
      }

      // Create new user profile
      const newUser = {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        username: guestName,
        avatar_url: `https://ui-avatars.com/api/?name=${guestName}&background=random`,
        email: guestEmail,
        password: guestPassword,
        bio: "Registered VIP Member",
        authType: 'direct'
      };

      // Add to registry and save
      registeredUsers.push(newUser);
      localStorage.setItem("vip_users", JSON.stringify(registeredUsers));

      // Set active session
      setCurrentUser(newUser);
      localStorage.setItem("vip_session", JSON.stringify(newUser));
    } else {
      if (!guestEmail || !guestPassword) return;

      // Look for the user matching this email
      const matchedUser = registeredUsers.find(
        (u: any) => u.email.toLowerCase() === guestEmail.toLowerCase()
      );

      if (matchedUser) {
        // Confirm password
        if (matchedUser.password === guestPassword) {
          setCurrentUser(matchedUser);
          localStorage.setItem("vip_session", JSON.stringify(matchedUser));
        } else {
          setAuthError("Incorrect password. Please verify your credentials.");
        }
      } else {
        // Create user automatically for painless initial login
        const autoName = guestEmail.split('@')[0];
        const newUser = {
          id: "user_login_" + Math.random().toString(36).substr(2, 9),
          username: autoName,
          avatar_url: `https://ui-avatars.com/api/?name=${autoName}&background=random`,
          email: guestEmail,
          password: guestPassword,
          bio: "Authenticated VIP Operative",
          authType: 'direct'
        };

        registeredUsers.push(newUser);
        localStorage.setItem("vip_users", JSON.stringify(registeredUsers));

        setCurrentUser(newUser);
        localStorage.setItem("vip_session", JSON.stringify(newUser));
      }
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser((prev: any) => ({
      ...prev,
      username: editUsername,
      avatar_url: editAvatar,
      bio: editBio,
      isVerified: editIsVerified
    }));
    setActiveTab('chat');
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/auth/url");
      const data = await res.json();
      
      if (data.error) {
        alert("Sir, your DISCORD_CLIENT_ID is missing. Please add it to the environment variables.");
        return;
      }
      
      window.open(data.url, 'discord_auth', 'width=600,height=800');
    } catch (e) {
      console.error("Login failed", e);
      alert("System failure during authorization.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setCurrentUser(null);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Server returned an error status");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read from the response stream");
      }

      let assistantContent = "";
      setMessages(prev => [...prev, { role: "model", content: "" }]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === "model") {
            return [...prev.slice(0, -1), { role: "model", content: assistantContent }];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "model", content: "Apologies, sir. There was an elite error in my circuits. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isReady) return null;

  if (!currentUser) {
    const isThemeDark = theme === 'black';
    return (
      <div className={cn(
        "h-screen flex items-center justify-center relative overflow-hidden font-sans p-4 transition-colors duration-300",
        isThemeDark ? "bg-zinc-950 text-white" : "bg-slate-50 text-zinc-900"
      )}>
        {/* Advanced Background Layers */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300",
          isThemeDark ? "bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.12),transparent)] opacity-100" : "bg-[radial-gradient(circle_at_50%_-20%,#2563eb05,transparent)] opacity-100"
        )} />
        <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[80%] bg-brand-red/5 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[80%] h-[80%] bg-brand-blue/5 blur-[160px] rounded-full animate-pulse [animation-delay:3s]" />
        
        {/* Theme Toggle on Login Screen */}
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={toggleTheme}
            className={cn(
              "py-3 px-4 rounded-2xl border transition-all shadow-lg flex items-center gap-2 font-black uppercase text-[10px] tracking-widest",
              isThemeDark ? "bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {isThemeDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-600" />}
            <span>{isThemeDark ? "Light View" : "Stealth View"}</span>
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative z-10 w-full max-w-[440px] border rounded-[48px] overflow-hidden transition-all duration-300 shadow-[0_40px_100px_rgba(0,0,0,0.15)]",
            isThemeDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
          )}
        >
          {/* Elite Accent Line */}
          <div className="h-2 w-full bg-gradient-to-r from-brand-red via-brand-blue to-brand-red opacity-80" />
          
          <div className="p-10 flex flex-col items-center text-center">
            {/* VIP Icon */}
            <div className="mb-8 relative group">
              <div className="absolute inset-0 bg-brand-blue/10 blur-3xl rounded-full" />
              <img 
                src="/input_file_7.png" 
                alt="VIP Logo" 
                className={cn(
                  "w-28 h-28 relative z-10 rounded-[36px] border shadow-2xl transform hover:scale-105 transition-transform",
                  isThemeDark ? "border-zinc-800" : "border-zinc-50"
                )}
              />
            </div>
            
            <h1 className={cn(
              "text-3xl font-black tracking-tight mb-2 uppercase",
              isThemeDark ? "text-white" : "text-zinc-900"
            )}>
              VIP <span className="text-brand-blue">AI CHAT</span>
            </h1>
            <p className={cn(
              "text-[10px] mb-8 font-black uppercase tracking-[0.4em] leading-loose opacity-80",
              isThemeDark ? "text-zinc-400" : "text-zinc-500"
            )}>
              {isRegistering ? "Register New Identity" : "Elite Terminal Login"}
            </p>
            
            {authError && (
              <div className="w-full p-4 mb-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                {authError}
              </div>
            )}

            <div className="w-full space-y-4">
              <form onSubmit={handleDirectLogin} className="space-y-4">
                <div className="space-y-3">
                  {isRegistering && (
                    <div className="relative group/input">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within/input:text-brand-blue transition-colors" />
                      <input 
                        type="text"
                        placeholder="Choose Username"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className={cn(
                          "w-full h-14 border rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:border-brand-blue/50 transition-all font-medium",
                          isThemeDark ? "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600" : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                        )}
                      />
                    </div>
                  )}
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within/input:text-brand-blue transition-colors" />
                    <input 
                      type="email"
                      placeholder="Email Address"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className={cn(
                        "w-full h-14 border rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:border-brand-blue/50 transition-all font-medium",
                        isThemeDark ? "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600" : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                      )}
                    />
                  </div>
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within/input:text-brand-blue transition-colors" />
                    <input 
                      type="password"
                      placeholder="Security Password"
                      required
                      value={guestPassword}
                      onChange={(e) => setGuestPassword(e.target.value)}
                      className={cn(
                        "w-full h-14 border rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:border-brand-blue/50 transition-all font-medium",
                        isThemeDark ? "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600" : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                      )}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full h-14 bg-brand-red text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl hover:bg-brand-red-deep active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  <Key className="w-4 h-4" />
                  {isRegistering ? "Create Account" : "Secure Login"}
                </button>

                <button 
                  type="button"
                  onClick={toggleRegisterMode}
                  className="w-full text-center text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-brand-blue transition-colors pt-2"
                >
                  {isRegistering ? "Already have an identity? Login" : "New Operator? Register Identity"}
                </button>
              </form>

              {/* Instant & Discord Access */}
              <div className={cn("pt-6 border-t", isThemeDark ? "border-zinc-800" : "border-zinc-100")}>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 text-center">
                  Skip System / Discord Connect
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={handleBypassLogin}
                    className={cn(
                      "h-12 flex items-center justify-center gap-2 rounded-2xl text-[10px] font-black uppercase tracking-wider active:scale-[0.98] transition-all border",
                      isThemeDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-800"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Bypass Login
                  </button>

                  <button 
                    type="button"
                    onClick={handleLogin}
                    className="h-12 bg-brand-blue hover:bg-blue-600 text-white flex items-center justify-center gap-2 rounded-2xl text-[10px] font-black uppercase tracking-wider active:scale-[0.98] transition-all shadow-md"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Discord Bot
                  </button>
                </div>
              </div>
            </div>
            
            <p className="mt-8 text-zinc-400 text-[10px] font-black uppercase tracking-[0.5em] opacity-45">
              VIP TERMINAL PROTOCOL
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-zinc-900 font-sans overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-80 flex-col border-r border-zinc-200 bg-white shadow-sm">
        <div className="p-10 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-14">
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-blue/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src="/input_file_7.png" 
                alt="VIP" 
                className="w-12 h-12 relative z-10 rounded-xl border border-zinc-100 shadow-lg"
              />
            </div>
            <div>
              <span className="block font-black tracking-tight text-xl uppercase text-black leading-none mb-1">VIP AI CHAT</span>
              <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em]">Alpha Engine</span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black mb-4 px-2">Navigation</p>
              <button 
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest",
                  activeTab === 'chat' ? "bg-brand-blue text-white shadow-lg" : "bg-white text-zinc-500 hover:bg-zinc-50"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                Terminal Chat
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest",
                  activeTab === 'profile' ? "bg-brand-blue text-white shadow-lg" : "bg-white text-zinc-500 hover:bg-zinc-50"
                )}
              >
                <User className="w-4 h-4" />
                Operative Profile
              </button>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black mb-4 px-2">Core Circuits</p>
              <div className="space-y-2">
                {FEATURES.map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl border border-zinc-200 bg-white hover:border-brand-blue/30 transition-all cursor-help group shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-zinc-400 group-hover:text-brand-blue transition-colors">{f.icon}</div>
                      <span className="text-[11px] font-black tracking-wider uppercase">{f.name}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('profile')}
              className="p-6 rounded-[32px] bg-white border border-zinc-200 shadow-sm relative overflow-hidden group cursor-pointer hover:border-brand-blue/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-4 text-brand-blue">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Identity Secured</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={currentUser.avatar_url} 
                    className="w-12 h-12 rounded-xl border border-zinc-100 bg-zinc-50 relative z-10 shadow-sm object-cover"
                    alt="Profile"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-20" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black truncate uppercase tracking-tight text-black mb-0.5">{currentUser.username}</p>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Verified Operator</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-zinc-200 flex flex-col gap-4">
             <button 
              onClick={handleLogout}
              className="group flex items-center gap-3 text-zinc-400 hover:text-red-500 transition-colors py-1"
             >
               <LogOut className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
             </button>
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Link Active</span>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative flex flex-col flex-1 max-w-full bg-white">
        {/* Header */}
        <header className="flex items-center justify-between px-10 py-6 border-b border-zinc-100 bg-white z-20">
          <div className="flex items-center gap-4">
            <img src="/input_file_7.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg border border-zinc-50" />
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-blue shadow-[0_0_15px_rgba(37,99,235,0.4)] animate-pulse" />
              <h1 className="text-[11px] font-black text-black tracking-[0.5em] uppercase opacity-90">VIP TERMINAL PROTOCOL</h1>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Sync Status</p>
              <p className="text-[12px] font-black text-brand-red tracking-tight">ACTIVE</p>
            </div>
            <div className="w-[1px] h-6 bg-zinc-100" />
            <div className="flex items-center gap-3">
              <button onClick={clearChat} className="p-2 hover:bg-zinc-50 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4 text-zinc-400" />
              </button>
              <ShieldCheck className="w-5 h-5 text-brand-blue opacity-80" />
            </div>
          </div>
        </header>

        {/* View Switching */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div 
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full overflow-hidden"
              >
                {/* Chat Area */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-6 py-10 space-y-12 scroll-smooth custom-scrollbar bg-white"
                >
                  {messages.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto"
                    >
                      <div className="mb-8 p-6 rounded-[40px] bg-zinc-50 border border-zinc-100 shadow-sm relative">
                        <div className="absolute inset-0 bg-brand-blue/5 blur-3xl rounded-full" />
                        <img 
                          src="/input_file_7.png" 
                          alt="VIP" 
                          className="w-20 h-20 relative z-10 rounded-3xl border border-white"
                        />
                      </div>
                      <h2 className="text-2xl font-black mb-4 text-black tracking-tight uppercase">Terminal Ready.</h2>
                      <p className="text-zinc-500 text-sm mb-12 tracking-wide font-medium max-w-sm">
                        The VIP AI CHAT engine is synchronized. Input your directive below.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="max-w-4xl mx-auto space-y-12">
                      {messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex w-full gap-6",
                            message.role === "user" ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          <div className="flex-shrink-0">
                            {message.role === "user" ? (
                              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-brand-red border border-brand-red-deep shadow-lg">
                                <img src={currentUser.avatar_url} className="w-full h-full object-cover" alt="User" />
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border border-zinc-100 bg-white">
                                <img src="/input_file_7.png" className="w-full h-full object-cover" alt="VIP" />
                              </div>
                            )}
                          </div>
                          
                          <div className={cn(
                            "flex flex-col max-w-[80%]",
                            message.role === "user" ? "items-end" : "items-start"
                          )}>
                            <div className="mb-2 flex items-center gap-3">
                              <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest opacity-80">
                                {message.role === "user" ? currentUser.username : "VIP AI CHAT"}
                              </span>
                            </div>
                            <div className={cn(
                              "p-6 rounded-[32px] text-sm leading-relaxed font-medium shadow-[0_5px_15px_rgba(0,0,0,0.03)] transition-all",
                              message.role === "user" 
                                ? "bg-brand-blue text-white rounded-tr-none shadow-[0_10px_30px_rgba(37,99,235,0.2)]" 
                                : "bg-white text-zinc-800 border border-zinc-100 rounded-tl-none markdown-body"
                            )}>
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {isLoading && (
                    <div className="max-w-4xl mx-auto flex gap-6 animate-pulse">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100" />
                      <div className="space-y-3 pt-3">
                        <div className="h-4 w-48 bg-zinc-50 rounded-full" />
                        <div className="h-4 w-32 bg-zinc-50 rounded-full" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-10 bg-white border-t border-zinc-100">
                  <form 
                    onSubmit={handleSubmit}
                    className="max-w-4xl mx-auto relative group"
                  >
                    <div className="absolute inset-0 bg-brand-blue/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4 bg-white border border-zinc-200 shadow-sm rounded-[32px] p-2 pl-8 focus-within:border-brand-blue/30 focus-within:ring-8 focus-within:ring-brand-blue/5 transition-all">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Submit your VIP directive..."
                        className="flex-1 bg-transparent py-5 text-[15px] font-semibold outline-none text-zinc-900 placeholder:text-zinc-400"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-14 h-14 rounded-2xl bg-brand-red text-white hover:bg-brand-red-deep disabled:opacity-20 transition-all flex items-center justify-center shadow-[0_10px_20px_rgba(220,38,38,0.2)] active:scale-95"
                      >
                        <Send className="w-5 h-5 translate-x-0.5 -translate-y-0.5" />
                      </button>
                    </div>
                  </form>
                  <div className="mt-8 flex items-center justify-center gap-8 text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">
                    <span>Secure Node: On</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-100" />
                    <span>AI Type: Flash-VIP</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-100" />
                    <span>Identity: Verified</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col items-center justify-start p-10 lg:p-20 bg-slate-50 overflow-y-auto"
              >
                <div className="w-full max-w-2xl bg-white rounded-[48px] border border-zinc-100 shadow-[0_40px_100px_rgba(0,0,0,0.03)] p-12">
                  <div className="flex items-center gap-6 mb-12">
                     <div className="relative">
                        <img 
                          src={currentUser.avatar_url} 
                          className="w-24 h-24 rounded-[32px] border-4 border-zinc-50 shadow-xl object-cover"
                          alt="Large Profile"
                        />
                        <div className="absolute -bottom-2 -right-2 p-2 bg-brand-blue rounded-2xl shadow-lg border-4 border-white">
                           <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-black tracking-tight uppercase mb-1">Operative Details</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Class 1 Verification Required</p>
                     </div>
                     <div className="ml-auto">
                        <img src="/input_file_7.png" className="w-12 h-12 rounded-xl opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all" alt="Decor" />
                     </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Display Name</label>
                           <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-brand-blue transition-colors" />
                              <input 
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                                className="w-full h-14 bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-brand-blue/30 transition-all"
                              />
                           </div>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Avatar Link</label>
                           <div className="relative group">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-brand-blue transition-colors" />
                              <input 
                                value={editAvatar}
                                onChange={(e) => setEditAvatar(e.target.value)}
                                className="w-full h-14 bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-brand-blue/30 transition-all"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Security Bio</label>
                        <div className="relative group">
                           <Cpu className="absolute left-4 top-6 w-4 h-4 text-zinc-300 group-focus-within:text-brand-blue transition-colors" />
                           <textarea 
                             rows={4}
                             value={editBio}
                             onChange={(e) => setEditBio(e.target.value)}
                             className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl pl-12 pr-6 py-5 text-sm font-medium focus:outline-none focus:border-brand-blue/30 transition-all resize-none"
                           />
                        </div>
                     </div>

                     <div className="flex gap-4 pt-4">
                        <button 
                          type="submit"
                          className="flex-1 h-16 bg-brand-blue text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl hover:bg-brand-blue/90 active:scale-[0.98] transition-all"
                        >
                           Commit Changes
                        </button>
                        <button 
                          type="button"
                          onClick={() => setActiveTab('chat')}
                          className="px-8 h-16 bg-zinc-100 text-zinc-500 font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-zinc-200 active:scale-[0.98] transition-all"
                        >
                           Abort
                        </button>
                     </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


