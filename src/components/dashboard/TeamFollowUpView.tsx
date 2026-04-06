import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import TaskCard from "./TaskCard";

export default function TeamFollowUpView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterPerson, setFilterPerson] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('active_tasks')
        .select('*')
        .neq('status', 'Done')
        .order('due_date', { ascending: true });

      const items = data || [];
      setTasks(items);
      const uniqueTeams = [...new Set(items.map(t => t.team).filter(Boolean))] as string[];
      setTeams(uniqueTeams);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = tasks.filter(t => {
    if (filterTeam !== 'all' && t.team !== filterTeam) return false;
    if (filterPerson && !t.person?.some((p: string) => p.toLowerCase().includes(filterPerson.toLowerCase()))) return false;
    return true;
  });

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Team Follow-up</h3>
      <div className="flex gap-3">
        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filter by person..."
          value={filterPerson}
          onChange={e => setFilterPerson(e.target.value)}
          className="max-w-48"
        />
      </div>
      <div className="space-y-2">
        {filtered.map(t => <TaskCard key={t.id} task={t} />)}
      </div>
      {filtered.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground text-sm">No follow-up items</Card>
      )}
    </div>
  );
}
