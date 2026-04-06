import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateId } from "@/lib/supabase-helpers";

interface FollowUpTask {
  text: string;
  person: string;
  priority: string;
  due_date: string;
}

interface TaskCompletionModalProps {
  open: boolean;
  onClose: () => void;
  task: any;
  onCompleted: () => void;
}

export default function TaskCompletionModal({ open, onClose, task, onCompleted }: TaskCompletionModalProps) {
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState<string>("text");
  const [tags, setTags] = useState({
    meetingContext: false,
    decisionMade: false,
    followUpNeeded: false,
  });
  const [decisionText, setDecisionText] = useState("");
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addFollowUp = () => {
    setFollowUps(prev => [...prev, { text: "", person: "", priority: "Med", due_date: "" }]);
  };

  const updateFollowUp = (index: number, field: keyof FollowUpTask, value: string) => {
    setFollowUps(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const removeFollowUp = (index: number) => {
    setFollowUps(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const spawnedIds: string[] = [];

      // Create follow-up tasks
      for (const fu of followUps) {
        if (!fu.text.trim()) continue;
        const taskId = await generateId("TASK", "active_tasks", "task_id");
        const { error } = await supabase.from("active_tasks").insert({
          task_id: taskId,
          user_id: user.id,
          task: fu.text,
          person: fu.person ? fu.person.split(",").map(s => s.trim()).filter(Boolean) : [],
          priority: fu.priority,
          due_date: fu.due_date || null,
          parent_task_id: task.task_id,
          team: task.team,
          project_tag: task.project_tag,
          status: "Active",
        });
        if (error) throw error;
        spawnedIds.push(taskId);
      }

      // If "Decision Made" tag is checked, log the decision
      if (tags.decisionMade && decisionText.trim()) {
        const decId = await generateId("DEC", "decisions", "decision_id");
        await supabase.from("decisions").insert({
          decision_id: decId,
          user_id: user.id,
          decision_text: decisionText,
          team: task.team,
          person: task.person || [],
          project_tag: task.project_tag,
          is_meeting_context: tags.meetingContext,
          source: "task_completion",
        });
      }

      // Archive the task
      const { error: archiveError } = await supabase.from("archive").insert({
        task_id: task.task_id,
        user_id: user.id,
        task: task.task,
        team: task.team,
        person: task.person,
        priority: task.priority,
        due_date: task.due_date,
        project_tag: task.project_tag,
        inbox_ref: task.inbox_ref,
        parent_task_id: task.parent_task_id,
        recurrence: task.recurrence,
        status: "Done",
        completion_note: note || null,
        completion_note_type: noteType,
        completion_tags_person: tags.followUpNeeded ? "follow_up" : null,
        completion_tags_team: tags.meetingContext ? "meeting_context" : null,
        completion_tags_project_tag: tags.decisionMade ? "decision_made" : null,
        spawned_task_ids: spawnedIds.length > 0 ? spawnedIds : null,
        created_at: task.created_at,
      });
      if (archiveError) throw archiveError;

      // Write audit record
      await supabase.from("task_audit").insert({
        task_id: task.task_id,
        user_id: user.id,
        field: "status",
        old_value: task.status,
        new_value: "Done",
        edit_source: "completion_modal",
      });

      // Delete from active_tasks
      await supabase.from("active_tasks").delete().eq("id", task.id);

      toast.success("Task completed and archived!");
      onCompleted();
      onClose();
    } catch (err: any) {
      toast.error("Failed to complete task: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Complete Task
          </DialogTitle>
        </DialogHeader>

        {/* Task summary */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">{task?.task}</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {task?.person?.length > 0 && (
              <span className="text-xs text-muted-foreground">{task.person.join(", ")}</span>
            )}
            {task?.project_tag && <Badge variant="outline" className="text-[10px] h-5">{task.project_tag}</Badge>}
          </div>
        </div>

        {/* Completion note */}
        <div>
          <label className="text-sm font-medium">Completion Note</label>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What was done? Any context for the record..."
            className="mt-1"
            rows={3}
          />
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={tags.meetingContext} onCheckedChange={v => setTags(p => ({ ...p, meetingContext: !!v }))} />
              <span className="text-sm">Meeting Context</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={tags.decisionMade} onCheckedChange={v => setTags(p => ({ ...p, decisionMade: !!v }))} />
              <span className="text-sm">Decision Made</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={tags.followUpNeeded} onCheckedChange={v => setTags(p => ({ ...p, followUpNeeded: !!v }))} />
              <span className="text-sm">Follow-up Needed</span>
            </label>
          </div>
        </div>

        {/* Decision text (conditional) */}
        {tags.decisionMade && (
          <div>
            <label className="text-sm font-medium">Decision Text</label>
            <Input
              value={decisionText}
              onChange={e => setDecisionText(e.target.value)}
              placeholder="What was decided?"
              className="mt-1"
            />
          </div>
        )}

        {/* Follow-up tasks */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Follow-up Tasks</label>
            <Button variant="ghost" size="sm" onClick={addFollowUp} className="gap-1 h-7 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
          {followUps.map((fu, i) => (
            <div key={i} className="mt-2 p-3 border border-border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={fu.text}
                  onChange={e => updateFollowUp(i, "text", e.target.value)}
                  placeholder="Follow-up task description"
                  className="flex-1"
                />
                <button onClick={() => removeFollowUp(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={fu.person}
                  onChange={e => updateFollowUp(i, "person", e.target.value)}
                  placeholder="Person"
                />
                <Select value={fu.priority} onValueChange={v => updateFollowUp(i, "priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">🔴 High</SelectItem>
                    <SelectItem value="Med">🟡 Med</SelectItem>
                    <SelectItem value="Low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={fu.due_date}
                  onChange={e => updateFollowUp(i, "due_date", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleComplete} disabled={submitting} className="gap-1">
            <CheckCircle className="w-4 h-4" />
            {submitting ? "Completing..." : "Complete Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
