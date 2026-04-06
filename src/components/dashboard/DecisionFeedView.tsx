import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

export default function DecisionFeedView() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('decisions')
        .select('*')
        .order('created_at', { ascending: false });
      setDecisions(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Decision Feed</h3>
      {decisions.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground text-sm">No decisions recorded yet</Card>
      ) : (
        <div className="space-y-3">
          {decisions.map(d => (
            <Card key={d.id} className={`p-4 ${d.superseded_by_id ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{d.decision_text}</p>
                  {d.context && <p className="text-xs text-muted-foreground mt-1">{d.context}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(d.created_at), 'MMM d, yyyy')}
                    </span>
                    {d.team && <Badge variant="secondary" className="text-[10px] h-5">{d.team}</Badge>}
                    {d.project_tag && <Badge variant="outline" className="text-[10px] h-5">{d.project_tag}</Badge>}
                    {d.person?.map((p: string) => (
                      <span key={p} className="text-xs text-muted-foreground">• {p}</span>
                    ))}
                  </div>
                  {d.superseded_by_id && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-warning">
                      <ArrowRight className="w-3 h-3" />
                      Superseded by {d.superseded_by_id}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
