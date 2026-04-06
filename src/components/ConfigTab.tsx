import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ConfigTab() {
  const [people, setPeople] = useState<{ name: string; email: string; team: string }[]>([]);
  const [teams, setTeams] = useState<{ name: string }[]>([]);
  const [projects, setProjects] = useState<{ name: string }[]>([]);
  const [newPerson, setNewPerson] = useState({ name: "", email: "", team: "" });
  const [newTeam, setNewTeam] = useState("");
  const [newProject, setNewProject] = useState("");
  const [briefWindow, setBriefWindow] = useState("60");
  const [escalationDays, setEscalationDays] = useState("3");

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
    </div>
  );
}
