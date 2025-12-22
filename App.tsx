import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { User, SavedComic, Theme, Alignment } from './types';
import { THEMES } from './constants';
import { authService } from './services/auth';
import { dbService } from './services/db';
import { analyzeImage, generateStoryScript, generatePanelImage } from './services/geminiService';
import ThemeSelector from './components/ThemeSelector';
import AlignmentSelector from './components/AlignmentSelector';
import ComicDisplay from './components/ComicDisplay';
import LoadingScreen from './components/LoadingScreen';
import * as Icons from 'lucide-react';
import { Key, LogIn, Plus, Trash2, Calendar, Star, Home, Loader2, Sparkles, ArrowRight, ChevronRight, LogOut } from 'lucide-react';

// LAZY LOAD camera component
const PhotoCapture = lazy(() => import('./components/PhotoCapture'));

// --- COMMON COMPONENTS ---
const AppHeader = ({ user, onSignOut }: { user?: User | null, onSignOut?: () => void }) => (
  <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-6 sticky top-0 z-50">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">H</div>
        <span className="font-bold text-xl tracking-tight text-gray-900 uppercase">HeroGen</span>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <button 
            onClick={onSignOut} 
            className="text-gray-500 hover:text-red-600 font-bold text-sm transition-colors flex items-center gap-2"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        ) : (
          <div id="google-signin-btn"></div>
        )}
      </div>
    </div>
  </header>
);

