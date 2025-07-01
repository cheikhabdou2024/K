
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type CreateContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const CreateContext = createContext<CreateContextType | undefined>(undefined);

export const CreateProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <CreateContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </CreateContext.Provider>
  );
};

export const useCreate = () => {
  const context = useContext(CreateContext);
  if (context === undefined) {
    throw new Error('useCreate must be used within a CreateProvider');
  }
  return context;
};
