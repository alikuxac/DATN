"use client";

import React from "react";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { Toaster } from "sonner";
import { PreferenceSync } from "./PreferenceSync";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <SocketProvider>
            <PreferenceSync />
            {children}
            <Toaster />
          </SocketProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ReactQueryProvider>
  );
}
