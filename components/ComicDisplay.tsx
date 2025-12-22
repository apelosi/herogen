import React, { useState, useEffect } from 'react';
import { ComicStory, SavedComic } from '../types';
import { Download, Share2, Trash2, Home, Link as LinkIcon, Star, Loader2, Globe, Lock, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import { Link } from 'react-router-dom';

interface ComicDisplayProps {
  story: ComicStory;
  mode: 'creation' | 'owner' | 'public';
  comicId?: string;
  isPublic?: boolean;
  onRate?: (rating: number) => void;
  onDelete?: () => void;
  onTogglePublic?: (isPublic: boolean) => void;
  onRestart?: () => void; // Used only in creation mode
}

const ComicDisplay: React.FC<ComicDisplayProps> = ({ 
  story, 
  mode, 
  comicId, 
  isPublic = false,
  onRate, 
  onDelete, 
  onTogglePublic, 
  onRestart 
}) => {
  const [rating, setRating] = useState<number>(story.rating || 0);
  const [copied, setCopied] = useState(false);

  // Check if all panels are loaded
  const isGenerating = story.panels.some(p => !p.imageUrl);

  useEffect(() => {
    if (story.rating) setRating(story.rating);
  }, [story.rating]);

  const handleRate = (num: number) => {
    setRating(num);
    if (onRate) onRate(num);
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/#/share/${comicId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = () => {
    if (isGenerating) {
        alert("Please wait for all panels to finish generating.");
        return;
    }

    const doc = new jsPDF();
    
    // Add Title
    doc.setFontSize(22);
    doc.text(story.title, 105, 20, { align: 'center' });

    let xOffset = 20;
    let yOffset = 30;
    const panelWidth = 80;
    const panelHeight = 80;
    const textSpace = 35; // Space for caption
    const colGap = 15;
    const rowGap = 15;
    const pageHeight = 297; // A4 height in mm
    const bottomMargin = 20;

    story.panels.forEach((panel, index) => {
      const col = index % 2;
      const x = xOffset + (col * (panelWidth + colGap));
      if (index > 0 && index % 2 === 0) {
        yOffset += panelHeight + textSpace + rowGap;
      }
      if (yOffset + panelHeight + textSpace > pageHeight - bottomMargin) {
        doc.addPage();
        yOffset = 20; 
      }
      
      try {
        if (panel.imageUrl) {
            doc.addImage(panel.imageUrl, 'PNG', x, yOffset, panelWidth, panelHeight);
        }
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(panel.caption, panelWidth);
        doc.text(splitText, x, yOffset + panelHeight + 5);
      } catch (err) {
        console.error("Error adding image to PDF", err);
      }
    });

    doc.save(`${story.title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 animate-fade-in pb-24">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 uppercase tracking-tighter">
          {story.title}
        </h1>
        {isGenerating && (
            <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold mt-2 animate-pulse">
                <Loader2 className="animate-spin" size={18} />
                <span>Bringing your saga to life, panel by panel...</span>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
        {story.panels.map((panel) => (
          <div key={panel.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-slate-900 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col transition-transform hover:-translate-y-1">
            <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
              {panel.imageUrl ? (
                  <img src={panel.imageUrl} alt={`Panel ${panel.id}`} className="w-full h-full object-cover animate-fade-in" />
              ) : (
                  <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-gray-400 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center">
                           <Loader2 className="animate-spin text-indigo-400" size={32} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Rendering Panel {panel.id}</span>
                      </div>
                  </div>
              )}
              
              <div className="absolute top-4 left-4 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full z-20 shadow-lg tracking-widest">
                PNL #{panel.id}
              </div>
            </div>
            <div className="p-6 bg-white flex-grow flex items-center justify-center text-center z-20 relative border-t-2 border-slate-900">
              <p className="font-bold text-slate-800 font-serif italic text-lg leading-relaxed">
                "{panel.caption}"
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100 space-y-8">
        
        {/* Rating Section - Hidden in Public Mode */}
        {mode !== 'public' && (
          <div className="text-center space-y-4">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-wider">Rate this Epic</h3>
            <div className="flex justify-center gap-1 sm:gap-3 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => handleRate(num)}
                  disabled={isGenerating}
                  className={`p-1.5 transition-all transform hover:scale-125 ${rating >= num ? 'text-yellow-400' : 'text-gray-200'} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Star size={28} fill={rating >= num ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-6">
           {/* Sharing Controls for Owner */}
           {mode === 'owner' && onTogglePublic && (
            <div className="flex flex-col md:flex-row items-center justify-between bg-indigo-50/50 p-6 rounded-[1.5rem] border border-indigo-100 gap-6">
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isPublic ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>
                    {isPublic ? <Globe size={24}/> : <Lock size={24}/>}
                 </div>
                 <div className="text-left">
                    <p className="font-black text-slate-900 uppercase text-sm tracking-wide">{isPublic ? 'Public Saga' : 'Private Chronicle'}</p>
                    <p className="text-xs text-slate-500 font-medium">{isPublic ? 'Visible to anyone with the link.' : 'Only visible to your account.'}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                {isPublic && (
                    <button 
                        onClick={copyToClipboard}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 text-indigo-600 font-bold bg-white px-5 py-3 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-200 shadow-sm"
                    >
                        <LinkIcon size={18}/>
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                )}
                <button 
                    onClick={() => onTogglePublic(!isPublic)}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all shadow-md ${isPublic ? 'bg-white text-slate-700 border border-gray-200 hover:bg-gray-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                    {isPublic ? 'Make Private' : 'Go Public'}
                </button>
              </div>
            </div>
           )}

           <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={downloadPDF}
                disabled={isGenerating}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 hover:scale-105 active:scale-95'}`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Download size={20} />}
                {isGenerating ? 'Forging...' : 'Download PDF'}
              </button>

              {mode === 'owner' && (
                <Link 
                  to="/dashboard" 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                >
                    <ArrowLeft size={18} />
                    Dashboard
                </Link>
              )}

              {mode === 'owner' && onDelete && (
                <button
                    onClick={() => {
                        if(window.confirm("Are you sure you want to delete this saga forever?")) onDelete();
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest p-4 hover:text-red-700 transition-colors"
                >
                    <Trash2 size={18} />
                    Delete Saga
                </button>
              )}

              {mode === 'creation' && onRestart && (
                 <button onClick={onRestart} className="flex-1 sm:flex-none flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-slate-900 font-black text-sm uppercase tracking-widest text-slate-900 hover:bg-slate-50">
                    Start Over
                 </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ComicDisplay;