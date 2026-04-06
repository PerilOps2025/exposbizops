import { supabase } from "@/integrations/supabase/client";

export async function generateId(prefix: string, table: string, _idField: string): Promise<string> {
  const { count } = await supabase
    .from(table as any)
    .select('*', { count: 'exact', head: true });
  const num = (count || 0) + 1;
  return `${prefix}-${String(num).padStart(3, '0')}`;
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
