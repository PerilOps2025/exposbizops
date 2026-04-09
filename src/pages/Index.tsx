import { useState, useEffect } from "react";
import AuthGate from "@/components/AuthGate";
import AppLayout from "@/components/AppLayout";
import RecordTab from "@/components/RecordTab";
import PendingRoom from "@/components/PendingRoom";
import DashboardView from "@/components/dashboard/DashboardView";
import MeetingTab from "@/components/MeetingTab";
import ConfigTab from "@/components/ConfigTab";
import NewItemModal from "@/components/NewItemModal";
import HowsMyDay from "@/components/HowsMyDay";
import { requestNotificationPermission, startNotificationPolling } from "@/lib/notifications";

export default function Index() {
  const [activeTab, setActiveTab] = useState("today");
  const [showNewItem, setShowNewItem] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    requestNotificationPermission().then(granted => {
      if (granted) startNotificationPolling();
    });
  }, []);

  return (
    <AuthGate>
      <AppLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewTask={() => setShowNewItem(true)}
      >
        {activeTab === "today" && <HowsMyDay key={refreshKey} onNavigate={setActiveTab} />}
        {activeTab === "record" && (
          <RecordTab onItemsParsed={() => { setActiveTab("pending"); refresh(); }} />
        )}
        {activeTab === "pending" && <PendingRoom key={refreshKey} />}
        {activeTab === "dashboard" && <DashboardView key={refreshKey} />}
        {activeTab === "meeting" && <MeetingTab />}
        {activeTab === "config" && <ConfigTab />}
      </AppLayout>

      <NewItemModal
        open={showNewItem}
        onClose={() => setShowNewItem(false)}
        onCreated={refresh}
      />
    </AuthGate>
  );
}
