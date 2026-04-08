import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowRight, Pencil, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DecisionFeedView() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ decision_text: string; context: string; team: string; project_tag: string; person: string }>({
    decision_text: "", context: "", team: "", project_tag: "", person: ""
  });

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    const { data } = await supabase
      .from('decisions')
      .select('*')
      .order('created_at', { ascending: false });
    setDecisions(data || []);
    setLoading(false);
  };

  const startEdit = (d: any) => {
    setEditingId(d.id);
    setEditForm({
      decision_text: d.decision_text || "",
      context: d.context || "",
      team: d.team || "",
      project_tag: d.project_tag || "",
      person: (d.person || []).join(", "),
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('decisions').update({
      decision_text: editForm.decision_text,
      context: editForm.context || null,
      team: editForm.team || null,
      project_tag: editForm.project_tag || null,
      person: editForm.person ? editForm.person.split(',').map(s => s.trim()).filter(Boolean) : [],
    }).eq('id', id);

    if (error) { toast.error("Failed to save"); return; }
    toast.success("Decision updated");
    setEditingId(null);
    fetchDecisions();
  };

  const deleteDecision = async (id: string) => {
    if (!confirm("Delete this decision?")) return;
    const { error } = await supabase.from('decisions').delete().eq('id', id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Decision deleted");
    fetchDecisions();
  };

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
              {editingId === d.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Decision</label>
                    <Textarea
                      value={editForm.decision_text}
                      onChange={e => setEditForm(f => ({ ...f, decision_text: e.target.value }))}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Context</label>
                    <Input
                      value={editForm.context}
                      onChange={e => setEditForm(f => ({ ...f, context: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Team</label>
                      <Input value={editForm.team} onChange={e => setEditForm(f => ({ ...f, team: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Project</label>
                      <Input value={editForm.project_tag} onChange={e => setEditForm(f => ({ ...f, project_tag: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Person(s)</label>
                      <Input value={editForm.person} onChange={e => setEditForm(f => ({ ...f, person: e.target.value }))} placeholder="Comma separated" className="mt-1" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1"><X className="w-3.5 h-3.5" /> Cancel</Button>
                    <Button size="sm" onClick={() => saveEdit(d.id)} className="gap-1"><Check className="w-3.5 h-3.5" /> Save</Button>
                  </div>
                </div>
              ) : (
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
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(d)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteDecision(d.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
