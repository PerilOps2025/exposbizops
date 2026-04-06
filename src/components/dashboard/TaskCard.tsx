import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { getPriorityEmoji, isOverdue } from "@/lib/supabase-helpers";
import { format } from "date-fns";
import TaskCompletionModal from "@/components/TaskCompletionModal";

interface TaskCardProps {
  task: any;
  showOverdue?: boolean;
  onTaskCompleted?: () => void;
}

export default function TaskCard({ task, showOverdue, onTaskCompleted }: TaskCardProps) {
  const [showModal, setShowModal] = useState(false);
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <>
      <Card className={`p-3 hover:shadow-md transition-shadow ${overdue ? 'border-destructive/30' : ''}`}>
        <div className="flex items-start gap-3">
          <span className="text-base mt-0.5">{getPriorityEmoji(task.priority)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{task.task}</p>
              {task.status === 'Blocked' && (
                <Lock className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
              )}
              {overdue && (
                <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {task.person?.length > 0 && (
                <span className="text-xs text-muted-foreground">{task.person.join(', ')}</span>
              )}
              {task.team && (
                <Badge variant="secondary" className="text-[10px] h-5">{task.team}</Badge>
              )}
              {task.project_tag && (
                <Badge variant="outline" className="text-[10px] h-5">{task.project_tag}</Badge>
              )}
              {task.due_date && (
                <span className={`text-xs ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {format(new Date(task.due_date), 'MMM d')}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-success flex-shrink-0"
            onClick={() => setShowModal(true)}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Done
          </Button>
        </div>
      </Card>
      <TaskCompletionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        task={task}
        onCompleted={() => onTaskCompleted?.()}
      />
    </>
  );
}
