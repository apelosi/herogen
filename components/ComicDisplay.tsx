import React, { useState, useEffect } from 'react';
import { ComicStory, SavedComic } from '../types';
import { Download, Share2, Trash2, Home, Link as LinkIcon, Star, Loader2, Globe, Lock } from 'lucide-react';
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
    const url = `${window.location.origin}/share/${comicId}`;
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
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 animate-fade-in pb-20">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 uppercase tracking-tight">
          {story.title}
        </h1>
        {isGenerating && (
            <p className="text-indigo-600 font-medium mt-2 animate-pulse">
                Bringing your story to life, panel by panel...
            </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {story.panels.map((panel) => (
          <div key={panel.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 flex flex-col">
            <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
              {panel.imageUrl ? (
                  <img src={panel.imageUrl} alt={`Panel ${panel.id}`} className="w-full h-full object-cover animate-fade-in" />
              ) : (
                  <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white to-gray-100 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-indigo-400" size={32} />
                        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Generating Panel {panel.id}</span>
                      </div>
                  </div>
              )}
              
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded z-20">
                #{panel.id}
              </div>
            </div>
            <div className="p-4 bg-white flex-grow flex items-center justify-center text-center z-20 relative">
              <p className="font-medium text-gray-800 font-serif italic">
                "{panel.caption}"
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
        
        {/* Rating Section - Hidden in Public Mode */}
        {mode !== 'public' && (
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-gray-800">Rate this Adventure</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => handleRate(num)}
                  disabled={isGenerating}
                  className={`p-1 transition-all ${rating >= num ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-200'} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Star size={24} fill={rating >= num ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
           {/* Sharing Controls for Owner */}
           {mode === 'owner' && onTogglePublic && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 gap-4">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${isPublic ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                    {isPublic ? <Globe size={20}/> : <Lock size={20}/>}
                 </div>
                 <div className="text-left">
                    <p className="font-bold text-gray-800">{isPublic ? 'Publicly Shared' : 'Private Comic'}</p>
                    <p className="text-xs text-gray-500">{isPublic ? 'Anyone with the link can view.' : 'Only you can see this.'}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isPublic && (
                    <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        <LinkIcon size={16}/>
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                )}
                <button 
                    onClick={() => onTogglePublic(!isPublic)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isPublic ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                    {isPublic ? 'Make Private' : 'Make Public'}
                </button>
              </div>
            </div>
           )}

           <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={downloadPDF}
                disabled={isGenerating}
                className={`flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-colors ${isGenerating ? 'opacity-50 cursor-not-allowed bg-indigo-400' : 'hover:bg-indigo-700'}`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Download size={20} />}
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </button>

              {mode === 'owner' && onDelete && (
                <button
                    onClick={() => {
                        if(window.confirm("Are you sure you want to delete this comic forever?")) onDelete();
                    }}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors"
                >
                    <Trash2 size={20} />
                    Delete
                </button>
              )}

              {mode === 'creation' && onRestart && (
                 <button onClick={onRestart} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50">
                    Start Over
                 </button>
              )}

              {mode !== 'public' && (
                <Link to="/dashboard" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-900">
                    <Home size={20} />
                    Dashboard
                </Link>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ComicDisplay;