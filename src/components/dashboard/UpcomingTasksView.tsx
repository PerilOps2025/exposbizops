import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { addDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import TaskCard from "./TaskCard";

export default function UpcomingTasksView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('active_tasks')
        .select('*')
        .neq('status', 'Done')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });
      setTasks(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const now = new Date();
  const tomorrow = addDays(startOfDay(now), 1);
  const endTomorrow = endOfDay(tomorrow);
  const endNext3 = endOfDay(addDays(now, 3));
  const endWeek = endOfDay(addDays(now, 7));

  const priorityOrder: Record<string, number> = { High: 0, Med: 1, Low: 2 };
  const sortByPriority = (a: any, b: any) =>
    (priorityOrder[a.priority || 'Med'] || 1) - (priorityOrder[b.priority || 'Med'] || 1);

  const tomorrowTasks = tasks
    .filter(t => {
      const d = new Date(t.due_date);
      return isBefore(d, endTomorrow) && isAfter(d, startOfDay(now));
    })
    .sort(sortByPriority);

  const next3Tasks = tasks
    .filter(t => {
      const d = new Date(t.due_date);
      return isAfter(d, endTomorrow) && isBefore(d, endNext3);
    })
    .sort(sortByPriority);

  const weekTasks = tasks
    .filter(t => {
      const d = new Date(t.due_date);
      return isAfter(d, endNext3) && isBefore(d, endWeek);
    })
    .sort(sortByPriority);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  const Column = ({ title, items }: { title: string; items: any[] }) => (
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">{title}</h4>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
        ) : (
          items.map(t => <TaskCard key={t.id} task={t} />)
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Upcoming Tasks</h3>
      <div className="flex flex-col md:flex-row gap-6">
        <Column title="Tomorrow" items={tomorrowTasks} />
        <Column title="Next 3 Days" items={next3Tasks} />
        <Column title="This Week" items={weekTasks} />
      </div>
    </div>
  );
}
