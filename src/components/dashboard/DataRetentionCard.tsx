import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";

export default function DataRetentionCard() {
  const [cutoffDays, setCutoffDays] = useState("90");
  const [confirming, setConfirming] = useState(false);
  const [stats, setStats] = useState<{ oldDecisions: number; oldArchived: number } | null>(null);
  const [cleaning, setCleaning] = useState(false);

  const previewCleanup = async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(cutoffDays));
    const cutoff = cutoffDate.toISOString();

    const { count: decCount } = await supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoff);

    const { count: archCount } = await supabase
      .from('archive')
      .select('*', { count: 'exact', head: true })
      .lt('archived_at', cutoff);

    setStats({ oldDecisions: decCount || 0, oldArchived: archCount || 0 });
    setConfirming(true);
  };

  const executeCleanup = async () => {
    setCleaning(true);
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(cutoffDays));
      const cutoff = cutoffDate.toISOString();

      const { error: e1 } = await supabase
        .from('decisions')
        .delete()
        .lt('created_at', cutoff);

      const { error: e2 } = await supabase
        .from('archive')
        .delete()
        .lt('archived_at', cutoff);

      if (e1 || e2) {
        toast.error("Some items could not be deleted");
      } else {
        toast.success(`Cleaned up ${stats?.oldDecisions || 0} decisions and ${stats?.oldArchived || 0} archived tasks`);
      }
    } catch {
      toast.error("Cleanup failed");
    } finally {
      setCleaning(false);
      setConfirming(false);
      setStats(null);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Trash2 className="w-4 h-4" /> Data Retention
      </h3>
      <p className="text-xs text-muted-foreground">
        Clean up old decisions and archived tasks to keep the database lean.
      </p>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Delete items older than (days)</label>
          <Input type="number" value={cutoffDays} onChange={e => setCutoffDays(e.target.value)} className="mt-1" min="30" />
        </div>
        <Button variant="outline" size="sm" onClick={previewCleanup}>
          Preview
        </Button>
      </div>

      {confirming && stats && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Confirm deletion
          </div>
          <p className="text-xs text-muted-foreground">
            This will permanently delete <strong>{stats.oldDecisions}</strong> decision(s) and <strong>{stats.oldArchived}</strong> archived task(s) older than {cutoffDays} days.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setConfirming(false); setStats(null); }}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={executeCleanup} disabled={cleaning}>
              {cleaning ? "Deleting..." : "Delete permanently"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
