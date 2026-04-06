import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateId, getPriorityEmoji } from "@/lib/supabase-helpers";

interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewTaskModal({ open, onClose, onCreated }: NewTaskModalProps) {
  const [task, setTask] = useState("");
  const [person, setPerson] = useState("");
  const [team, setTeam] = useState("");
  const [projectTag, setProjectTag] = useState("");
  const [priority, setPriority] = useState("Med");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [isMeetingContext, setIsMeetingContext] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async (toPending: boolean) => {
    if (!task.trim()) { toast.error("Task is required"); return; }
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }

      if (toPending) {
        const inboxId = await generateId('INB', 'inbox', 'inbox_id');
        await supabase.from('inbox').insert({
          inbox_id: inboxId,
          user_id: user.id,
          type: 'Task',
          parsed_text: task,
          person: person.split(',').map(s => s.trim()).filter(Boolean),
          team: team || null,
          project_tag: projectTag || null,
          priority,
          due_date: dueDate || null,
          due_time: dueTime || null,
          is_meeting_context: isMeetingContext,
          status: 'Pending',
        });
        toast.success("Saved to Pending Room");
      } else {
        const taskId = await generateId('TASK', 'active_tasks', 'task_id');
        await supabase.from('active_tasks').insert({
          task_id: taskId,
          user_id: user.id,
          task,
          person: person.split(',').map(s => s.trim()).filter(Boolean),
          team: team || null,
          project_tag: projectTag || null,
          priority,
          due_date: dueDate || null,
          due_time: dueTime || null,
          is_meeting_context: isMeetingContext,
          status: 'Active',
        });
        toast.success("Task created");
      }

      onCreated();
      onClose();
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTask(""); setPerson(""); setTeam(""); setProjectTag("");
    setPriority("Med"); setDueDate(""); setDueTime(""); setIsMeetingContext(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">New Task</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Task</label>
            <Textarea value={task} onChange={e => setTask(e.target.value)} className="mt-1" rows={2} placeholder="What needs to be done?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Person</label>
              <Input value={person} onChange={e => setPerson(e.target.value)} className="mt-1" placeholder="Comma separated" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Team</label>
              <Input value={team} onChange={e => setTeam(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Project</label>
              <Input value={projectTag} onChange={e => setProjectTag(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Priority</label>
              <div className="flex gap-1 mt-1">
                {['High', 'Med', 'Low'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 text-xs py-1.5 rounded font-medium transition-all ${
                      priority === p
                        ? p === 'High' ? 'bg-destructive/20 text-destructive' : p === 'Med' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {getPriorityEmoji(p)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Due Date</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isMeetingContext} onCheckedChange={setIsMeetingContext} />
            <span className="text-xs text-muted-foreground">Meeting Context</span>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => handleSave(true)} disabled={saving}>
            Save to Pending
          </Button>
          <Button className="flex-1" onClick={() => handleSave(false)} disabled={saving}>
            Save to Active
          </Button>
        </div>
      </div>
    </div>
  );
}
