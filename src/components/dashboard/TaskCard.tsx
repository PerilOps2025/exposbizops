import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { getPriorityEmoji, isOverdue } from "@/lib/supabase-helpers";
import { format, formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TaskCompletionModal from "@/components/TaskCompletionModal";

interface TaskCardProps {
  task: any;
  showOverdue?: boolean;
  onTaskCompleted?: () => void;
}

export default function TaskCard({ task, showOverdue, onTaskCompleted }: TaskCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const overdue = isOverdue(task.due_date, task.status);

  const taskText = task.task || "";
  const isLong = taskText.length > 100;

  return (
    <TooltipProvider>
      <>
        <Card className={`p-3 hover:shadow-md transition-shadow ${overdue ? 'border-destructive/30' : ''}`}>
          <div className="flex items-start gap-3">
            <span className="text-base mt-0.5">{getPriorityEmoji(task.priority)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <p className={`text-sm font-medium break-words ${!expanded && isLong ? 'line-clamp-2' : ''}`}>{taskText}</p>
                {task.status === 'Blocked' && (
                  <Lock className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                {overdue && (
                  <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                )}
              </div>
              {isLong && (
                <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline mt-0.5 flex items-center gap-0.5">
                  {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
                </button>
              )}
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
                {task.parent_task_id && (
                  <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">Follow-up</Badge>
                )}
              </div>
              {/* Created date & last follow-up */}
              <div className="flex items-center gap-3 mt-1">
                {task.created_at && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] text-muted-foreground cursor-default">
                        Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{format(new Date(task.created_at), 'MMM d, yyyy h:mm a')}</TooltipContent>
                  </Tooltip>
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
    </TooltipProvider>
  );
}
