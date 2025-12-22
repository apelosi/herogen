export type AppStep = 
  | 'photo-capture' 
  | 'theme-selection' 
  | 'alignment-selection' 
  | 'generating' 
  | 'result';

export interface Theme {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export type Alignment = 'HERO' | 'VILLAIN';

export interface ComicPanel {
  id: number;
  imageUrl: string;
  caption: string;
}

export interface ComicStory {
  title: string;
  panels: ComicPanel[];
  rating?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null; // The "Hero Face"
}

export interface SavedComic {
  id: string;
  userId: string;
  title: string;
  panels: ComicPanel[];
  themeId: string;
  alignment: Alignment;
  rating: number;
  isPublic: boolean;
  createdAt: number;
}