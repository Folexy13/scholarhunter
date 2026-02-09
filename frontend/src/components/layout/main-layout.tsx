"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
