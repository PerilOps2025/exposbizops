import { useEffect, useState } from "react";
import { AlertCircle, Clock, Unlock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getPriorityEmoji, getStatusColor, isOverdue } from "@/lib/supabase-helpers";
import TaskCard from "./TaskCard";

export default function PulseView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('active_tasks')
      .select('*')
      .in('status', ['Active', 'Overdue', 'WaitingOn', 'Blocked'])
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true });
    
    const sorted = (data || []).sort((a, b) => {
      const aOverdue = isOverdue(a.due_date, a.status) ? 0 : 1;
      const bOverdue = isOverdue(b.due_date, b.status) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      const pOrder: Record<string, number> = { High: 0, Med: 1, Low: 2 };
      return (pOrder[a.priority || 'Med'] || 1) - (pOrder[b.priority || 'Med'] || 1);
    });
    setTasks(sorted);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const overdueTasks = tasks.filter(t => isOverdue(t.due_date, t.status));
  const waitingTasks = tasks.filter(t => t.status === 'WaitingOn');
  const highPriority = tasks.filter(t => t.priority === 'High' && !isOverdue(t.due_date, t.status));
  const otherTasks = tasks.filter(t => t.priority !== 'High' && !isOverdue(t.due_date, t.status) && t.status !== 'WaitingOn');

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold">The Pulse</h3>

      {overdueTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <h4 className="text-sm font-semibold text-destructive">Overdue ({overdueTasks.length})</h4>
          </div>
          <div className="space-y-2">
            {overdueTasks.map(t => <TaskCard key={t.id} task={t} showOverdue onTaskCompleted={fetchTasks} />)}
          </div>
        </div>
      )}

      {waitingTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-warning" />
            <h4 className="text-sm font-semibold text-warning">Waiting On ({waitingTasks.length})</h4>
          </div>
          <div className="space-y-2">
            {waitingTasks.map(t => <TaskCard key={t.id} task={t} onTaskCompleted={fetchTasks} />)}
          </div>
        </div>
      )}

      {highPriority.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">🔴 High Priority ({highPriority.length})</h4>
          <div className="space-y-2">
            {highPriority.map(t => <TaskCard key={t.id} task={t} onTaskCompleted={fetchTasks} />)}
          </div>
        </div>
      )}

      {otherTasks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Active Tasks ({otherTasks.length})</h4>
          <div className="space-y-2">
            {otherTasks.map(t => <TaskCard key={t.id} task={t} onTaskCompleted={fetchTasks} />)}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>All clear! No active tasks.</p>
        </Card>
      )}
    </div>
  );
}
