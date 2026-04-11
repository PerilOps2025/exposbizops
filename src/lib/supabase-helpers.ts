import { supabase } from "@/integrations/supabase/client";

export async function generateId(prefix: string, _table: string, _idField: string): Promise<string> {
  // Use timestamp + random to guarantee uniqueness (no more count-based collisions)
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `${prefix}-${ts}-${rand}`;
}

export function getPriorityColor(priority: string | null) {
  switch (priority) {
    case 'High': return 'priority-high';
    case 'Med': return 'priority-med';
    case 'Low': return 'priority-low';
    default: return 'priority-med';
  }
}

export function getPriorityEmoji(priority: string | null) {
  switch (priority) {
    case 'High': return '🔴';
    case 'Med': return '🟡';
    case 'Low': return '🟢';
    default: return '🟡';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'Active': return 'bg-primary/10 text-primary';
    case 'WaitingOn': return 'bg-warning/10 text-warning';
    case 'Blocked': return 'bg-destructive/10 text-destructive';
    case 'Done': return 'bg-success/10 text-success';
    case 'Overdue': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'Done') return false;
  return new Date(dueDate) < new Date();
}
