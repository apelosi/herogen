import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Forging Your Legend..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
        <div className="relative bg-white p-4 rounded-full shadow-xl">
          <Loader2 size={48} className="text-indigo-600 animate-spin" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{message}</h2>
        <p className="text-gray-600 mt-2 max-w-xs mx-auto">
          The AI is working its magic.
        </p>
      </div>
      <div className="w-full max-w-xs bg-gray-200 h-2 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600 animate-pulse w-2/3 rounded-full"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;