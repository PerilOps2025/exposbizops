import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, Pencil, Check, X, Trash2, Archive, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function DecisionFeedView() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [editForm, setEditForm] = useState<{ decision_text: string; context: string; team: string; project_tag: string; person: string; valid_until: string }>({
    decision_text: "", context: "", team: "", project_tag: "", person: "", valid_until: ""
  });

  useEffect(() => {
    fetchDecisions();
  }, [showArchived]);

  const fetchDecisions = async () => {
    let query = supabase.from('decisions').select('*').order('created_at', { ascending: false });
    if (!showArchived) {
      query = query.eq('is_active', true);
    }
    const { data } = await query;
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
      valid_until: d.valid_until || "",
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
      valid_until: editForm.valid_until || null,
    }).eq('id', id);

    if (error) { toast.error("Failed to save"); return; }
    toast.success("Decision updated");
    setEditingId(null);
    fetchDecisions();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from('decisions').update({ is_active: !currentActive }).eq('id', id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(currentActive ? "Decision archived" : "Decision reactivated");
    fetchDecisions();
  };

  const deleteDecision = async (id: string) => {
    if (!confirm("Delete this decision?")) return;
    const { error } = await supabase.from('decisions').delete().eq('id', id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Decision deleted");
    fetchDecisions();
  };

  const isExpired = (d: any) => d.valid_until && new Date(d.valid_until) < new Date();

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Decision Feed</h3>
          <Button variant="outline" size="sm" onClick={() => setShowArchived(!showArchived)} className="text-xs gap-1">
            <Archive className="w-3.5 h-3.5" />
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
        </div>
        {decisions.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">No decisions recorded yet</Card>
        ) : (
          <div className="space-y-3">
            {decisions.map(d => (
              <Card key={d.id} className={`p-4 ${d.superseded_by_id || !d.is_active ? 'opacity-60' : ''} ${isExpired(d) && d.is_active ? 'border-warning/50' : ''}`}>
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
                    <div className="grid grid-cols-4 gap-2">
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
                      <div>
                        <label className="text-xs text-muted-foreground font-medium">Valid Until</label>
                        <Input type="date" value={editForm.valid_until} onChange={e => setEditForm(f => ({ ...f, valid_until: e.target.value }))} className="mt-1" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1"><X className="w-3.5 h-3.5" /> Cancel</Button>
                      <Button size="sm" onClick={() => saveEdit(d.id)} className="gap-1"><Check className="w-3.5 h-3.5" /> Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!d.is_active ? 'bg-muted-foreground' : isExpired(d) ? 'bg-warning' : 'bg-primary'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium break-words">{d.decision_text}</p>
                      {d.context && <p className="text-xs text-muted-foreground mt-1 break-words">{d.context}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-default">
                              {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{format(new Date(d.created_at), 'MMM d, yyyy h:mm a')}</TooltipContent>
                        </Tooltip>
                        {d.valid_until && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={`text-xs flex items-center gap-0.5 cursor-default ${isExpired(d) ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                                <CalendarClock className="w-3 h-3" />
                                {isExpired(d) ? 'Expired' : `Valid until ${format(new Date(d.valid_until), 'MMM d')}`}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{format(new Date(d.valid_until), 'MMM d, yyyy')}</TooltipContent>
                          </Tooltip>
                        )}
                        {!d.is_active && <Badge variant="secondary" className="text-[10px] h-5">Archived</Badge>}
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
                      <button onClick={() => toggleActive(d.id, d.is_active)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Archive className="w-3.5 h-3.5" />
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
    </TooltipProvider>
  );
}
