import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Github, 
  Users, 
  Star, 
  GitFork, 
  ExternalLink, 
  MapPin, 
  Link as LinkIcon, 
  Twitter, 
  Calendar, 
  Moon, 
  Sun, 
  FileDown, 
  History, 
  ArrowRightLeft,
  ChevronRight,
  Code,
  LogOut,
  LogIn
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { GitHubCalendar } from "react-github-calendar";
import { GitHubUser, GitHubRepo, GitHubEvent } from "./types";
import { cn, formatNumber, LANGUAGE_COLORS } from "./lib/utils";

export default function App() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<GitHubUser | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonUser, setComparisonUser] = useState<GitHubUser | null>(null);
  const [comparisonRepos, setComparisonRepos] = useState<GitHubRepo[]>([]);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Initialize theme, history, and current user
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    
    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
    setHistory(savedHistory);
    checkAuth();
  }, []);

  // OAuth Message Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        if (!user) fetchData(data.user.login);
      }
    } catch (err) {
      console.error("Auth check failed", err);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/auth/github");
      const { url } = await res.json();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const fetchData = async (searchName: string, isComparison = false) => {
    if (!searchName) return;
    setLoading(true);
    setError(null);

    try {
      const [userRes, reposRes, eventsRes] = await Promise.all([
        fetch(`/api/github/user/${searchName}`),
        fetch(`/api/github/repos/${searchName}`),
        fetch(`/api/github/events/${searchName}`)
      ]);

      if (!userRes.ok) throw new Error("User not found");

      const userData = await userRes.json();
      const reposData = await reposRes.json();
      const eventsData = await eventsRes.json();

      if (isComparison) {
        setComparisonUser(userData);
        setComparisonRepos(reposData);
      } else {
        setUser(userData);
        setRepos(reposData);
        setEvents(eventsData);
        updateHistory(searchName);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateHistory = (name: string) => {
    const newHistory = [name, ...history.filter(h => h !== name)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${user?.login}-github-report.pdf`);
  };

  const languageData = repos.reduce((acc: any[], repo) => {
    if (repo.language) {
      const existing = acc.find(l => l.name === repo.language);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: repo.language, value: 1 });
      }
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 5);

  const topRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);

  return (
    <div className={cn("min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 flex flex-col")}>
      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-slate-900 font-bold">
            G
          </div>
          <span className="font-bold tracking-tight text-lg">GitScope.</span>
        </div>

        <div className="flex items-center flex-1 max-w-md mx-12">
          <form 
            className="relative w-full"
            onSubmit={(e) => { e.preventDefault(); fetchData(username); }}
          >
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Search GitHub username..." 
              className="w-full bg-gray-100 dark:bg-zinc-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:bg-white dark:focus:bg-zinc-900 transition-all outline-none" 
            />
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" />
          </form>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <button 
            onClick={() => setShowComparison(true)}
            className="text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Compare
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          {currentUser ? (
             <div className="flex items-center gap-3">
                <img src={currentUser.avatar_url} className="w-8 h-8 rounded-full border border-gray-200 dark:border-zinc-700" alt="" />
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
             </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <LogIn size={14} /> Login with GitHub
            </button>
          )}

          {user && (
            <button 
              onClick={handleExportPDF}
              className="border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
            >
              Export Report
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-auto p-6 gap-6 max-w-[1440px] mx-auto w-full">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50/50 dark:bg-zinc-950/50 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {user ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={reportRef}
              className="flex flex-col md:flex-row gap-6 w-full"
            >
              {/* Sidebar */}
              <aside className="w-full md:w-80 flex flex-col gap-6 flex-shrink-0">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-800 shadow-lg overflow-hidden mb-4">
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>
                  </div>
                  <h1 className="text-xl font-bold">{user.name || user.login}</h1>
                  <p className="text-gray-500 text-sm mb-4">@{user.login}</p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-6">
                    {user.bio || "No bio provided."}
                  </p>
                  
                  <div className="grid grid-cols-2 w-full gap-4 border-t border-gray-100 dark:border-zinc-800 pt-6">
                    <div className="text-center">
                      <div className="text-lg font-bold">{formatNumber(user.followers)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{formatNumber(user.following)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Following</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Language Usage</h3>
                  <div className="h-48 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={languageData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {languageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={LANGUAGE_COLORS[entry.name] || "#8884d8"} />
                          ))}
                        </Pie>
                        <ReTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {languageData.map((lang) => (
                       <div key={lang.name} className="flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LANGUAGE_COLORS[lang.name] }} />
                          <span>{lang.name}</span>
                        </div>
                        <span className="text-gray-500">{((lang.value / repos.length) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {history.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Search History</h3>
                    <div className="flex flex-col gap-2">
                      {history.map(h => (
                        <button 
                          key={h}
                          onClick={() => { setUsername(h); fetchData(h); }}
                          className="flex items-center justify-between text-xs font-medium p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left"
                        >
                          <span>{h}</span>
                          <ChevronRight size={14} className="text-gray-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              {/* Main Content */}
              <section className="flex-1 flex flex-col gap-6 overflow-auto">
                {/* Contribution Calendar */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm overflow-x-auto">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                      <Calendar size={16} /> Activity Streak
                   </h3>
                   <div className="min-w-[700px] flex justify-center">
                     <GitHubCalendar 
                        username={user.login} 
                        colorScheme={isDark ? "dark" : "light"}
                        fontSize={12}
                        blockSize={12}
                        blockMargin={4}
                     />
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-md">
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Repositories</div>
                    <div className="text-3xl font-bold">{user.public_repos}</div>
                    <div className="text-xs mt-4 opacity-80">Public projects</div>
                  </div>
                  <div className="bg-slate-900 dark:bg-white rounded-2xl p-5 text-white dark:text-slate-900 shadow-md">
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Stars</div>
                    <div className="text-3xl font-bold">
                      {formatNumber(repos.reduce((s, r) => s + r.stargazers_count, 0))}
                    </div>
                    <div className="text-xs mt-4 opacity-80">Across all projects</div>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Recent Pulse</div>
                    <div className="flex items-end gap-1 h-12 mt-2">
                       <div className="bg-slate-200 dark:bg-zinc-800 w-full h-[20%] rounded-t-sm"></div>
                       <div className="bg-slate-200 dark:bg-zinc-800 w-full h-[45%] rounded-t-sm"></div>
                       <div className="bg-slate-900 dark:bg-white w-full h-[80%] rounded-t-sm"></div>
                       <div className="bg-slate-900 dark:bg-white w-full h-[100%] rounded-t-sm"></div>
                       <div className="bg-indigo-400 w-full h-[60%] rounded-t-sm"></div>
                       <div className="bg-slate-200 dark:bg-zinc-800 w-full h-[30%] rounded-t-sm"></div>
                       <div className="bg-slate-900 dark:bg-white w-full h-[90%] rounded-t-sm"></div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">Top Repositories</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">Sort by:</span>
                      <span className="text-xs font-bold">Stars</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {topRepos.map(repo => (
                      <div 
                        key={repo.id} 
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors cursor-pointer group shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">
                            {repo.name}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded">
                            Public
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8">
                          {repo.description || "No description provided."}
                        </p>
                        <div className="flex items-center gap-4">
                          {repo.language && (
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LANGUAGE_COLORS[repo.language] }} />
                              <span>{repo.language}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>⭐ {formatNumber(repo.stargazers_count)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <GitFork size={12} />
                            <span> {formatNumber(repo.forks_count)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-2xl flex items-center justify-between border border-transparent dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-white shadow-sm">
                      <Star size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Latest Activity</div>
                      <div className="text-xs text-gray-500">
                        {events[0] ? (
                          <>
                            {events[0].type.replace('Event', '')} in <span className="font-bold text-slate-700 dark:text-zinc-300">{events[0].repo.name}</span>
                          </>
                        ) : "No recent activity"}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    {events[0] ? format(new Date(events[0].created_at), "h 'hours ago'") : ""}
                  </div>
                </div>
              </section>
            </motion.div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-20 text-center space-y-6">
               <Github size={64} className="text-slate-200 dark:text-zinc-800" />
               <div className="space-y-2">
                 <h2 className="text-2xl font-bold">Welcome to GitScope</h2>
                 <p className="text-gray-500 max-w-sm">Search any user or login with GitHub to explore your own deep stats and contribution graph.</p>
               </div>
               {!currentUser && (
                 <button 
                  onClick={handleLogin}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-3"
                 >
                   <LogIn size={20} /> Login with GitHub
                 </button>
               )}
            </div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showComparison && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto border border-white/10"
             >
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-3xl font-black italic tracking-tighter">VERSUS MODE</h2>
                   <button onClick={() => setShowComparison(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">✕</button>
                </div>

                <div className="grid md:grid-cols-2 gap-12 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 dark:bg-zinc-800 hidden md:block" />
                  
                  {/* Left Side: Current User */}
                  <div className="space-y-6 text-center">
                     {user && (
                       <div className="space-y-6">
                          <img src={user.avatar_url} className="w-24 h-24 rounded-2xl mx-auto shadow-lg" alt="" />
                          <h3 className="text-xl font-bold">{user.name || user.login}</h3>
                          <div className="space-y-4">
                             <div className="bg-gray-50 dark:bg-zinc-800 font-black p-4 rounded-xl">
                                <div className="text-xs text-gray-400 uppercase mb-1">Repos</div>
                                <div className="text-2xl">{user.public_repos}</div>
                             </div>
                             <div className={cn(
                               "font-black p-4 rounded-xl",
                               comparisonUser && repos.reduce((s, r) => s + r.stargazers_count, 0) > comparisonRepos.reduce((s, r) => s + r.stargazers_count, 0) 
                               ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" 
                               : "bg-gray-50 dark:bg-zinc-800"
                             )}>
                                <div className="text-xs text-gray-400 uppercase mb-1">Total Stars</div>
                                <div className="text-2xl">{repos.reduce((s, r) => s + r.stargazers_count, 0)}</div>
                             </div>
                          </div>
                       </div>
                     )}
                  </div>

                  {/* Right Side: Competitor */}
                  <div className="space-y-6 text-center">
                     {comparisonUser ? (
                        <div className="space-y-6">
                           <div className="relative inline-block">
                             <img src={comparisonUser.avatar_url} className="w-24 h-24 rounded-2xl mx-auto shadow-lg" alt="" />
                             <button 
                              onClick={() => setComparisonUser(null)} 
                              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-xs"
                             >✕</button>
                           </div>
                           <h3 className="text-xl font-bold">{comparisonUser.name || comparisonUser.login}</h3>
                           <div className="space-y-4">
                              <div className="bg-gray-50 dark:bg-zinc-800 font-black p-4 rounded-xl">
                                 <div className="text-xs text-gray-400 uppercase mb-1">Repos</div>
                                 <div className="text-2xl">{comparisonUser.public_repos}</div>
                              </div>
                              <div className={cn(
                               "font-black p-4 rounded-xl",
                               user && comparisonRepos.reduce((s, r) => s + r.stargazers_count, 0) > repos.reduce((s, r) => s + r.stargazers_count, 0) 
                               ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" 
                               : "bg-gray-50 dark:bg-zinc-800"
                             )}>
                                 <div className="text-xs text-gray-400 uppercase mb-1">Total Stars</div>
                                 <div className="text-2xl">{comparisonRepos.reduce((s, r) => s + r.stargazers_count, 0)}</div>
                              </div>
                           </div>
                        </div>
                     ) : (
                       <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl space-y-4">
                          <Users size={48} className="text-gray-300" />
                          <p className="text-sm font-medium text-gray-500">Add a competitor</p>
                          <input 
                            placeholder="Username..." 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') fetchData((e.target as HTMLInputElement).value, true);
                            }}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-transparent focus:border-zinc-900 dark:focus:border-white rounded-xl outline-none"
                          />
                       </div>
                     )}
                  </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-gray-200 dark:border-zinc-800 mt-20">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 font-bold opacity-50">
            <Github size={18} />
            <span>GitScope Analytics</span>
          </div>
          <p className="text-sm text-gray-400">Powered by GitHub REST API. Built for developers.</p>
        </div>
      </footer>
    </div>
  );
}
