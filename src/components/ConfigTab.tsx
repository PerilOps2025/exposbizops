import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DataRetentionCard from "@/components/dashboard/DataRetentionCard";

export default function ConfigTab() {
  const [people, setPeople] = useState<{ name: string; email: string; team: string }[]>([]);
  const [teams, setTeams] = useState<{ name: string }[]>([]);
  const [projects, setProjects] = useState<{ name: string }[]>([]);
  const [newPerson, setNewPerson] = useState({ name: "", email: "", team: "" });
  const [newTeam, setNewTeam] = useState("");
  const [newProject, setNewProject] = useState("");
  const [briefWindow, setBriefWindow] = useState("60");
  const [escalationDays, setEscalationDays] = useState("3");
  const [digestEmail, setDigestEmail] = useState("");
  const [dailyPaused, setDailyPaused] = useState(false);
  const [weeklyPaused, setWeeklyPaused] = useState(false);
  const [breakfastPaused, setBreakfastPaused] = useState(false);
  const [aiUsage, setAiUsage] = useState<Record<string, { calls: number; tokens: number }>>({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase.from('config').select('*');
    if (!data) return;
    const configMap: Record<string, any> = {};
    data.forEach(c => { configMap[c.key] = c.value; });

    if (configMap.ENTITY_PEOPLE) setPeople(configMap.ENTITY_PEOPLE);
    if (configMap.ENTITY_TEAMS) setTeams(configMap.ENTITY_TEAMS);
    if (configMap.ENTITY_PROJECTS) setProjects(configMap.ENTITY_PROJECTS);
    if (configMap.BRIEF_WINDOW_MINUTES) setBriefWindow(String(configMap.BRIEF_WINDOW_MINUTES));
    if (configMap.ESCALATION_THRESHOLD_DAYS) setEscalationDays(String(configMap.ESCALATION_THRESHOLD_DAYS));
    if (configMap.DIGEST_EMAIL) setDigestEmail(String(configMap.DIGEST_EMAIL));
    if (configMap.DIGEST_DAILY_PAUSED !== undefined) setDailyPaused(!!configMap.DIGEST_DAILY_PAUSED);
    if (configMap.DIGEST_WEEKLY_PAUSED !== undefined) setWeeklyPaused(!!configMap.DIGEST_WEEKLY_PAUSED);
    if (configMap.DIGEST_BREAKFAST_PAUSED !== undefined) setBreakfastPaused(!!configMap.DIGEST_BREAKFAST_PAUSED);
    if (configMap.AI_USAGE) setAiUsage(configMap.AI_USAGE as any);
  };

  const saveConfig = async (key: string, value: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('config').upsert(
      { user_id: user.id, key, value },
      { onConflict: 'user_id,key' }
    );
    if (error) toast.error("Failed to save");
    else toast.success("Saved");
  };

  const addPerson = async () => {
    if (!newPerson.name) return;
    const updated = [...people, newPerson];
    setPeople(updated);
    await saveConfig('ENTITY_PEOPLE', updated);
    setNewPerson({ name: "", email: "", team: "" });
  };

  const addTeam = async () => {
    if (!newTeam) return;
    const updated = [...teams, { name: newTeam }];
    setTeams(updated);
    await saveConfig('ENTITY_TEAMS', updated);
    setNewTeam("");
  };

  const addProject = async () => {
    if (!newProject) return;
    const updated = [...projects, { name: newProject }];
    setProjects(updated);
    await saveConfig('ENTITY_PROJECTS', updated);
    setNewProject("");
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">Configuration</h2>

      {/* Settings */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold">Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Brief Window (minutes)</label>
            <div className="flex gap-2 mt-1">
              <Input value={briefWindow} onChange={e => setBriefWindow(e.target.value)} type="number" />
              <Button size="sm" onClick={() => saveConfig('BRIEF_WINDOW_MINUTES', Number(briefWindow))}>Save</Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Escalation Threshold (days)</label>
            <div className="flex gap-2 mt-1">
              <Input value={escalationDays} onChange={e => setEscalationDays(e.target.value)} type="number" />
              <Button size="sm" onClick={() => saveConfig('ESCALATION_THRESHOLD_DAYS', Number(escalationDays))}>Save</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* People */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">People Registry</h3>
        <div className="flex flex-wrap gap-2">
          {people.map((p, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {p.name} {p.team && `(${p.team})`}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Name" value={newPerson.name} onChange={e => setNewPerson({ ...newPerson, name: e.target.value })} />
          <Input placeholder="Email" value={newPerson.email} onChange={e => setNewPerson({ ...newPerson, email: e.target.value })} />
          <Input placeholder="Team" value={newPerson.team} onChange={e => setNewPerson({ ...newPerson, team: e.target.value })} />
          <Button size="sm" onClick={addPerson}>Add</Button>
        </div>
      </Card>

      {/* Teams */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Teams</h3>
        <div className="flex flex-wrap gap-2">
          {teams.map((t, i) => <Badge key={i} variant="secondary">{t.name}</Badge>)}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Team name" value={newTeam} onChange={e => setNewTeam(e.target.value)} />
          <Button size="sm" onClick={addTeam}>Add</Button>
        </div>
      </Card>

      {/* Projects */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Projects</h3>
        <div className="flex flex-wrap gap-2">
          {projects.map((p, i) => <Badge key={i} variant="outline">{p.name}</Badge>)}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Project name" value={newProject} onChange={e => setNewProject(e.target.value)} />
          <Button size="sm" onClick={addProject}>Add</Button>
        </div>
      </Card>
      {/* Email Digests */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold">Email Digests</h3>
        <div>
          <label className="text-xs text-muted-foreground">Send digests to</label>
          <div className="flex gap-2 mt-1">
            <Input
              value={digestEmail}
              onChange={e => setDigestEmail(e.target.value)}
              placeholder="your@email.com"
              type="email"
            />
            <Button size="sm" onClick={() => saveConfig('DIGEST_EMAIL', digestEmail)}>Save</Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Emails are sent from your connected Google account. Requires Google Calendar + Gmail to be connected.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">☀️ Breakfast Brief</p>
              <p className="text-xs text-muted-foreground">Daily at 9:00 AM IST (except Sunday)</p>
            </div>
            <Switch
              checked={!breakfastPaused}
              onCheckedChange={v => {
                setBreakfastPaused(!v);
                saveConfig('DIGEST_BREAKFAST_PAUSED', !v);
              }}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">🌙 Daily Digest</p>
              <p className="text-xs text-muted-foreground">Daily at 9:00 PM IST (except Sunday) — Karma & Consequences</p>
            </div>
            <Switch
              checked={!dailyPaused}
              onCheckedChange={v => {
                setDailyPaused(!v);
                saveConfig('DIGEST_DAILY_PAUSED', !v);
              }}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">📊 Weekly Digest</p>
              <p className="text-xs text-muted-foreground">Every Saturday at 9:00 PM IST</p>
            </div>
            <Switch
              checked={!weeklyPaused}
              onCheckedChange={v => {
                setWeeklyPaused(!v);
                saveConfig('DIGEST_WEEKLY_PAUSED', !v);
              }}
            />
          </div>
        </div>
      </Card>
      {/* AI Usage Tracker */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">AI Usage Tracker</h3>
        <p className="text-xs text-muted-foreground">Tracks AI parsing calls per day (tokens used via Lovable AI gateway)</p>
        {Object.keys(aiUsage).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(aiUsage).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7).map(([date, data]) => (
              <div key={date} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                <span>{date}</span>
                <span className="text-muted-foreground">{data.calls} calls · {data.tokens.toLocaleString()} tokens</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No usage data yet</p>
        )}
      </Card>
      {/* Data Retention */}
      <DataRetentionCard />
    </div>
  );
}
