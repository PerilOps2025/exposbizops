import { useState } from "react";
import { Mic, Inbox, LayoutDashboard, Calendar, Settings, Plus, Menu, X, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewTask: () => void;
}

const navItems = [
  { id: "today", label: "My Day", icon: Sun },
  { id: "record", label: "Record", icon: Mic },
  { id: "pending", label: "Pending", icon: Inbox },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "meeting", label: "Meeting", icon: Calendar },
  { id: "config", label: "Config", icon: Settings },
];

export default function AppLayout({ children, activeTab, onTabChange, onNewTask }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6 cursor-pointer" onClick={() => onTabChange("today")}>
          <h1 className="text-xl font-bold text-sidebar-primary-foreground tracking-tight">
            <span className="text-sidebar-primary">Ex</span>POS
          </h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Executive Personal OS</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3">
          <Button onClick={onNewTask} className="w-full gap-2" size="sm">
            <Plus className="w-4 h-4" /> New Item
          </Button>
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40">ExPOS v1.0.0</p>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-sidebar flex flex-col">
            <div className="p-4 flex items-center justify-between">
              <h1 className="text-lg font-bold text-sidebar-primary-foreground cursor-pointer" onClick={() => { onTabChange("today"); setSidebarOpen(false); }}>
                <span className="text-sidebar-primary">Ex</span>POS
              </h1>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-sidebar-foreground" />
              </button>
            </div>
            <nav className="flex-1 px-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onTabChange(item.id); setSidebarOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === item.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold cursor-pointer" onClick={() => onTabChange("today")}>
            <span className="text-primary">Ex</span>POS
          </h1>
          <button onClick={onNewTask}>
            <Plus className="w-5 h-5 text-primary" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Mobile bottom tabs */}
        <nav className="md:hidden flex items-center justify-around border-t border-border bg-card py-2 px-1">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                activeTab === item.id
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
