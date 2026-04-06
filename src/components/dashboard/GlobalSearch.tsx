import { useState } from "react";
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

    const [tasks, decisions] = await Promise.all([
      supabase.from('active_tasks').select('*').ilike('task', pattern).limit(10),
      supabase.from('decisions').select('*').ilike('decision_text', pattern).limit(10),
    ]);

    const combined = [
      ...(tasks.data || []).map(t => ({ ...t, _type: 'Task' })),
      ...(decisions.data || []).map(d => ({ ...d, _type: 'Decision', task: d.decision_text })),
    ];
    setResults(combined);
    setSearching(false);
  };

  return (
    <div className="mb-4 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search tasks, decisions..."
          className="pl-9"
        />
      </div>
      {results.length > 0 && (
        <Card className="absolute z-10 w-full mt-1 max-h-64 overflow-y-auto p-2 space-y-1">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-muted text-sm">
              <Badge variant="outline" className="text-[10px]">{r._type}</Badge>
              <span className="truncate">{r.task}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
