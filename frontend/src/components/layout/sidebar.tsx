"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Award,
  FileText,
  MessageSquare,
  BookOpen,
  Users,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Scholarship, scholarshipsApi } from "@/lib/api";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Top Matches", href: "/matches", icon: Award },
  { name: "Applications", href: "/applications", icon: FileText },
  { name: "Interview Prep", href: "/interview-prep", icon: MessageSquare },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "Profile Setup", href: "/profile", icon: Users },
];

interface DisplayedMatch extends Scholarship {
  percentage: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const [quickMatches, setQuickMatches] = useState<Scholarship[]>([]);
  const [displayedMatches, setDisplayedMatches] = useState<DisplayedMatch[]>([]);

  useEffect(() => {
    const fetchQuickMatches = async () => {
      try {
        const matches = await scholarshipsApi.getMatches();
        if (Array.isArray(matches)) {
          setQuickMatches(matches);
          // Initial 2 random
          if (matches.length > 0) {
            const shuffled = [...matches]
              .sort(() => 0.5 - Math.random())
              .slice(0, 2)
              .map(m => ({
                ...m,
                percentage: Math.floor(Math.random() * 15) + 80
              }));
            setDisplayedMatches(shuffled);
          }
        }
      } catch (e) {
        console.error("Sidebar: failed to fetch quick matches", e);
      }
    };
    fetchQuickMatches();
  }, []);

  useEffect(() => {
    if (quickMatches.length <= 2) return;

    const interval = setInterval(() => {
      const shuffled = [...quickMatches]
        .sort(() => 0.5 - Math.random())
        .slice(0, 2)
        .map(m => ({
          ...m,
          percentage: Math.floor(Math.random() * 15) + 80
        }));
      setDisplayedMatches(shuffled);
    }, 15000); // Change every 15s

    return () => clearInterval(interval);
  }, [quickMatches]);

  return (
    <aside className="w-80 border-r border-border flex flex-col bg-card shrink-0 hidden xl:flex">
      <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Access Section */}
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 px-3 flex items-center justify-between">
            Quick Access
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </h3>
          <div className="flex flex-col gap-2">
            {displayedMatches.length > 0 ? (
              displayedMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <QuickMatchCard 
                    name={match.name} 
                    percentage={match.percentage} 
                  />
                </Link>
              ))
            ) : (
              <div className="px-3 py-4 border rounded-xl border-dashed flex flex-col items-center gap-2 opacity-50">
                <Search className="h-4 w-4" />
                <p className="text-[10px] text-center font-medium">Scanning for instant matches...</p>
              </div>
            )}
          </div>
        </div>

        {/* Agent Health Widget */}
        <div className="mt-auto pt-6">
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <p className="text-xs font-medium text-primary mb-1 uppercase">Agent Health</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Active Scanning</span>
              <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-bold">
                LIVE
              </span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full mb-4">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: "65%" }}></div>
            </div>
            <Button className="w-full shadow-lg shadow-primary/20">Update Profile</Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function QuickMatchCard({ name, percentage }: { name: string; percentage: number }) {
  const circumference = 2 * Math.PI * 17;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/50 transition-all cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <svg className="h-10 w-10 transform -rotate-90">
            <circle
              className="text-muted"
              cx="20"
              cy="20"
              fill="transparent"
              r="17"
              stroke="currentColor"
              strokeWidth="3"
            />
            <circle
              className="text-primary"
              cx="20"
              cy="20"
              fill="transparent"
              r="17"
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeWidth="3"
            />
          </svg>
          <span className="absolute text-[9px] font-bold">{percentage}%</span>
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-semibold truncate">{name}</p>
        </div>
      </div>
      <span className="material-symbols-outlined text-muted-foreground text-sm">
        open_in_new
      </span>
    </div>
  );
}
