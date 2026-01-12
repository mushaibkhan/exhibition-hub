import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Exhibition {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  startDate: string;
  endDate: string;
}

// Define available exhibitions
export const EXHIBITIONS: Exhibition[] = [
  {
    id: 'kings-crown-business',
    name: 'Kings Crown Business Expo',
    shortName: 'KC Business',
    description: 'Premier business exhibition showcasing industry leaders',
    startDate: '2024-03-15',
    endDate: '2024-03-18',
  },
  {
    id: 'kings-crown-education',
    name: 'Kings Crown Education Expo',
    shortName: 'KC Education',
    description: 'Educational institutions and career opportunities fair',
    startDate: '2024-04-10',
    endDate: '2024-04-12',
  },
  {
    id: 'charminar-business',
    name: 'Charminar Business Expo',
    shortName: 'Charminar',
    description: 'Traditional and modern business showcase at Charminar',
    startDate: '2024-05-20',
    endDate: '2024-05-23',
  },
];

interface ExhibitionContextType {
  currentExhibition: Exhibition;
  setCurrentExhibition: (exhibition: Exhibition) => void;
  exhibitions: Exhibition[];
}

const STORAGE_KEY = 'hydexpo_current_exhibition';

const ExhibitionContext = createContext<ExhibitionContextType | undefined>(undefined);

export const ExhibitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from localStorage or default to first exhibition
  const [currentExhibition, setCurrentExhibitionState] = useState<Exhibition>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = EXHIBITIONS.find(e => e.id === stored);
      if (found) return found;
    }
    return EXHIBITIONS[0];
  });

  // Persist to localStorage when exhibition changes
  const setCurrentExhibition = (exhibition: Exhibition) => {
    localStorage.setItem(STORAGE_KEY, exhibition.id);
    setCurrentExhibitionState(exhibition);
  };

  // Sync with localStorage on mount (in case of external changes)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const found = EXHIBITIONS.find(ex => ex.id === e.newValue);
        if (found) setCurrentExhibitionState(found);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ExhibitionContext.Provider value={{ 
      currentExhibition, 
      setCurrentExhibition,
      exhibitions: EXHIBITIONS 
    }}>
      {children}
    </ExhibitionContext.Provider>
  );
};

export const useExhibition = () => {
  const context = useContext(ExhibitionContext);
  if (!context) {
    throw new Error('useExhibition must be used within an ExhibitionProvider');
  }
  return context;
};
