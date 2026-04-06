import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Check, X, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateId, getPriorityEmoji } from "@/lib/supabase-helpers";

interface InboxItem {
  id: string;
  inbox_id: string;
  type: string;
  raw_fragment: string | null;
  parsed_text: string | null;
  person: string[] | null;
  person_is_new: boolean | null;
  person_collision: boolean | null;
  team: string | null;
  team_is_new: boolean | null;
  project_tag: string | null;
  priority: string | null;
  due_date: string | null;
  due_time: string | null;
  due_is_vague: boolean | null;
  is_meeting_context: boolean | null;
  blocked_by_desc: string | null;
  status: string;
  gemini_feedback: string | null;
  feedback_detail: string | null;
  master_log_ref: string | null;
}

export default function PendingRoom() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedItems, setEditedItems] = useState<Record<string, Partial<InboxItem>>>({});

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inbox')
      .select('*')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (error) { toast.error("Failed to load pending items"); console.error(error); }
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const updateField = (id: string, field: string, value: any) => {
    setEditedItems(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const getItemValue = (item: InboxItem, field: keyof InboxItem) => {
    return editedItems[item.id]?.[field] ?? item[field];
  };

  const confirmItem = async (item: InboxItem) => {
    try {
      const edited = editedItems[item.id] || {};
      const merged = { ...item, ...edited };
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (merged.type === 'Task' || merged.type === 'CalendarEvent') {
        const taskId = await generateId('TASK', 'active_tasks', 'task_id');
        const { error } = await supabase.from('active_tasks').insert({
          task_id: taskId,
          user_id: user.id,
          task: merged.parsed_text || '',
          team: merged.team,
          person: merged.person || [],
          priority: merged.priority || 'Med',
          due_date: merged.due_date,
          due_time: merged.due_time,
          is_meeting_context: merged.is_meeting_context || false,
          project_tag: merged.project_tag,
          inbox_ref: merged.inbox_id,
          status: 'Active',
        });
        if (error) throw error;
      } else if (merged.type === 'Decision') {
        const decId = await generateId('DEC', 'decisions', 'decision_id');
        const { error } = await supabase.from('decisions').insert({
          decision_id: decId,
          user_id: user.id,
          decision_text: merged.parsed_text || '',
          team: merged.team,
          person: merged.person || [],
          project_tag: merged.project_tag,
          is_meeting_context: merged.is_meeting_context || false,
          source: 'voice_transcript',
        });
        if (error) throw error;
      }

      await supabase.from('inbox').update({ status: 'Confirmed' }).eq('id', item.id);
      toast.success(`${merged.type} confirmed`);
      fetchItems();
    } catch (err: any) {
      toast.error("Failed to confirm: " + err.message);
    }
  };

  const discardItem = async (item: InboxItem) => {
    await supabase.from('inbox').update({ status: 'Discarded' }).eq('id', item.id);
    toast.info("Item discarded");
    fetchItems();
  };

  const sendFeedback = async (item: InboxItem, feedback: 'up' | 'down') => {
    await supabase.from('inbox').update({ gemini_feedback: feedback }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, gemini_feedback: feedback } : i));
  };

  const confirmAll = async () => {
    for (const item of items) {
      await confirmItem(item);
    }
  };

  const discardAll = async () => {
    const ids = items.map(i => i.id);
    await supabase.from('inbox').update({ status: 'Discarded' }).in('id', ids);
    toast.info("All items discarded");
    fetchItems();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Pending Room</h2>
          <p className="text-sm text-muted-foreground">{items.length} item(s) awaiting review</p>
        </div>
        {items.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={discardAll}>Discard All</Button>
            <Button size="sm" onClick={confirmAll}>Confirm All</Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-lg mb-1">No pending items</p>
          <p className="text-sm">Record a voice note to get started</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 animate-slide-up">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  {['Task', 'Decision', 'CalendarEvent'].map(t => (
                    <button
                      key={t}
                      onClick={() => updateField(item.id, 'type', t)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        getItemValue(item, 'type') === t
                          ? t === 'CalendarEvent' ? 'bg-primary text-primary-foreground' : t === 'Decision' ? 'bg-accent text-accent-foreground border border-border' : 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {t === 'CalendarEvent' ? (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Event</span>
                      ) : t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => sendFeedback(item, 'up')}
                    className={`p-1.5 rounded hover:bg-muted ${item.gemini_feedback === 'up' ? 'text-success' : 'text-muted-foreground'}`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => sendFeedback(item, 'down')}
                    className={`p-1.5 rounded hover:bg-muted ${item.gemini_feedback === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Text</label>
                  <Input
                    value={(getItemValue(item, 'parsed_text') as string) || ''}
                    onChange={e => updateField(item.id, 'parsed_text', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Person</label>
                    <Input
                      value={(getItemValue(item, 'person') as string[])?.join(', ') || ''}
                      onChange={e => updateField(item.id, 'person', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="Comma separated"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Team</label>
                    <Input
                      value={(getItemValue(item, 'team') as string) || ''}
                      onChange={e => updateField(item.id, 'team', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Project</label>
                    <Input
                      value={(getItemValue(item, 'project_tag') as string) || ''}
                      onChange={e => updateField(item.id, 'project_tag', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Priority</label>
                    <div className="flex gap-1 mt-1">
                      {['High', 'Med', 'Low'].map(p => (
                        <button
                          key={p}
                          onClick={() => updateField(item.id, 'priority', p)}
                          className={`flex-1 text-xs py-1.5 rounded font-medium transition-all ${
                            getItemValue(item, 'priority') === p
                              ? p === 'High' ? 'bg-destructive/20 text-destructive' : p === 'Med' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {getPriorityEmoji(p)} {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={(getItemValue(item, 'due_date') as string) || ''}
                      onChange={e => updateField(item.id, 'due_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={getItemValue(item, 'is_meeting_context') as boolean || false}
                      onCheckedChange={v => updateField(item.id, 'is_meeting_context', v)}
                    />
                    <span className="text-xs text-muted-foreground">Meeting Context</span>
                  </div>
                </div>

                {/* Alerts */}
                {item.person_is_new && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20 text-sm">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span>New person detected: <strong>{item.person?.join(', ')}</strong></span>
                    <Button size="sm" variant="outline" className="ml-auto text-xs h-7">Add</Button>
                  </div>
                )}

                {item.due_is_vague && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20 text-sm">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span>Vague date — please set a specific date</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => discardItem(item)} className="gap-1">
                  <X className="w-3.5 h-3.5" /> Discard
                </Button>
                <Button size="sm" onClick={() => confirmItem(item)} className="gap-1">
                  <Check className="w-3.5 h-3.5" /> Confirm
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
