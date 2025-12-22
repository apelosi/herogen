import { Theme } from './types';

export const THEMES: Theme[] = [
  { id: 'cyberpunk', name: 'Cyberpunk Neon', description: 'High-tech low-life in a neon city.', icon: 'Zap', color: 'from-pink-500 to-purple-600' },
  { id: 'mystic', name: 'Ancient Mystic', description: 'Sorcery and ancient ruins.', icon: 'Sparkles', color: 'from-purple-500 to-indigo-600' },
  { id: 'space', name: 'Space Opera', description: 'Intergalactic battles and starships.', icon: 'Rocket', color: 'from-blue-600 to-cyan-400' },
  { id: 'steampunk', name: 'Steampunk Gear', description: 'Steam-powered brass machinery.', icon: 'Settings', color: 'from-amber-600 to-orange-500' },
  { id: 'ninja', name: 'Ninja Shadow', description: 'Stealth and martial arts in the shadows.', icon: 'Sword', color: 'from-zinc-700 to-black' },
  { id: 'elemental', name: 'Elemental Nature', description: 'Wielding the forces of nature.', icon: 'Leaf', color: 'from-green-500 to-emerald-700' },
  { id: 'noir', name: 'Noir Detective', description: 'Gritty mysteries in black and white.', icon: 'Search', color: 'from-gray-600 to-gray-900' },
  { id: 'galactic', name: 'Galactic Guardian', description: 'Defending the galaxy from tyrants.', icon: 'Shield', color: 'from-blue-500 to-blue-700' },
  { id: 'medieval', name: 'Medieval Knight', description: 'Swords, shields, and dragons.', icon: 'Castle', color: 'from-red-600 to-red-800' },
  { id: 'urban', name: 'Urban Vigilante', description: 'Protecting the streets at night.', icon: 'Building', color: 'from-slate-600 to-slate-800' },
  { id: 'mutant', name: 'Mutant X', description: 'Genetic mutations and super powers.', icon: 'Dna', color: 'from-yellow-400 to-green-500' },
  { id: 'mecha', name: 'Tech Mecha', description: 'Piloting giant robot suits.', icon: 'Cpu', color: 'from-cyan-600 to-blue-600' },
];

export const STEP_ORDER = ['photo-capture', 'theme-selection', 'alignment-selection', 'generating', 'result'];
