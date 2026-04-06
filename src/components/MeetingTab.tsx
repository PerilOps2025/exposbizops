import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

export default function MeetingTab() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Meeting Brief</h2>
      <Card className="p-6 text-center">
        <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-2">No upcoming meetings detected</p>
        <p className="text-xs text-muted-foreground">
          Pre-meeting briefs will appear here automatically when a meeting is within 60 minutes.
        </p>
      </Card>

      <h3 className="text-lg font-bold mt-8 mb-4">Meeting History</h3>
      <Card className="p-6 text-center text-muted-foreground text-sm">
        No meeting records yet. They will appear after you end a meeting.
      </Card>
    </div>
  );
}
