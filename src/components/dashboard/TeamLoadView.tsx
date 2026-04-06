import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getPriorityEmoji } from "@/lib/supabase-helpers";
import TaskCard from "./TaskCard";

export default function TeamLoadView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('active_tasks')
        .select('*')
        .neq('status', 'Done')
        .order('priority');
      setTasks(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  // Team stats
  const teamStats: Record<string, { total: number; high: number; med: number; low: number }> = {};
  tasks.forEach(t => {
    const team = t.team || 'Unassigned';
    if (!teamStats[team]) teamStats[team] = { total: 0, high: 0, med: 0, low: 0 };
    teamStats[team].total++;
    if (t.priority === 'High') teamStats[team].high++;
    else if (t.priority === 'Med') teamStats[team].med++;
    else teamStats[team].low++;
  });

  // Person stats
  const personStats: Record<string, { total: number; high: number; med: number; low: number; team: string }> = {};
  tasks.forEach(t => {
    (t.person || []).forEach((p: string) => {
      if (!personStats[p]) personStats[p] = { total: 0, high: 0, med: 0, low: 0, team: t.team || '' };
      personStats[p].total++;
      if (t.priority === 'High') personStats[p].high++;
      else if (t.priority === 'Med') personStats[p].med++;
      else personStats[p].low++;
    });
  });

  const maxTeamCount = Math.max(...Object.values(teamStats).map(s => s.total), 1);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Team Load */}
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-4">Team Load</h3>
          <div className="space-y-3">
            {Object.entries(teamStats).sort((a, b) => b[1].total - a[1].total).map(([team, stats]) => (
              <div key={team}>
                <button
                  onClick={() => setExpandedTeam(expandedTeam === team ? null : team)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{team}</span>
                    <span className="text-xs text-muted-foreground">
                      {stats.total} {stats.high > 0 && `🔴${stats.high}`} {stats.med > 0 && `🟡${stats.med}`} {stats.low > 0 && `🟢${stats.low}`}
                    </span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                    {stats.high > 0 && (
                      <div className="bg-destructive" style={{ width: `${(stats.high / maxTeamCount) * 100}%` }} />
                    )}
                    {stats.med > 0 && (
                      <div className="bg-warning" style={{ width: `${(stats.med / maxTeamCount) * 100}%` }} />
                    )}
                    {stats.low > 0 && (
                      <div className="bg-success" style={{ width: `${(stats.low / maxTeamCount) * 100}%` }} />
                    )}
                  </div>
                </button>
                {expandedTeam === team && (
                  <div className="mt-2 space-y-2 pl-2 border-l-2 border-primary/20">
                    {tasks.filter(t => (t.team || 'Unassigned') === team).map(t => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {Object.keys(teamStats).length === 0 && (
              <Card className="p-6 text-center text-muted-foreground text-sm">No team data</Card>
            )}
          </div>
        </div>

        {/* Person View */}
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-4">Person Load</h3>
          <div className="space-y-2">
            {Object.entries(personStats).sort((a, b) => b[1].total - a[1].total).map(([person, stats]) => (
              <div key={person}>
                <button
                  onClick={() => setExpandedPerson(expandedPerson === person ? null : person)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium">{person}</span>
                    {stats.team && <span className="text-xs text-muted-foreground ml-2">{stats.team}</span>}
                  </div>
                  <span className="text-xs">
                    {stats.total} {stats.high > 0 && `🔴${stats.high}`} {stats.med > 0 && `🟡${stats.med}`}
                  </span>
                </button>
                {expandedPerson === person && (
                  <div className="mt-1 space-y-2 pl-2 border-l-2 border-primary/20">
                    {tasks.filter(t => t.person?.includes(person)).map(t => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {Object.keys(personStats).length === 0 && (
              <Card className="p-6 text-center text-muted-foreground text-sm">No person data</Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
