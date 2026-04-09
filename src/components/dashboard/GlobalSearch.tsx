import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);

    const pattern = `%${q}%`;

    const [tasks, decisions, tasksByPerson, tasksByProject, decisionsByProject] = await Promise.all([
      supabase.from('active_tasks').select('*').ilike('task', pattern).limit(10),
      supabase.from('decisions').select('*').ilike('decision_text', pattern).limit(10),
      supabase.from('active_tasks').select('*').contains('person', [q]).limit(5),
      supabase.from('active_tasks').select('*').ilike('project_tag', pattern).limit(5),
      supabase.from('decisions').select('*').ilike('project_tag', pattern).limit(5),
    ]);

    const seen = new Set<string>();
    const combined: any[] = [];

    const addUnique = (items: any[], type: string, textField: string) => {
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          combined.push({ ...item, _type: type, task: item[textField] || item.task || item.decision_text });
        }
      }
    };

    addUnique(tasks.data || [], 'Task', 'task');
    addUnique(decisions.data || [], 'Decision', 'decision_text');
    addUnique(tasksByPerson.data || [], 'Task', 'task');
    addUnique(tasksByProject.data || [], 'Task', 'task');
    addUnique(decisionsByProject.data || [], 'Decision', 'decision_text');

    setResults(combined.slice(0, 15));
    setSearching(false);
  };

  return (
    <div className="mb-4 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search tasks, decisions, people, projects..."
          className="pl-9"
        />
      </div>
      {results.length > 0 && (
        <Card className="absolute z-10 w-full mt-1 max-h-64 overflow-y-auto p-2 space-y-1">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-muted text-sm">
              <Badge variant="outline" className="text-[10px] flex-shrink-0">{r._type}</Badge>
              <span className="truncate flex-1">{r.task}</span>
              {r.person?.length > 0 && (
                <span className="text-xs text-muted-foreground flex-shrink-0">{r.person.join(", ")}</span>
              )}
              {r.project_tag && (
                <Badge variant="secondary" className="text-[10px] h-5 flex-shrink-0">{r.project_tag}</Badge>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
