
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
import { Key, LogIn, Plus, Trash2, Calendar, Star, Home, Loader2, Sparkles } from 'lucide-react';

// LAZY LOAD camera component so it never touches the landing page
const PhotoCapture = lazy(() => import('./components/PhotoCapture'));

// --- LANDING PAGE ---
const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Render the official Google Sign-In button if script is ready
    const initGSI = () => {
      // FIX: Cast window to any to access global 'google' object injected by external script
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: "600610510152-lercn1ar908bmhulp4b06p6occlkstd5.apps.googleusercontent.com",
          callback: async (response: any) => {
            setLoading(true);
            try {
              const user = await authService.handleCredentialResponse(response.credential);
              navigate('/dashboard');
            } catch (error) {
              console.error("Auth failed", error);
            } finally {
              setLoading(false);
            }
          }
        });
        // FIX: Cast window to any to avoid TypeScript errors on global property access
        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", shape: "pill" }
        );
      }
    };

    // Retry if script isn't loaded immediately
    const timer = setTimeout(initGSI, 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  // Sample Comic Data - Explicitly using /public/ as requested
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
       <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-6 sticky top-0 z-50">
         <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">H</div>
                <span className="font-bold text-xl tracking-tight text-gray-900">HeroGen</span>
            </div>
            <div id="google-signin-btn"></div>
         </div>
       </header>

       <section className="relative bg-slate-50 pt-20 pb-32 px-6 overflow-hidden">
         <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-100">
                    <Sparkles size={16} />
                    <span>AI-Powered Storytelling</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                    Become the Hero <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">You Were Born To Be</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                    Transform your selfie into a 6-panel AI-generated comic strip instantly.
                </p>
                <div className="flex justify-center lg:justify-start">
                   {loading ? <Loader2 className="animate-spin text-indigo-600" size={32} /> : <div id="hero-signin-cta"></div>}
                </div>
            </div>
            <div className="hidden lg:block">
               <div className="grid grid-cols-2 gap-4">
                  {THEMES.slice(0, 4).map(t => (
                    <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                       <h3 className="font-bold text-gray-800">{t.name}</h3>
                    </div>
                  ))}
               </div>
            </div>
         </div>
       </section>

       <section id="sample-comic" className="py-20 px-6 bg-slate-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
             <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl border border-gray-200">
                <h3 className="text-3xl font-bold text-center mb-10 text-slate-900 border-b-4 border-slate-900 pb-4 inline-block mx-auto px-10">
                    {sampleComic.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sampleComic.panels.map((panel) => (
                        <div key={panel.id} className="flex flex-col bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div style={{ aspectRatio: '4/3' }} className="w-full relative overflow-hidden bg-gray-100">
                                <img 
                                    src={panel.imageUrl} 
                                    alt={`Panel ${panel.id}`} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // SMART FALLBACK: If /public/ path fails, try root path
                                        const target = e.target as HTMLImageElement;
                                        if (target.src.includes('/public/')) {
                                          target.src = target.src.replace('/public/', '/');
                                        } else {
                                          target.src = `https://placehold.co/800x600/f1f5f9/94a3b8?text=Image+Not+Found`;
                                        }
                                    }}
                                />
                            </div>
                            <div className="p-4 bg-white border-t-2 border-slate-900">
                                <p className="text-slate-800 font-medium italic text-sm">"{panel.caption}"</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          </div>
       </section>

       <footer className="bg-slate-900 text-slate-400 py-12 px-6 mt-auto text-center">
          <p>&copy; {new Date().getFullYear()} HeroGen. All rights reserved.</p>
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
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
           <Link to="/dashboard" className="font-bold text-xl text-gray-800">HeroGen</Link>
           <button onClick={async () => { await authService.signOut(); navigate('/'); }} className="text-gray-500 hover:text-gray-800 text-sm">Sign Out</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
         {!user?.photoUrl ? (
             <section className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
                 <Suspense fallback={<Loader2 className="animate-spin mx-auto"/>}>
                    <PhotoCapture onPhotoAccepted={handleChangeFace} />
                 </Suspense>
             </section>
         ) : (
             <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-indigo-100">
                        <img src={user.photoUrl} alt="Hero Face" className="w-full h-full object-cover" />
                    </div>
                    <button onClick={handleDeleteFace} className="absolute bottom-0 right-0 bg-red-100 text-red-600 p-2 rounded-full">
                        <Trash2 size={16}/>
                    </button>
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <h2 className="text-2xl font-bold">Identity Established</h2>
                    <Link to="/create" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-md">
                        <Plus size={20}/> Create New Comic
                    </Link>
                </div>
             </section>
         )}

         <section>
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Calendar size={20} className="text-indigo-600"/> Your Adventures
            </h3>
            {comics.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl text-gray-400 border border-gray-100">
                    <p>No comics created yet. Your saga begins now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {comics.map(comic => (
                        <Link key={comic.id} to={`/comic/${comic.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100">
                            <div className="aspect-square bg-gray-200 overflow-hidden">
                                {comic.panels[0]?.imageUrl && <img src={comic.panels[0].imageUrl} className="w-full h-full object-cover"/>}
                            </div>
                            <div className="p-4">
                                <h4 className="font-bold text-gray-800 truncate">{comic.title}</h4>
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
            // Removed direct apiKey passing as service now uses process.env.API_KEY exclusively
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
                     // Updated call signature for generatePanelImage
                     const finishedPanel = await generatePanelImage(user.photoUrl, theme, alignment, script.panels[i]);
                     panels[i] = finishedPanel;
                     newComic.panels = [...panels];
                     await dbService.saveComic(newComic);
                } catch(e: any) { 
                    console.error(e);
                    // Handle case where API key might be invalid/expired as per guidelines
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
             <div className="min-h-screen flex items-center justify-center p-4">
                 <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
                    <Key className="mx-auto mb-4 text-indigo-600" size={40}/>
                    <h2 className="text-2xl font-bold mb-4">API Key Required</h2>
                    <p className="mb-6 text-gray-600">Please select a Gemini API key from a paid project to generate your comic.</p>
                    <button onClick={handleKeySelect} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Connect Google API Key</button>
                    <div className="mt-4">
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-600 text-sm underline">Learn about API billing</a>
                    </div>
                 </div>
             </div>
        );
    }

    if (step === 'generating') return <LoadingScreen message={loadingMessage} />;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                <Link to="/dashboard" className="font-bold text-xl">HeroGen</Link>
                <Link to="/dashboard" className="text-gray-500 font-bold">Cancel</Link>
            </header>
            {step === 'theme' && <ThemeSelector onSelect={(t) => { setTheme(t); setStep('alignment'); }} />}
            {step === 'alignment' && <AlignmentSelector onSelect={handleGenerate} />}
        </div>
    );
};

const ComicDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [comic, setComic] = useState<SavedComic | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            const c = await dbService.getComic(id);
            if (!c) { navigate('/dashboard'); return; }
            setComic(c);
            setLoading(false);
        };
        load();
    }, [id, navigate]);

    const handleUpdate = async (updates: Partial<SavedComic>) => {
        if (!comic) return;
        const updated = { ...comic, ...updates };
        await dbService.saveComic(updated);
        setComic(updated);
    };

    if (loading) return <LoadingScreen message="Loading Comic..." />;
    if (!comic) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                <Link to="/dashboard" className="font-bold text-xl">HeroGen</Link>
                <Link to="/dashboard" className="text-gray-500"><Home size={20}/></Link>
            </header>
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
    if (!comic) return <div className="text-center p-20">404: Comic not found or private.</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                <span className="font-bold text-xl">HeroGen</span>
                <Link to="/" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">Join HeroGen</Link>
            </header>
            <ComicDisplay story={comic} mode="public" />
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
