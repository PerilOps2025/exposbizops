import { useState } from "react";
import AuthGate from "@/components/AuthGate";
import AppLayout from "@/components/AppLayout";
import RecordTab from "@/components/RecordTab";
import PendingRoom from "@/components/PendingRoom";
import DashboardView from "@/components/dashboard/DashboardView";
import MeetingTab from "@/components/MeetingTab";
import ConfigTab from "@/components/ConfigTab";
import NewTaskModal from "@/components/NewTaskModal";

export default function Index() {
  const [activeTab, setActiveTab] = useState("record");
  const [showNewTask, setShowNewTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  return (
    <AuthGate>
      <AppLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewTask={() => setShowNewTask(true)}
      >
        {activeTab === "record" && (
          <RecordTab onItemsParsed={() => { setActiveTab("pending"); refresh(); }} />
        )}
        {activeTab === "pending" && <PendingRoom key={refreshKey} />}
        {activeTab === "dashboard" && <DashboardView key={refreshKey} />}
        {activeTab === "meeting" && <MeetingTab />}
        {activeTab === "config" && <ConfigTab />}
      </AppLayout>

      <NewTaskModal
        open={showNewTask}
        onClose={() => setShowNewTask(false)}
        onCreated={refresh}
      />
    </AuthGate>
  );
}
