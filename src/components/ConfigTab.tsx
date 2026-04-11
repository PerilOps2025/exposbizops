import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, X, Pencil, Check } from "lucide-react";
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
  const [sendingDigest, setSendingDigest] = useState<string | null>(null);
  // Edit state
  const [editingPerson, setEditingPerson] = useState<number | null>(null);
  const [editPersonData, setEditPersonData] = useState({ name: "", email: "", team: "" });
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [editTeamData, setEditTeamData] = useState("");
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [editProjectData, setEditProjectData] = useState("");

  useEffect(() => { loadConfig(); }, []);

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

  // People CRUD
  const addPerson = async () => {
    if (!newPerson.name) return;
    const updated = [...people, newPerson];
    setPeople(updated);
    await saveConfig('ENTITY_PEOPLE', updated);
    setNewPerson({ name: "", email: "", team: "" });
  };
  const deletePerson = async (idx: number) => {
    const updated = people.filter((_, i) => i !== idx);
    setPeople(updated);
    await saveConfig('ENTITY_PEOPLE', updated);
  };
  const startEditPerson = (idx: number) => {
    setEditingPerson(idx);
    setEditPersonData({ ...people[idx] });
  };
  const saveEditPerson = async () => {
    if (editingPerson === null) return;
    const updated = people.map((p, i) => i === editingPerson ? editPersonData : p);
    setPeople(updated);
    await saveConfig('ENTITY_PEOPLE', updated);
    setEditingPerson(null);
  };

  // Teams CRUD
  const addTeam = async () => {
    if (!newTeam) return;
    const updated = [...teams, { name: newTeam }];
    setTeams(updated);
    await saveConfig('ENTITY_TEAMS', updated);
    setNewTeam("");
  };
  const deleteTeam = async (idx: number) => {
    const updated = teams.filter((_, i) => i !== idx);
    setTeams(updated);
    await saveConfig('ENTITY_TEAMS', updated);
  };
  const startEditTeam = (idx: number) => {
    setEditingTeam(idx);
    setEditTeamData(teams[idx].name);
  };
  const saveEditTeam = async () => {
    if (editingTeam === null) return;
    const updated = teams.map((t, i) => i === editingTeam ? { name: editTeamData } : t);
    setTeams(updated);
    await saveConfig('ENTITY_TEAMS', updated);
    setEditingTeam(null);
  };

  // Projects CRUD
  const addProject = async () => {
    if (!newProject) return;
    const updated = [...projects, { name: newProject }];
    setProjects(updated);
    await saveConfig('ENTITY_PROJECTS', updated);
    setNewProject("");
  };
  const deleteProject = async (idx: number) => {
    const updated = projects.filter((_, i) => i !== idx);
    setProjects(updated);
    await saveConfig('ENTITY_PROJECTS', updated);
  };
  const startEditProject = (idx: number) => {
    setEditingProject(idx);
    setEditProjectData(projects[idx].name);
  };
  const saveEditProject = async () => {
    if (editingProject === null) return;
    const updated = projects.map((p, i) => i === editingProject ? { name: editProjectData } : p);
    setProjects(updated);
    await saveConfig('ENTITY_PROJECTS', updated);
    setEditingProject(null);
  };

  const sendDigestNow = async (digestType: string) => {
    if (!digestEmail) { toast.error("Please set a digest email first"); return; }
    setSendingDigest(digestType);
    try {
      const { data, error } = await supabase.functions.invoke('send-digest', { body: { digestType } });
      if (error) throw error;
      const results = data?.results || [];
      const sent = results.find((r: any) => r.sent);
      if (sent) {
        toast.success(`${digestType} digest sent to ${sent.to}`);
      } else {
        const errResult = results[0];
        toast.error(errResult?.error || errResult?.reason || "Failed to send digest");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send digest");
    } finally {
      setSendingDigest(null);
    }
  };

  const todayKey = new Date().toISOString().split('T')[0];
  const todayUsage = aiUsage[todayKey] || { calls: 0, tokens: 0 };
  const sortedDays = Object.entries(aiUsage).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);

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
        <div className="space-y-2">
          {people.map((p, i) => (
            editingPerson === i ? (
              <div key={i} className="flex gap-2 items-center">
                <Input value={editPersonData.name} onChange={e => setEditPersonData({ ...editPersonData, name: e.target.value })} placeholder="Name" className="flex-1" />
                <Input value={editPersonData.email} onChange={e => setEditPersonData({ ...editPersonData, email: e.target.value })} placeholder="Email" className="flex-1" />
                <Input value={editPersonData.team} onChange={e => setEditPersonData({ ...editPersonData, team: e.target.value })} placeholder="Team" className="w-24" />
                <Button size="sm" variant="ghost" onClick={saveEditPerson} className="h-7 w-7 p-0"><Check className="w-3.5 h-3.5 text-success" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingPerson(null)} className="h-7 w-7 p-0"><X className="w-3.5 h-3.5" /></Button>
              </div>
            ) : (
              <div key={i} className="flex items-center gap-2 group">
                <Badge variant="secondary" className="gap-1">
                  {p.name} {p.team && `(${p.team})`} {p.email && `· ${p.email}`}
                </Badge>
                <button onClick={() => startEditPerson(i)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>
                <button onClick={() => deletePerson(i)} className="opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
              </div>
            )
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
        <div className="space-y-2">
          {teams.map((t, i) => (
            editingTeam === i ? (
              <div key={i} className="flex gap-2 items-center">
                <Input value={editTeamData} onChange={e => setEditTeamData(e.target.value)} className="flex-1" />
                <Button size="sm" variant="ghost" onClick={saveEditTeam} className="h-7 w-7 p-0"><Check className="w-3.5 h-3.5 text-success" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingTeam(null)} className="h-7 w-7 p-0"><X className="w-3.5 h-3.5" /></Button>
              </div>
            ) : (
              <div key={i} className="flex items-center gap-2 group">
                <Badge variant="secondary">{t.name}</Badge>
                <button onClick={() => startEditTeam(i)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>
                <button onClick={() => deleteTeam(i)} className="opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
              </div>
            )
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Team name" value={newTeam} onChange={e => setNewTeam(e.target.value)} />
          <Button size="sm" onClick={addTeam}>Add</Button>
        </div>
      </Card>

      {/* Projects */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Projects</h3>
        <div className="space-y-2">
          {projects.map((p, i) => (
            editingProject === i ? (
              <div key={i} className="flex gap-2 items-center">
                <Input value={editProjectData} onChange={e => setEditProjectData(e.target.value)} className="flex-1" />
                <Button size="sm" variant="ghost" onClick={saveEditProject} className="h-7 w-7 p-0"><Check className="w-3.5 h-3.5 text-success" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingProject(null)} className="h-7 w-7 p-0"><X className="w-3.5 h-3.5" /></Button>
              </div>
            ) : (
              <div key={i} className="flex items-center gap-2 group">
                <Badge variant="outline">{p.name}</Badge>
                <button onClick={() => startEditProject(i)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>
                <button onClick={() => deleteProject(i)} className="opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
              </div>
            )
          ))}
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
            <Input value={digestEmail} onChange={e => setDigestEmail(e.target.value)} placeholder="your@email.com" type="email" />
            <Button size="sm" onClick={() => saveConfig('DIGEST_EMAIL', digestEmail)}>Save</Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Emails are sent from your connected Google account. Requires Google Calendar + Gmail to be connected.
          </p>
        </div>
        <div className="space-y-3">
          {[
            { key: 'breakfast', label: '☀️ Breakfast Brief', desc: 'Daily at 9:00 AM IST (except Sunday)', paused: breakfastPaused, setPaused: setBreakfastPaused, configKey: 'DIGEST_BREAKFAST_PAUSED' },
            { key: 'daily', label: '🌙 Daily Digest', desc: 'Daily at 9:00 PM IST (except Sunday)', paused: dailyPaused, setPaused: setDailyPaused, configKey: 'DIGEST_DAILY_PAUSED' },
            { key: 'weekly', label: '📊 Weekly Digest', desc: 'Every Saturday at 9:00 PM IST', paused: weeklyPaused, setPaused: setWeeklyPaused, configKey: 'DIGEST_WEEKLY_PAUSED' },
          ].map(d => (
            <div key={d.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{d.label}</p>
                <p className="text-xs text-muted-foreground">{d.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1"
                  disabled={sendingDigest === d.key || !digestEmail}
                  onClick={() => sendDigestNow(d.key)}>
                  {sendingDigest === d.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Send Now
                </Button>
                <Switch checked={!d.paused} onCheckedChange={v => { d.setPaused(!v); saveConfig(d.configKey, !v); }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Usage Tracker */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">AI Usage Tracker</h3>
        <p className="text-xs text-muted-foreground">Tracks AI parsing calls per day (tokens used via Lovable AI gateway)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-xs text-muted-foreground">Today's Calls</p>
            <p className="text-2xl font-bold text-primary">{todayUsage.calls}</p>
          </div>
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-xs text-muted-foreground">Today's Tokens</p>
            <p className="text-2xl font-bold text-primary">{todayUsage.tokens.toLocaleString()}</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Resets daily at midnight UTC. Usage is metered via the Lovable AI gateway — check your Lovable plan for limits.</p>
        {sortedDays.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Last 7 days</p>
            {sortedDays.map(([date, data]) => (
              <div key={date} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                <span>{date === todayKey ? 'Today' : date}</span>
                <span className="text-muted-foreground">{data.calls} calls · {data.tokens.toLocaleString()} tokens</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No usage data yet</p>
        )}
      </Card>

      <DataRetentionCard />
    </div>
  );
}