// --- HERO ANIMATION ---
const HeroComicAnimation = () => {
  const [frame, setFrame] = useState(1);
  const totalFrames = 6;

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev % totalFrames) + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getImagePath = (f: number) => `/public/sample-${f}.png`;

  return (
    <div className="relative z-10 bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 rotate-2 transition-transform duration-1000">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
        <img 
          key={frame}
          src={getImagePath(frame)} 
          className="w-full h-full object-cover animate-fade-in" 
          alt={`Hero Frame ${frame}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src.includes('/public/')) {
              target.src = target.src.replace('/public/', '/');
            } else {
              target.src = "https://placehold.co/600x450/6366f1/ffffff?text=Become+The+Hero";
            }
          }}
        />
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">
          Panel {frame} of 6
        </div>
      </div>
    </div>
  );
};

// --- LANDING PAGE ---
const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const u = await authService.getCurrentUser();
      setUser(u);
    };
    checkUser();

    const initGSI = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: "600610510152-lercn1ar908bmhulp4b06p6occlkstd5.apps.googleusercontent.com",
          callback: async (response: any) => {
            setLoading(true);
            try {
              const user = await authService.handleCredentialResponse(response.credential);
              setUser(user);
              navigate('/dashboard');
            } catch (error) {
              console.error("Auth failed", error);
            } finally {
              setLoading(false);
            }
          }
        });
        
        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", shape: "pill", text: "continue_with" }
        );
      }
    };

    const timer = setTimeout(initGSI, 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleAuthAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      (window as any).google?.accounts?.id?.prompt();
    }
  };

  const sampleComic = {
    title: "The Guardian's Resolve",
    panels: [
        { id: 1, caption: "Captain Kaelen, vigilant guardian of Sector Gamma, watches over the serene cosmic expanse.", imageUrl: "/public/sample-1.png" },
        { id: 2, caption: "Suddenly, a critical distress signal shatters the tranquility!", imageUrl: "/public/sample-2.png" },
        { id: 3, caption: "Duty calls. Kaelen scrambles to his starfighter.", imageUrl: "/public/sample-3.png" },
        { id: 4, caption: "Outnumbered but unyielding, Kaelen maneuvers through enemy fire.", imageUrl: "/public/sample-4.png" },
        { id: 5, caption: "With a perfectly timed energy blast, Kaelen cripples the enemy flagship!", imageUrl: "/public/sample-5.png" },
        { id: 6, caption: "Peace restored, Kaelen looks out at the galaxy once more.", imageUrl: "/public/sample-6.png" },
    ]
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col overflow-x-hidden">
       <AppHeader />

       <section className="relative bg-slate-50 pt-20 pb-24 px-6 overflow-hidden">
         <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-100">
                    <Sparkles size={16} />
                    <span>AI-Powered Storytelling</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                    Become the Hero (or Villain) <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">You Were Born To Be</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                    Transform your selfie into an AI-generated comic strip with 1 of 12 themes.
                </p>
                <div className="flex justify-center lg:justify-start">
                   {loading ? (
                     <div className="flex items-center gap-2 text-indigo-600 font-bold">
                       <Loader2 className="animate-spin" size={24} />
                       <span>Initializing Headquarters...</span>
                     </div>
                   ) : (
                     <button 
                        onClick={handleAuthAction}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                     >
                        Getting Started <ArrowRight size={20} />
                     </button>
                   )}
                </div>
            </div>
            <div className="hidden lg:block relative">
               <HeroComicAnimation />
               <div className="absolute top-10 -left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
               <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>
         </div>
       </section>

       {/* THEMES SECTION */}
       <section className="py-24 px-6 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto text-center space-y-16">
             <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Explore 12 Unique Universes</h2>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">From neon-drenched cities to ancient magic, choose the setting for your saga.</p>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {THEMES.map((theme) => {
                   const IconComp = (Icons as any)[theme.icon] || Icons.Circle;
                   return (
                      <button 
                        key={theme.id} 
                        onClick={handleAuthAction}
                        className="group relative p-6 rounded-3xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                      >
                         <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-bl-full`}></div>
                         <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                            <IconComp size={24} />
                         </div>
                         <h3 className="font-bold text-xl text-slate-900 mb-2">{theme.name}</h3>
                         <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{theme.description}</p>
                         <div className="mt-4 flex items-center gap-1 text-indigo-600 font-bold text-xs opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all">
                            SELECT THEME <ChevronRight size={14} />
                         </div>
                      </button>
                   );
                })}
             </div>
          </div>
       </section>

       <section id="sample-comic" className="py-24 px-6 bg-slate-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
             <div className="bg-white p-6 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-200">
                <div className="text-center mb-12 space-y-4">
                    <span className="text-indigo-600 font-bold uppercase tracking-widest text-sm">Example Adventure</span>
                    <h3 className="text-4xl font-black text-slate-900">
                        {sampleComic.title}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {sampleComic.panels.map((panel) => (
                        <div key={panel.id} className="group flex flex-col bg-white border-2 border-slate-900 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[5px] hover:translate-y-[5px] transition-all">
                            <div style={{ aspectRatio: '4/3' }} className="w-full relative overflow-hidden bg-gray-100">
                                <img 
                                    src={panel.imageUrl} 
                                    alt={`Panel ${panel.id}`} 
                                    className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src.includes('/public/')) {
                                          target.src = target.src.replace('/public/', '/');
                                        } else {
                                          target.src = `https://placehold.co/800x600/f1f5f9/94a3b8?text=Hero+Panel+${panel.id}`;
                                        }
                                    }}
                                />
                            </div>
                            <div className="p-5 bg-white border-t-2 border-slate-900">
                                <p className="text-slate-800 font-bold italic text-sm leading-relaxed">"{panel.caption}"</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          </div>
       </section>

       <footer className="bg-slate-900 text-slate-500 py-16 px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">H</div>
                <span className="font-bold text-xl tracking-tight text-white uppercase">HeroGen</span>
             </div>
             <p className="text-sm">&copy; {new Date().getFullYear()} HeroGen. Created with Gemini AI.</p>
             <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
             </div>
          </div>
       </footer>
    </div>
  );
};

