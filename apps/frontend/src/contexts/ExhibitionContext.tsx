import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Exhibition {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  startDate: string;
  endDate: string;
}

interface ExhibitionContextType {
  currentExhibition: Exhibition | null;
  setCurrentExhibition: (exhibition: Exhibition) => void;
  exhibitions: Exhibition[];
  isLoading: boolean;
}

const STORAGE_KEY = 'hydexpo_current_exhibition';

const ExhibitionContext = createContext<ExhibitionContextType | undefined>(undefined);

export const ExhibitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: exhibitionsData = [], isLoading } = useQuery({
    queryKey: ['exhibitions'],
    queryFn: async () => {
      const data = await api.get<any[]>('/exhibitions');
      return data.map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        shortName: ex.short_name,
        description: ex.description,
        startDate: ex.start_date,
        endDate: ex.end_date,
      })) as Exhibition[];
    },
  });

  // Initialize from localStorage or default to first exhibition
  const [currentExhibition, setCurrentExhibitionState] = useState<Exhibition | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && exhibitionsData.length > 0) {
      const found = exhibitionsData.find(e => e.id === stored);
      if (found) return found;
    }
    return exhibitionsData.length > 0 ? exhibitionsData[0] : null;
  });

  // Update current exhibition when exhibitions are loaded
  useEffect(() => {
    if (exhibitionsData.length > 0 && !currentExhibition) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const found = exhibitionsData.find(e => e.id === stored);
        if (found) {
          setCurrentExhibitionState(found);
          return;
        }
      }
      setCurrentExhibitionState(exhibitionsData[0]);
    }
  }, [exhibitionsData, currentExhibition]);

  // Persist to localStorage when exhibition changes
  const setCurrentExhibition = (exhibition: Exhibition) => {
    localStorage.setItem(STORAGE_KEY, exhibition.id);
    setCurrentExhibitionState(exhibition);
  };

  // Sync with localStorage on mount (in case of external changes)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && exhibitionsData.length > 0) {
        const found = exhibitionsData.find(ex => ex.id === e.newValue);
        if (found) setCurrentExhibitionState(found);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [exhibitionsData]);

  return (
    <ExhibitionContext.Provider value={{ 
      currentExhibition, 
      setCurrentExhibition,
      exhibitions: exhibitionsData,
      isLoading
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
