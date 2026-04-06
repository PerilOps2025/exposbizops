import { useState } from "react";
import { cn } from "@/lib/utils";
import PulseView from "./PulseView";
import TeamFollowUpView from "./TeamFollowUpView";
import DecisionFeedView from "./DecisionFeedView";
import UpcomingTasksView from "./UpcomingTasksView";
import TeamLoadView from "./TeamLoadView";
import GlobalSearch from "./GlobalSearch";

const views = [
  { id: "pulse", label: "Pulse" },
  { id: "followup", label: "Follow-up" },
  { id: "decisions", label: "Decisions" },
  { id: "upcoming", label: "Upcoming" },
  { id: "load", label: "Load" },
];

export default function DashboardView() {
  const [activeView, setActiveView] = useState("pulse");

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Search */}
      <GlobalSearch />

      {/* View Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {views.map(v => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              activeView === v.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* View Content */}
      {activeView === "pulse" && <PulseView />}
      {activeView === "followup" && <TeamFollowUpView />}
      {activeView === "decisions" && <DecisionFeedView />}
      {activeView === "upcoming" && <UpcomingTasksView />}
      {activeView === "load" && <TeamLoadView />}
    </div>
  );
}
