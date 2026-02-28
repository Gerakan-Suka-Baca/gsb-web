"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ExamNavbarContextType {
  examNavbarContent: ReactNode | null;
  setExamNavbarContent: (content: ReactNode | null) => void;
}

const ExamNavbarContext = createContext<ExamNavbarContextType>({
  examNavbarContent: null,
  setExamNavbarContent: () => {},
});

export function ExamNavbarProvider({ children }: { children: ReactNode }) {
  const [examNavbarContent, setExamNavbarContent] = useState<ReactNode | null>(null);
  return (
    <ExamNavbarContext.Provider value={{ examNavbarContent, setExamNavbarContent }}>
      {children}
    </ExamNavbarContext.Provider>
  );
}

export function useExamNavbar() {
  return useContext(ExamNavbarContext);
}