// --- DASHBOARD ---
const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [comics, setComics] = useState<SavedComic[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
       const u = await authService.getCurrentUser();
       if (!u) { navigate('/'); return; }
       setUser(u);
       const userComics = await dbService.getComicsByUser(u.id);
       setComics(userComics.sort((a,b) => b.createdAt - a.createdAt));
       setLoading(false);
    };
    loadData();
  }, [navigate]);

  const handleSignOut = async () => {
    await authService.signOut();
    navigate('/');
  };

  const handleDeleteFace = async () => {
      if (!user) return;
      if (window.confirm("Remove your hero identity?")) {
          const updatedUser = { ...user, photoUrl: null };
          await dbService.saveUser(updatedUser);
          setUser(updatedUser);
      }
  };

  const handleChangeFace = async (dataUrl: string) => {
      if (!user) return;
      const updatedUser = { ...user, photoUrl: dataUrl };
      await dbService.saveUser(updatedUser);
      setUser(updatedUser);
  };

  if (loading) return <LoadingScreen message="Loading Headquarters..." />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader user={user} onSignOut={handleSignOut} />

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-16">
         {!user?.photoUrl ? (
             <section className="bg-white p-12 rounded-[2rem] shadow-xl border border-gray-100 text-center space-y-8">
                 <div className="max-w-md mx-auto space-y-4">
                    <h2 className="text-3xl font-extrabold text-slate-900">Define Your Hero</h2>
                    <p className="text-slate-500">To generate consistent comics, we need a reference photo of your face.</p>
                 </div>
                 <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>}>
                    <PhotoCapture onPhotoAccepted={handleChangeFace} />
                 </Suspense>
             </section>
         ) : (
             <section className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-10">
                <div className="relative">
                    <div className="w-40 h-40 rounded-full overflow-hidden ring-8 ring-indigo-50 shadow-inner">
                        <img src={user.photoUrl} alt="Hero Face" className="w-full h-full object-cover" />
                    </div>
                    <button onClick={handleDeleteFace} className="absolute bottom-1 right-1 bg-white text-red-600 p-3 rounded-full shadow-lg hover:bg-red-50 transition-colors border border-red-100">
                        <Trash2 size={20}/>
                    </button>
                </div>
                <div className="flex-1 space-y-6 text-center md:text-left">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900">Identity Established</h2>
                        <p className="text-slate-500 font-medium">Ready for your next saga, {user.name}?</p>
                    </div>
                    <Link to="/create" className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all">
                        <Plus size={24}/> Create New Comic
                    </Link>
                </div>
             </section>
         )}

         <section>
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Calendar size={24} className="text-indigo-600"/> Your Chronicles
                </h3>
            </div>
            {comics.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Plus size={32} />
                    </div>
                    <p className="text-gray-400 font-medium">No comics created yet. Your saga begins now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {comics.map(comic => (
                        <Link key={comic.id} to={`/comic/${comic.id}`} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gray-100">
                            <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                                {comic.panels[0]?.imageUrl ? (
                                    <img src={comic.panels[0].imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={comic.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Loader2 className="animate-spin" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <span className="text-white text-sm font-bold">View Adventure</span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h4 className="font-bold text-gray-900 truncate text-lg">{comic.title}</h4>
                                <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">{comic.alignment}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
         </section>
      </main>
    </div>
  );
};

// --- CREATE COMIC PAGE ---
const CreateComicPage = () => {
    const [step, setStep] = useState<'theme' | 'alignment' | 'generating'>('theme');
    const [theme, setTheme] = useState<Theme | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("");
    const navigate = useNavigate();
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        (async () => {
             const u = await authService.getCurrentUser();
             if(!u || !u.photoUrl) { navigate('/dashboard'); return; }
             setUser(u);
             const aistudio = (window as any).aistudio;
             if ((aistudio && await aistudio.hasSelectedApiKey()) || process.env.API_KEY) {
                 setHasKey(true);
             }
        })();
    }, [navigate]);

    const handleSignOut = async () => {
      await authService.signOut();
      navigate('/');
    };

    const handleKeySelect = async () => {
        const aistudio = (window as any).aistudio;
        if(aistudio) {
            await aistudio.openSelectKey();
            setHasKey(true);
        }
    };

    const handleGenerate = async (alignment: Alignment) => {
        if (!user || !user.photoUrl || !theme) return;
        setStep('generating');

        try {
            setLoadingMessage("Analyzing hero's appearance...");
            const description = await analyzeImage(user.photoUrl);
            setLoadingMessage("Writing the script...");
            const script = await generateStoryScript(theme, alignment, description);

            const newComic: SavedComic = {
                id: crypto.randomUUID(),
                userId: user.id,
                title: script.title,
                themeId: theme.id,
                alignment: alignment,
                rating: 0,
                isPublic: false,
                createdAt: Date.now(),
                panels: script.panels.map(p => ({ id: p.id, caption: p.caption, imageUrl: '' }))
            };
            
            await dbService.saveComic(newComic);
            const panels = [...newComic.panels];
            
            for (let i = 0; i < panels.length; i++) {
                setLoadingMessage(`Painting Panel ${i+1} of 6...`);
                try {
                     const finishedPanel = await generatePanelImage(user.photoUrl, theme, alignment, script.panels[i]);
                     panels[i] = finishedPanel;
                     newComic.panels = [...panels];
                     await dbService.saveComic(newComic);
                } catch(e: any) { 
                    console.error(e);
                    if (e?.message?.includes("Requested entity was not found.")) {
                        setHasKey(false);
                        const aistudio = (window as any).aistudio;
                        if (aistudio) await aistudio.openSelectKey();
                        throw e;
                    }
                }
            }
            navigate(`/comic/${newComic.id}`);
        } catch (e) {
            console.error(e);
            alert("Generation failed.");
            setStep('theme');
        }
    };

    if (!hasKey) {
        return (
             <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                 <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm border border-gray-100">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
                        <Key size={32}/>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-slate-900">API Key Required</h2>
                    <p className="mb-8 text-gray-500 text-sm leading-relaxed">Please select a Gemini API key from a paid project to generate your comic saga.</p>
                    <button onClick={handleKeySelect} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold w-full shadow-lg hover:bg-indigo-700 transition-all">Connect Google API Key</button>
                    <div className="mt-6">
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-600 text-sm font-bold underline hover:text-indigo-800 transition-colors">Learn about API billing</a>
                    </div>
                 </div>
             </div>
        );
    }

    if (step === 'generating') return <LoadingScreen message={loadingMessage} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <AppHeader user={user} onSignOut={handleSignOut} />
            <div className="max-w-5xl mx-auto px-4 pt-12">
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-3xl font-black text-slate-900">Forge Your Saga</h2>
                    <Link to="/dashboard" className="text-slate-400 font-bold hover:text-red-500 transition-colors">Cancel</Link>
                </div>
                {step === 'theme' && <ThemeSelector onSelect={(t) => { setTheme(t); setStep('alignment'); }} />}
                {step === 'alignment' && <AlignmentSelector onSelect={handleGenerate} />}
            </div>
        </div>
    );
};

const ComicDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [comic, setComic] = useState<SavedComic | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            const u = await authService.getCurrentUser();
            setUser(u);
            const c = await dbService.getComic(id);
            if (!c) { navigate('/dashboard'); return; }
            setComic(c);
            setLoading(false);
        };
        load();
    }, [id, navigate]);

    const handleSignOut = async () => {
      await authService.signOut();
      navigate('/');
    };

    const handleUpdate = async (updates: Partial<SavedComic>) => {
        if (!comic) return;
        const updated = { ...comic, ...updates };
        await dbService.saveComic(updated);
        setComic(updated);
    };

    if (loading) return <LoadingScreen message="Loading Comic..." />;
    if (!comic) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <AppHeader user={user} onSignOut={handleSignOut} />
            <div className="pt-12">
              <ComicDisplay 
                  story={comic} 
                  mode="owner" 
                  comicId={comic.id}
                  isPublic={comic.isPublic}
                  onRate={(r) => handleUpdate({ rating: r })}
                  onTogglePublic={(pub) => handleUpdate({ isPublic: pub })}
                  onDelete={() => { dbService.deleteComic(comic.id); navigate('/dashboard'); }}
              />
            </div>
        </div>
    );
};

const PublicView = () => {
    const { id } = useParams();
    const [comic, setComic] = useState<SavedComic | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            const c = await dbService.getComic(id);
            if (c && c.isPublic) setComic(c);
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) return <LoadingScreen message="Loading..." />;
    if (!comic) return <div className="min-h-screen flex flex-col items-center justify-center p-20 bg-gray-50 gap-6">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
           <Star size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Comic not found</h2>
        <p className="text-gray-500 text-center max-w-sm">This comic may be private, deleted, or the link is incorrect.</p>
        <Link to="/" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">Go Home</Link>
    </div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <AppHeader />
            <div className="pt-12">
              <ComicDisplay story={comic} mode="public" />
            </div>
        </div>
    );
};

const App = () => {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateComicPage />} />
            <Route path="/comic/:id" element={<ComicDetail />} />
            <Route path="/share/:id" element={<PublicView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
  );
};

export default App;