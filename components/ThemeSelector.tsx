import React from 'react';
import { THEMES } from '../constants';
import { Theme } from '../types';
import * as Icons from 'lucide-react';

interface ThemeSelectorProps {
  onSelect: (theme: Theme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Choose Your Origin</h2>
        <p className="text-gray-600">Select a universe for your adventure.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {THEMES.map((theme) => {
          // Dynamic icon rendering
          const IconComponent = (Icons as any)[theme.icon] || Icons.HelpCircle;

          return (
            <button
              key={theme.id}
              onClick={() => onSelect(theme)}
              className="group relative flex flex-col items-center p-6 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 text-center overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${theme.color}`} />
              <div className={`p-4 rounded-full bg-gray-50 mb-4 group-hover:bg-gray-100 transition-colors`}>
                <IconComponent className="w-8 h-8 text-gray-700 group-hover:text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{theme.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{theme.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSelector;
