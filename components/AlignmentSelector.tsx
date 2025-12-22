import React from 'react';
import { Alignment } from '../types';
import { Shield, Skull } from 'lucide-react';

interface AlignmentSelectorProps {
  onSelect: (alignment: Alignment) => void;
}

const AlignmentSelector: React.FC<AlignmentSelectorProps> = ({ onSelect }) => {
  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-8 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Choose Your Path</h2>
        <p className="text-gray-600">Will you save the world or rule it?</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => onSelect('HERO')}
          className="w-full relative overflow-hidden group p-8 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
            <Shield size={120} />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-3xl font-bold uppercase tracking-wider">Hero</h3>
              <p className="text-blue-100 mt-1">Protector of the innocent</p>
            </div>
            <Shield size={48} />
          </div>
        </button>

        <button
          onClick={() => onSelect('VILLAIN')}
          className="w-full relative overflow-hidden group p-8 rounded-2xl bg-gradient-to-br from-red-600 to-rose-900 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
            <Skull size={120} />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-3xl font-bold uppercase tracking-wider">Villain</h3>
              <p className="text-red-100 mt-1">Conqueror of worlds</p>
            </div>
            <Skull size={48} />
          </div>
        </button>
      </div>
    </div>
  );
};

export default AlignmentSelector;
