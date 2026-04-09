import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Users, FileText, CheckCircle, Link2, ExternalLink, RefreshCw, ChevronDown, ChevronUp, Video, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, parseISO, differenceInMinutes } from "date-fns";
import { getPriorityEmoji } from "@/lib/supabase-helpers";
import PostMeetingModal from "@/components/PostMeetingModal";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  attendees: { email: string; name: string; responseStatus: string }[];
  location: string | null;
  htmlLink: string;
  meetLink: string | null;
}

interface MeetingBrief {
  relatedTasks: any[];
  relatedDecisions: any[];
  pastMeetings: any[];
  carryForwardItems: string[];
}

export default function MeetingTab() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<Record<string, MeetingBrief>>({});
  const [briefLoading, setBriefLoading] = useState<Record<string, boolean>>({});
  const [postMeetingEvent, setPostMeetingEvent] = useState<CalendarEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke("google-calendar-events", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;
      const body = res.data;

      setConnected(body.connected);
      setCalendarEmail(body.email || null);
      if (body.events) setEvents(body.events);
    } catch (err: any) {
      console.error("Failed to fetch calendar:", err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const connectCalendar = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke("google-calendar-auth", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;
      const { url } = res.data;

      const popup = window.open(url, "google-calendar-auth", "width=500,height=700,left=200,top=100");

      const interval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(interval);
          toast.success("Checking calendar connection...");
          setTimeout(fetchEvents, 2000);
        }
      }, 500);
    } catch (err: any) {
      toast.error("Failed to start calendar auth: " + err.message);
    }
  };

  const disconnectCalendar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("calendar_tokens").delete().eq("user_id", user.id);
      setConnected(false);
      setEvents([]);
      setCalendarEmail(null);
      toast.success("Calendar disconnected. Reconnect to authorize new permissions.");
    } catch (err: any) {
      toast.error("Failed to disconnect: " + err.message);
    }
  };

  const loadBrief = async (event: CalendarEvent) => {
    if (briefs[event.id]) return;
    setBriefLoading(prev => ({ ...prev, [event.id]: true }));

    try {
      const attendeeNames = event.attendees.map(a => a.name?.split("@")[0] || a.email.split("@")[0]);
      const keywords = event.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);

      const { data: tasks } = await supabase
        .from("active_tasks")
        .select("*")
        .in("status", ["Active", "WaitingOn", "Blocked", "Overdue"]);

      const relatedTasks = (tasks || []).filter(t => {
        const matchPerson = t.person?.some((p: string) =>
          attendeeNames.some(a => p.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(p.toLowerCase()))
        );
        const matchKeyword = keywords.some(k =>
          t.task?.toLowerCase().includes(k) ||
          t.project_tag?.toLowerCase().includes(k) ||
          t.team?.toLowerCase().includes(k)
        );
        return matchPerson || matchKeyword || t.is_meeting_context;
      });

      const { data: decisions } = await supabase
        .from("decisions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const relatedDecisions = (decisions || []).filter(d => {
        const matchPerson = d.person?.some((p: string) =>
          attendeeNames.some(a => p.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(p.toLowerCase()))
        );
        const matchKeyword = keywords.some(k =>
          d.decision_text?.toLowerCase().includes(k) ||
          d.project_tag?.toLowerCase().includes(k) ||
          d.team?.toLowerCase().includes(k)
        );
        return matchPerson || matchKeyword;
      }).slice(0, 5);

      const { data: pastMeetings } = await supabase
        .from("meeting_log")
        .select("*")
        .order("scheduled_start", { ascending: false })
        .limit(20);

      const relatedMeetings = (pastMeetings || []).filter(m => {
        const titleWords = (m.meeting_title || "").toLowerCase().split(/\s+/);
        return keywords.some(k => titleWords.includes(k));
      }).slice(0, 3);

      const carryForwardItems = relatedMeetings.flatMap(m => m.open_items_carried_forward || []);

      setBriefs(prev => ({
        ...prev,
        [event.id]: { relatedTasks, relatedDecisions, pastMeetings: relatedMeetings, carryForwardItems },
      }));
    } catch (err) {
      console.error("Failed to load brief:", err);
    } finally {
      setBriefLoading(prev => ({ ...prev, [event.id]: false }));
    }
  };

  const toggleEvent = (event: CalendarEvent) => {
    if (expandedEvent === event.id) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(event.id);
      loadBrief(event);
    }
  };

  const formatEventTime = (start: string, end: string) => {
    const s = parseISO(start);
    const e = parseISO(end);
    const duration = differenceInMinutes(e, s);
    const timeStr = format(s, "h:mm a");
    return `${timeStr} · ${duration}min`;
  };

  const getDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEEE, MMM d");
  };

  const groupedEvents: Record<string, CalendarEvent[]> = {};
  events.forEach(e => {
    const key = getDateLabel(e.start);
    if (!groupedEvents[key]) groupedEvents[key] = [];
    groupedEvents[key].push(e);
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Meetings</h2>
          {connected && calendarEmail && (
            <p className="text-sm text-muted-foreground">Synced with {calendarEmail}</p>
          )}
        </div>
      {connected ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchEvents} className="gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={disconnectCalendar} className="gap-1 text-destructive hover:text-destructive">
              Disconnect
            </Button>
          </div>
        ) : null}
      </div>

      {!connected ? (
        <Card className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Connect Google Calendar</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sync your calendar to see upcoming meetings with contextual briefs — relevant tasks, decisions, and past meeting notes.
          </p>
          <Button onClick={connectCalendar} className="gap-2">
            <Link2 className="w-4 h-4" /> Connect Calendar
          </Button>
        </Card>
      ) : events.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-lg mb-1">No upcoming meetings</p>
          <p className="text-sm">Your next 7 days look clear!</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([dateLabel, dayEvents]) => (
            <div key={dateLabel}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{dateLabel}</h3>
              <div className="space-y-3">
                {dayEvents.map(event => {
                  const isExpanded = expandedEvent === event.id;
                  const brief = briefs[event.id];
                  const isLoadingBrief = briefLoading[event.id];

                  return (
                    <Card key={event.id} className="overflow-hidden">
                      <button
                        onClick={() => toggleEvent(event)}
                        className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{event.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatEventTime(event.start, event.end)}
                              </span>
                              {event.attendees.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {event.attendees.length}
                                </span>
                              )}
                            </div>
                            {event.meetLink && (
                              <a
                                href={event.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-primary hover:underline"
                              >
                                <Video className="w-3 h-3" /> Join Meet
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {brief && (brief.relatedTasks.length > 0 || brief.relatedDecisions.length > 0) && (
                              <Badge variant="secondary" className="text-[10px]">
                                {brief.relatedTasks.length + brief.relatedDecisions.length} items
                              </Badge>
                            )}
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                          {isLoadingBrief ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Loading brief...</p>
                          ) : brief ? (
                            <>
                              {event.attendees.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Attendees</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {event.attendees.map((a, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {a.name || a.email}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {brief.relatedTasks.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                    Open Tasks ({brief.relatedTasks.length})
                                  </h4>
                                  <div className="space-y-1.5">
                                    {brief.relatedTasks.map(t => (
                                      <div key={t.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                                        <span>{getPriorityEmoji(t.priority)}</span>
                                        <span className="truncate flex-1">{t.task}</span>
                                        {t.person?.length > 0 && (
                                          <span className="text-xs text-muted-foreground">{t.person.join(", ")}</span>
                                        )}
                                        <Badge variant="secondary" className="text-[10px] h-5">{t.status}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {brief.relatedDecisions.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                    Recent Decisions ({brief.relatedDecisions.length})
                                  </h4>
                                  <div className="space-y-1.5">
                                    {brief.relatedDecisions.map(d => (
                                      <div key={d.id} className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded">
                                        <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                                        <span className="truncate">{d.decision_text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {brief.pastMeetings.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                    Past Meetings
                                  </h4>
                                  <div className="space-y-1.5">
                                    {brief.pastMeetings.map(m => (
                                      <div key={m.id} className="text-sm p-2 bg-muted/50 rounded">
                                        <p className="font-medium">{m.meeting_title || "Untitled"}</p>
                                        {m.auto_summary && <p className="text-xs text-muted-foreground mt-1">{m.auto_summary}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {brief.carryForwardItems.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                    Carried Forward
                                  </h4>
                                  <ul className="space-y-1 text-sm">
                                    {brief.carryForwardItems.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2 p-2 bg-warning/10 rounded">
                                        <FileText className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {brief.relatedTasks.length === 0 && brief.relatedDecisions.length === 0 && brief.pastMeetings.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-2">No related context found for this meeting.</p>
                              )}

                              {event.htmlLink && (
                                <>
                                  <Separator />
                                  <a
                                    href={event.htmlLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Open in Google Calendar
                                  </a>
                                </>
                              )}
                            </>
                          ) : null}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
