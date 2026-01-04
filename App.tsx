import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { User, SavedComic, Theme, Alignment } from './types';
import { THEMES } from './constants';
import { authService } from './services/auth';
import { dbService } from './services/db';
import { CONFIG } from './config';
import { analyzeImage, generateStoryScript, generatePanelImage } from './services/geminiService';
import ThemeSelector from './components/ThemeSelector';
import AlignmentSelector from './components/AlignmentSelector';
import ComicDisplay from './components/ComicDisplay';
import LoadingScreen from './components/LoadingScreen';
import * as Icons from 'lucide-react';
import { Key, LogIn, Plus, Trash2, Calendar, Star, Home, Loader2, Sparkles, ArrowRight, ChevronRight, LogOut, Zap, Rocket, Sword, Shield, BookOpen } from 'lucide-react';

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
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-indigo-50 overflow-hidden">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-sm font-black text-slate-700 uppercase tracking-tight hidden sm:block">{user.name}</span>
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
            <button
              onClick={onSignOut}
              className="text-gray-500 hover:text-red-600 font-bold text-sm transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <div id="google-signin-btn"></div>
        )}
      </div>
    </div>
  </header>
);

// --- HELPERS ---
const resolveAssetPath = (path: string) => {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
};

// --- HERO ANIMATION ---
const HeroComicAnimation = () => {
  const [frame, setFrame] = useState(1);
  const totalFrames = 12;

  useEffect(() => {
    // Frame duration: 2.5 seconds per image for a smoother rhythm
    const timer = setInterval(() => {
      setFrame((prev) => (prev % totalFrames) + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const getImagePath = (f: number) => {
    return resolveAssetPath(f <= 6 ? `sample-1/sample-${f}.png` : `sample-2/sample-${f - 6}.png`);
  };

  const allFrames = Array.from({ length: totalFrames }, (_, i) => i + 1);

  return (
    <div className="relative z-10 bg-white p-3 md:p-4 rounded-3xl shadow-2xl border border-gray-100 rotate-2 transition-transform duration-1000 max-w-sm lg:max-w-none mx-auto">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {allFrames.map((f) => (
          <img
            key={f}
            src={getImagePath(f)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${frame === f ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            alt={`Hero Frame ${f}`}
            loading="eager"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://placehold.co/800x600/f1f5f9/94a3b8?text=Hero+Frame+${f}`;
            }}
          />
        ))}
        {/* Progress indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full">
          {allFrames.map((f) => (
            <div
              key={f}
              className={`h-1 rounded-full transition-all duration-500 ${frame === f ? 'w-4 bg-white' : 'w-1 bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- LANDING PAGE ---
const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
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
          client_id: CONFIG.GOOGLE_CLIENT_ID,
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

        // Render button in Header
        const headerBtn = document.getElementById("google-signin-btn");
        if (headerBtn) {
          (window as any).google.accounts.id.renderButton(
            headerBtn,
            { theme: "outline", size: "large", shape: "pill", text: "continue_with" }
          );
        }

        // Trigger One Tap prompt automatically on load
        (window as any).google.accounts.id.prompt();
      }
    };

    const timer = setTimeout(initGSI, 800);
    return () => clearTimeout(timer);
  }, [navigate, user]);

  const handleAuthAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      // If not logged in, trigger the Google login prompt immediately
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedValue()) {
            // If One Tap is suppressed, scroll to the explicit button in the header
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Paths match directory structure from user's file explorer
  const SAMPLE_COMICS = [
    {
      id: "sample-1",
      title: "The Guardian's Resolve",
      alignment: "HERO",
      themeId: "space",
      theme: "Space Opera",
      panels: [
        { id: 1, caption: "Captain Kaelen, vigilant guardian of Sector Gamma, watches over the serene cosmic expanse.", imageUrl: resolveAssetPath("sample-1/sample-1.png") },
        { id: 2, caption: "Suddenly, a critical distress signal shatters the tranquility!", imageUrl: resolveAssetPath("sample-1/sample-2.png") },
        { id: 3, caption: "Duty calls. Kaelen scrambles to his starfighter.", imageUrl: resolveAssetPath("sample-1/sample-3.png") },
        { id: 4, caption: "Outnumbered but unyielding, Kaelen maneuvers through enemy fire.", imageUrl: resolveAssetPath("sample-1/sample-4.png") },
        { id: 5, caption: "With a perfectly timed energy blast, Kaelen cripples the enemy flagship!", imageUrl: resolveAssetPath("sample-1/sample-5.png") },
        { id: 6, caption: "Peace restored, Kaelen looks out at the galaxy once more.", imageUrl: resolveAssetPath("sample-1/sample-6.png") },
      ]
    },
    {
      id: "sample-2",
      title: "The Awakening of the Shadow Queen",
      alignment: "VILLAIN",
      themeId: "mystic",
      theme: "Ancient Mystic",
      panels: [
        { id: 1, caption: "Deep within the Sunken Ziggurat, Elara finally reached the Solar Core.", imageUrl: resolveAssetPath("sample-2/sample-1.png") },
        { id: 2, caption: "For centuries, the mystics called her a heretic. Now, they would call her master.", imageUrl: resolveAssetPath("sample-2/sample-2.png") },
        { id: 3, caption: "She whispered the forbidden incantations, her voice echoing through the hollow halls.", imageUrl: resolveAssetPath("sample-2/sample-3.png") },
        { id: 4, caption: "The Temple Guardians rushed to stop her, but they were far too late.", imageUrl: resolveAssetPath("sample-2/sample-4.png") },
        { id: 5, caption: "The Solar Core shattered, releasing the primordial shadows she had long sought.", imageUrl: resolveAssetPath("sample-2/sample-5.png") },
        { id: 6, caption: "The era of light was over. Her reign had finally begun.", imageUrl: resolveAssetPath("sample-2/sample-6.png") },
      ]
    }
  ];

  const currentSample = SAMPLE_COMICS[currentSampleIndex];
  const currentTheme = THEMES.find(t => t.id === currentSample.themeId);
  const ThemeIcon = currentTheme ? (Icons as any)[currentTheme.icon] || Icons.HelpCircle : Icons.HelpCircle;

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col overflow-x-hidden">
      <style>{`
         .halftone-bg {
           background-image: radial-gradient(rgba(0,0,0,0.05) 2px, transparent 2px);
           background-size: 20px 20px;
         }
       `}</style>
      <AppHeader user={user} onSignOut={() => authService.signOut().then(() => setUser(null))} />

      <section className="relative pt-12 md:pt-20 pb-24 px-6 overflow-hidden halftone-bg">
        <div className="absolute top-10 right-[10%] opacity-10 rotate-12 pointer-events-none hidden lg:block">
          <Zap size={120} className="text-yellow-400 fill-current" />
        </div>
        <div className="absolute bottom-20 left-[5%] opacity-10 -rotate-12 pointer-events-none hidden lg:block">
          <Sword size={100} className="text-red-500" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-tr from-indigo-50/50 via-white/20 to-purple-50/50 -z-10 rotate-12"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs uppercase tracking-widest border border-indigo-200 shadow-sm">
              <Sparkles size={14} />
              <span>Next-Gen Storytelling</span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.95] drop-shadow-sm">
              Forge Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">Superhero Saga</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Turn your selfie into an AI-generated comic strip as the Hero or Villain in 1 of 12 themes.
            </p>
            <div className="flex justify-center lg:justify-start pt-4">
              {loading ? (
                <div className="flex items-center gap-3 text-indigo-600 font-black uppercase tracking-widest bg-white px-6 py-3 rounded-full shadow-lg border border-indigo-100">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Booting Headquarters...</span>
                </div>
              ) : (
                <button
                  onClick={handleAuthAction}
                  className="group relative bg-slate-900 text-white px-10 py-5 rounded-full font-black text-xl shadow-[0_10px_40px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_50px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10">{user ? 'Go to Dashboard' : 'Get Started'}</span>
                  <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
          <div className="relative animate-fade-in delay-200">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[3rem] opacity-20 blur-2xl animate-pulse"></div>
            <HeroComicAnimation />

            <div className="absolute -top-6 -right-6 w-16 h-16 bg-yellow-400 rounded-2xl rotate-12 shadow-xl flex items-center justify-center text-slate-900 font-black text-xl border-4 border-white hidden md:flex">
              ZAP!
            </div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-pink-500 rounded-full -rotate-12 shadow-xl flex items-center justify-center text-white font-black text-sm border-4 border-white hidden md:flex">
              BOOM!
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white overflow-hidden halftone-bg">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight uppercase">Pick Your Universe</h2>
            <div className="w-24 h-2 bg-indigo-600 mx-auto rounded-full"></div>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">From neon-drenched cities to ancient magic, choose the setting for your saga.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {THEMES.map((theme) => {
              const IconComp = (Icons as any)[theme.icon] || Icons.Circle;
              return (
                <button
                  key={theme.id}
                  onClick={handleAuthAction}
                  className="group relative p-6 md:p-8 rounded-[2rem] border-2 border-gray-100 bg-white hover:border-indigo-600 hover:shadow-[12px_12px_0px_0px_rgba(79,70,229,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300 overflow-hidden text-left"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComp size={28} />
                  </div>
                  <h3 className="font-black text-xl text-slate-900 mb-2 uppercase tracking-tight">{theme.name}</h3>
                  <p className="text-slate-500 text-sm font-medium line-clamp-2 leading-relaxed">{theme.description}</p>
                  <div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all">
                    Assemble <ArrowRight size={14} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="sample-comic" className="py-24 px-6 bg-slate-50 border-t border-gray-200 halftone-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter">Featured Chronicles</h2>
            <p className="text-xl text-slate-500 font-medium">Check out samples of legendary tales generated by our engine.</p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 pt-4">
              {SAMPLE_COMICS.map((sample, idx) => (
                <button
                  key={sample.id}
                  onClick={() => setCurrentSampleIndex(idx)}
                  className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all w-full md:w-auto text-center ${currentSampleIndex === idx ? 'bg-slate-900 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] scale-105' : 'bg-white text-slate-400 border border-gray-200 hover:text-slate-600 hover:bg-white'}`}
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-2xl border-4 border-slate-900 relative animate-fade-in" key={currentSample.id}>
            {/* Updated Badge: Displays Alignment + Theme Name */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 border-4 border-slate-900 px-8 py-3 rounded-full shadow-lg z-20 font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
              <ThemeIcon size={20} />
              <span>{currentSample.alignment} • {currentSample.theme}</span>
            </div>

            <div className="text-center mb-16 space-y-4">
              <h3 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter pt-4">
                {currentSample.title}
              </h3>
              <div className="w-16 h-1 bg-slate-900 mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {currentSample.panels.map((panel) => (
                <div key={panel.id} className="group flex flex-col bg-white border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-3 hover:translate-y-3 transition-all">
                  <div style={{ aspectRatio: '4/3' }} className="w-full relative overflow-hidden bg-gray-100">
                    <img
                      src={panel.imageUrl}
                      alt={`Panel ${panel.id}`}
                      className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://placehold.co/800x600/f1f5f9/94a3b8?text=Hero+Panel+${panel.id}`;
                      }}
                    />
                  </div>
                  <div className="p-6 bg-white border-t-4 border-slate-900">
                    <p className="text-slate-800 font-bold italic text-sm md:text-base leading-relaxed">"{panel.caption}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-500 py-20 px-6 mt-auto border-t-8 border-indigo-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-6 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-2xl">H</div>
              <span className="font-black text-2xl tracking-tighter text-white uppercase">HeroGen</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed">The ultimate platform for AI-powered self-transformation into legend. Created with Gemini 3.</p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="flex gap-8 font-black uppercase text-xs tracking-[0.2em] text-slate-400">
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
            </div>
            <p className="text-xs font-medium">&copy; {new Date().getFullYear()} HeroGen Studios. All Rights Reserved.</p>
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
      setComics(userComics.sort((a, b) => b.createdAt - a.createdAt));
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
          <section className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100 text-center space-y-8">
            <div className="max-w-md mx-auto space-y-4">
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Welcome, {user?.name}</h1>
              <h2 className="text-xl font-bold text-indigo-600 uppercase tracking-widest">Identify Yourself</h2>
              <p className="text-slate-500 font-medium">To forge consistent stories, we need to scan your visual identity.</p>
            </div>
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
              <PhotoCapture onPhotoAccepted={handleChangeFace} />
            </Suspense>
          </section>
        ) : (
          <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-10">
            <div className="relative">
              <div className="w-44 h-44 rounded-full overflow-hidden ring-8 ring-indigo-50 shadow-2xl">
                <img src={user.photoUrl} alt="Hero Face" className="w-full h-full object-cover" />
              </div>
              <button onClick={handleDeleteFace} className="absolute bottom-1 right-1 bg-white text-red-600 p-4 rounded-full shadow-lg hover:bg-red-50 transition-colors border-2 border-red-50">
                <Trash2 size={24} />
              </button>
            </div>
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">{user.name}</h2>
              </div>
              <Link to="/create" className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-2xl hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all">
                <Plus size={24} /> Forge New Saga
              </Link>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tight">
              <Calendar size={28} className="text-indigo-600" /> Archive
            </h3>
          </div>
          {comics.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border-4 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <Plus size={40} />
              </div>
              <p className="text-gray-400 font-black uppercase tracking-widest">No sagas recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
              {comics.map(comic => (
                <Link key={comic.id} to={`/comic/${comic.id}`} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-indigo-600">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    {comic.panels[0]?.imageUrl ? (
                      <img src={comic.panels[0].imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={comic.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 bg-slate-50">
                        <Loader2 className="animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-6">
                      <span className="text-white text-sm font-black uppercase tracking-widest">Open Saga</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-black text-slate-900 truncate text-xl uppercase tracking-tight">{comic.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-black uppercase tracking-widest">{comic.alignment}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(comic.createdAt).toLocaleDateString()}</span>
                    </div>
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
      if (!u || !u.photoUrl) { navigate('/dashboard'); return; }
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
    if (aistudio) {
      await aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleGenerate = async (alignment: Alignment) => {
    if (!user || !user.photoUrl || !theme) return;
    setStep('generating');

    try {
      setLoadingMessage("Scanning biometric data...");
      const description = await analyzeImage(user.photoUrl);
      setLoadingMessage("Calculating nexus events...");
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
        setLoadingMessage(`Manifesting Panel ${i + 1} of 6...`);
        try {
          const finishedPanel = await generatePanelImage(user.photoUrl, theme, alignment, script.panels[i]);
          panels[i] = finishedPanel;
          newComic.panels = [...panels];
          await dbService.saveComic(newComic);
        } catch (e: any) {
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
      alert("Saga generation failed. Please try again.");
      setStep('theme');
    }
  };

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 halftone-bg">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl text-center max-w-sm border-4 border-slate-900">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-inner">
            <Key size={40} />
          </div>
          <h2 className="text-3xl font-black mb-4 text-slate-900 uppercase tracking-tighter">Access Denied</h2>
          <p className="mb-10 text-slate-500 font-medium text-sm leading-relaxed">HeroGen requires a validated Gemini API key to manifest your stories in high definition.</p>
          <button onClick={handleKeySelect} className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest w-full shadow-xl hover:bg-indigo-700 transition-all">Connect API Key</button>
          <div className="mt-8">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-600 text-xs font-black uppercase tracking-widest underline hover:text-indigo-800 transition-colors">Documentation</a>
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
        <div className="flex justify-between items-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">New Chronicle</h2>
          <Link to="/dashboard" className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-red-500 transition-colors">Abort Mission</Link>
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

  if (loading) return <LoadingScreen message="Unrolling Saga..." />;
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

  if (loading) return <LoadingScreen message="Retrieving Saga..." />;
  if (!comic) return <div className="min-h-screen flex flex-col items-center justify-center p-20 bg-gray-50 gap-6 halftone-bg">
    <div className="w-24 h-24 bg-white border-4 border-slate-900 rounded-full flex items-center justify-center text-slate-300 shadow-xl">
      <Shield size={48} />
    </div>
    <h2 className="text-4xl font-black text-slate-900 uppercase">Saga Lost</h2>
    <p className="text-slate-500 font-medium text-center max-w-sm">This story has been classified as private or wiped from the archives.</p>
    <Link to="/" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">Head Home</Link>
  </div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">H</div>
            <span className="font-bold text-xl text-slate-900 uppercase tracking-tighter">HeroGen</span>
          </Link>
          <Link to="/" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all">Forge Your Own Saga</Link>
        </div>
      </header>

      <div className="pt-12 halftone-bg">
        <ComicDisplay story={comic} mode="public" />
        <div className="max-w-4xl mx-auto px-4 pb-24 text-center">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-12 md:p-20 shadow-[0_20px_60px_rgba(0,0,0,0.2)] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Want to be the star <br />of your own saga?</h3>
              <p className="text-indigo-200 text-lg font-medium max-w-lg mx-auto">Turn your selfie into an AI-generated comic strip as the Hero or Villain in 1 of 12 themes.</p>
              <div className="pt-4">
                <Link
                  to={user ? "/dashboard" : "/"}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center gap-3 bg-white text-slate-900 px-12 py-5 rounded-2xl font-black text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  {user ? "Go to Dashboard" : "Forge Your Own Saga"} <ArrowRight size={24} />
                </Link>
              </div>
            </div>
          </div>
        </div>
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