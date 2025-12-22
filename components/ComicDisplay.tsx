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

    // Add copyright notice to the bottom of the 2nd page if it exists
    const totalPages = doc.internal.getNumberOfPages();
    if (totalPages >= 2) {
      doc.setPage(2);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("© 2025 HeroGen Studios. All Rights Reserved.", 105, pageHeight - 10, { align: 'center' });
    }

    doc.save(`${story.title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-12 animate-fade-in pb-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 uppercase tracking-tighter leading-tight pb-2">
          {story.title}
        </h1>
        {isGenerating && (
            <div className="flex items-center justify-center gap-3 text-indigo-600 font-black uppercase tracking-widest text-sm animate-pulse">
                <Loader2 className="animate-spin" size={20} />
                <span>Manifesting Reality...</span>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
        {story.panels.map((panel) => (
          <div key={panel.id} className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
            <div className="relative aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
              {panel.imageUrl ? (
                  <img src={panel.imageUrl} alt={`Panel ${panel.id}`} className="w-full h-full object-cover animate-fade-in" />
              ) : (
                  <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-gray-400 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                      <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center border-2 border-slate-100">
                           <Loader2 className="animate-spin text-indigo-400" size={40} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Rendering Scene</span>
                      </div>
                  </div>
              )}
            </div>
            <div className="p-8 bg-white flex-grow flex items-center justify-center text-center z-20 relative border-t-4 border-slate-900">
              <p className="font-black text-slate-800 font-serif italic text-lg md:text-xl leading-relaxed">
                "{panel.caption}"
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-[3rem] shadow-2xl p-10 border-4 border-slate-900 space-y-10">
        
        {/* Rating Section - Hidden in Public Mode */}
        {mode !== 'public' && (
          <div className="text-center space-y-6">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Rate this Epic</h3>
            <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => handleRate(num)}
                  disabled={isGenerating}
                  className={`p-1 transition-all transform hover:scale-125 ${rating >= num ? 'text-yellow-400' : 'text-gray-200'} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Star size={32} fill={rating >= num ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-8">
           {/* Sharing Controls for Owner */}
           {mode === 'owner' && onTogglePublic && (
            <div className="flex flex-col md:flex-row items-center justify-between bg-indigo-50/50 p-8 rounded-[2rem] border-2 border-indigo-100 gap-8">
              <div className="flex items-center gap-6">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isPublic ? 'bg-indigo-600 text-white' : 'bg-white text-gray-300 border-2 border-gray-100'}`}>
                    {isPublic ? <Globe size={28}/> : <Lock size={28}/>}
                 </div>
                 <div className="text-left">
                    <p className="font-black text-slate-900 uppercase text-lg tracking-tight">{isPublic ? 'Saga Public' : 'Classified Saga'}</p>
                    <p className="text-sm text-slate-500 font-medium">{isPublic ? 'The link below is now live.' : 'Only your eyes can see this.'}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                {isPublic && (
                    <button 
                        onClick={copyToClipboard}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-xs bg-white px-6 py-4 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border-2 border-indigo-100 shadow-sm"
                    >
                        <LinkIcon size={18}/>
                        {copied ? 'Copied' : 'Copy Link'}
                    </button>
                )}
                <button 
                    onClick={() => onTogglePublic(!isPublic)}
                    className={`flex-1 md:flex-none px-8 py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all shadow-xl ${isPublic ? 'bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-50' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                >
                    {isPublic ? 'Restrict Access' : 'Go Public'}
                </button>
              </div>
            </div>
           )}

           <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={downloadPDF}
                disabled={isGenerating}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 hover:scale-105 active:scale-95'}`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={24}/> : <Download size={24} />}
                {isGenerating ? 'Processing' : 'Download PDF'}
              </button>

              {mode === 'owner' && (
                <Link 
                  to="/dashboard" 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                >
                    <ArrowLeft size={20} />
                    Back to HQ
                </Link>
              )}

              {mode === 'owner' && onDelete && (
                <button
                    onClick={() => {
                        if(window.confirm("Delete this chronicle forever? This cannot be undone.")) onDelete();
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest p-5 hover:text-red-700 transition-colors"
                >
                    <Trash2 size={20} />
                    Erase
                </button>
              )}

              {mode === 'creation' && onRestart && (
                 <button onClick={onRestart} className="flex-1 sm:flex-none flex items-center gap-2 px-10 py-5 rounded-2xl border-4 border-slate-900 font-black text-sm uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all">
                    Reset Reality
                 </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ComicDisplay;