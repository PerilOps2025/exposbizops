import { supabase } from "@/integrations/supabase/client";

let notificationInterval: ReturnType<typeof setInterval> | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

export function getNotificationPermission(): string {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

function showNotification(title: string, body: string, tag?: string) {
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/placeholder.svg", tag, requireInteraction: false });
  } catch {
    // Silent fail on mobile/unsupported
  }
}

async function checkOverdueTasks() {
  try {
    const { data: tasks } = await supabase
      .from("active_tasks")
      .select("task_id, task, due_date, due_time, status, person")
      .in("status", ["Active", "WaitingOn"]);

    if (!tasks) return;
    const now = new Date();

    for (const t of tasks) {
      if (!t.due_date) continue;
      const dueDate = new Date(t.due_date);
      if (t.due_time) {
        const [h, m] = t.due_time.split(":").map(Number);
        dueDate.setHours(h, m, 0, 0);
      } else {
        dueDate.setHours(23, 59, 59, 999);
      }

      if (dueDate < now) {
        showNotification(
          "⚠️ Overdue Task",
          `${t.task}${t.person?.length ? ` — ${t.person.join(", ")}` : ""}`,
          `overdue-${t.task_id}`
        );
      } else {
        // Upcoming: within 30 minutes
        const diff = dueDate.getTime() - now.getTime();
        if (diff > 0 && diff <= 30 * 60 * 1000) {
          showNotification(
            "⏰ Task Due Soon",
            `${t.task} is due in ${Math.ceil(diff / 60000)} minutes`,
            `upcoming-${t.task_id}`
          );
        }
      }
    }
  } catch {
    // Silent fail
  }
}

async function checkUpcomingMeetings() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // We check meeting_log for meetings with scheduled_start within 15 minutes
    const now = new Date();
    const soon = new Date(now.getTime() + 15 * 60 * 1000);

    const { data: meetings } = await supabase
      .from("meeting_log")
      .select("meeting_id, meeting_title, scheduled_start")
      .gte("scheduled_start", now.toISOString())
      .lte("scheduled_start", soon.toISOString());

    for (const m of meetings || []) {
      const start = new Date(m.scheduled_start!);
      const diff = start.getTime() - now.getTime();
      const mins = Math.ceil(diff / 60000);
      showNotification(
        "📅 Meeting Starting Soon",
        `${m.meeting_title || "Meeting"} starts in ${mins} minute${mins !== 1 ? "s" : ""}`,
        `meeting-${m.meeting_id}`
      );
    }
  } catch {
    // Silent fail
  }
}

export function startNotificationPolling() {
  if (notificationInterval) return;
  if (Notification.permission !== "granted") return;

  // Check immediately then every 5 minutes
  checkOverdueTasks();
  checkUpcomingMeetings();

  notificationInterval = setInterval(() => {
    checkOverdueTasks();
    checkUpcomingMeetings();
  }, 5 * 60 * 1000);
}

export function stopNotificationPolling() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}
