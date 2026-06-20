"use client";

import { useEffect, useState } from "react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, ShieldAlert, Power, Users, LayoutDashboard,
  History, Plus, Map, RefreshCcw, FileText, Activity
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  fetchPortalSettings,
  updatePortalSettings,
  triggerGlobalForceLogout,
  fetchAllPartners,
  updatePartnerPortalStatus,
  fetchPartnerAuditLogs,
  createPartner,
  regeneratePartnerToken
} from "@/lib/api/portal-control";

export default function PortalControlCenter() {
  const [activeTab, setActiveTab] = useState<"master" | "fleet" | "insurance" | "logs">("master");
  const [settings, setSettings] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Fleet State
  const [isAddFleetOpen, setIsAddFleetOpen] = useState(false);
  const [newFleet, setNewFleet] = useState({
    name: "",
    partnerCode: "",
    contactEmail: "",
    contactPhone: "",
    country: "South Africa",
    countryCode: "ZA"
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sData, pData, lData] = await Promise.all([
        fetchPortalSettings(),
        fetchAllPartners(),
        fetchPartnerAuditLogs()
      ]);
      setSettings(sData.settings);
      setPartners(pData.partners);
      setLogs(lData.logs);
    } catch (err: any) {
      toast.error("Failed to load portal control data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleToggleSetting = async (field: string, value: any) => {
    try {
      const res = await updatePortalSettings({ [field]: value });
      setSettings(res.settings);
      toast.success("Settings updated ✅");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleForceLogout = async () => {
    if (!confirm("Are you sure you want to invalidate all active partner sessions? This will force every partner user to re-authenticate.")) return;
    try {
      await triggerGlobalForceLogout();
      toast.success("Global logout triggered ✅");
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const togglePartnerSuspension = async (id: string, current: boolean, type: string) => {
    try {
      await updatePartnerPortalStatus(id, { isSuspended: !current, type });
      toast.success(`Partner ${!current ? "suspended" : "activated"} ✅`);
      loadAll();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleCreateFleet = async () => {
     try {
        await createPartner({ ...newFleet, type: "FLEET" });
        toast.success("Fleet company created and invitation sent! ✅");
        setIsAddFleetOpen(false);
        setNewFleet({ name: "", partnerCode: "", contactEmail: "", contactPhone: "", country: "South Africa", countryCode: "ZA" });
        loadAll();
     } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to create fleet");
     }
  };

  const handleRegenerateCode = async (id: string) => {
     if (!confirm("Regenerate driver verification codes for this fleet?")) return;
     try {
        await regeneratePartnerToken(id);
        toast.success("Codes regenerated successfully ✅");
     } catch (err) {
        toast.error("Regeneration failed");
     }
  };

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.partnerCode.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !settings) return <div className="p-8 text-center text-muted-foreground font-bold">Initializing Control Plane...</div>;

  return (
    <div className="space-y-6 pb-20">
      <ModuleHeader
        title="Portal Control Center"
        description="Single control plane for Fleet, Insurance, and external partner ecosystems."
      />

      <div className="flex gap-2 border-b pb-4 overflow-x-auto no-scrollbar">
         {[
           { id: "master", label: "Master Control", icon: Power },
           { id: "fleet", label: "Fleet Management", icon: Users },
           { id: "insurance", label: "Insurance Management", icon: LayoutDashboard },
           { id: "logs", label: "Global Activity Logs", icon: History }
         ].map(t => (
           <Button
             key={t.id}
             variant={activeTab === t.id ? "default" : "ghost"}
             onClick={() => { setActiveTab(t.id as any); setSearch(""); }}
             className="gap-2 shrink-0"
           >
             <t.icon className="h-4 w-4" />
             {t.label}
           </Button>
         ))}
      </div>

      {activeTab === "master" && (
        <div className="grid gap-6 md:grid-cols-2">
           <Card className="border-red-100 bg-red-50/20">
              <CardHeader>
                 <CardTitle className="text-red-800 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Emergency Shutdown Mode
                 </CardTitle>
                 <CardDescription>Immediately disables all portal logins and active sessions. Safety first.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                 <span className="font-black text-red-900">{settings?.emergencyShutdownMode ? "SHUTDOWN ACTIVE" : "System Operational"}</span>
                 <Switch
                   checked={!!settings?.emergencyShutdownMode}
                   onCheckedChange={(v) => handleToggleSetting("emergencyShutdownMode", v)}
                 />
              </CardContent>
           </Card>

           <Card className="border-orange-100">
              <CardHeader>
                 <CardTitle className="text-orange-800 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Maintenance Mode
                 </CardTitle>
                 <CardDescription>Inform partners of scheduled maintenance. Restricts access gracefully.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-900">{settings?.maintenanceMode ? "MAINTENANCE ACTIVE" : "Normal Operation"}</span>
                    <Switch
                      checked={!!settings?.maintenanceMode}
                      onCheckedChange={(v) => handleToggleSetting("maintenanceMode", v)}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Maintenance Message</label>
                    <Textarea
                       value={settings?.maintenanceMessage || ""}
                       onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                       onBlur={(e) => handleToggleSetting("maintenanceMessage", e.target.value)}
                       placeholder="Enter message for partners..."
                       className="bg-white text-xs h-20"
                    />
                 </div>
              </CardContent>
           </Card>

           <Card>
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <Power className="h-5 w-5 text-blue-500" />
                    Ecosystem Feature Flags
                 </CardTitle>
                 <CardDescription>Enable or disable entire portal modules globally.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between border-b pb-3">
                    <div>
                       <p className="font-bold text-sm">Fleet Portal (fleet.towmech.com)</p>
                       <p className="text-[10px] text-muted-foreground">Master toggle for the entire fleet driver network</p>
                    </div>
                    <Switch
                      checked={!!settings?.fleetPortalEnabled}
                      onCheckedChange={(v) => handleToggleSetting("fleetPortalEnabled", v)}
                    />
                 </div>
                 <div className="flex items-center justify-between pt-1">
                    <div>
                       <p className="font-bold text-sm">Insurance Portal (insurance.towmech.com)</p>
                       <p className="text-[10px] text-muted-foreground">Master toggle for insurance claim processing</p>
                    </div>
                    <Switch
                      checked={!!settings?.insurancePortalEnabled}
                      onCheckedChange={(v) => handleToggleSetting("insurancePortalEnabled", v)}
                    />
                 </div>
              </CardContent>
           </Card>

           <Card className="border-slate-200">
              <CardHeader>
                 <CardTitle className="text-slate-800">Global Session Management</CardTitle>
                 <CardDescription>Critical action to clear all partner sessions across all countries.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Button variant="destructive" className="w-full gap-2 font-black h-12" onClick={handleForceLogout}>
                    <Power className="h-5 w-5" />
                    KILL ALL ACTIVE PARTNER SESSIONS
                 </Button>
              </CardContent>
           </Card>
        </div>
      )}

      {activeTab === "fleet" && (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex-1 max-w-sm">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Search fleet companies..."
                   className="pl-10"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700 font-bold" onClick={() => setIsAddFleetOpen(true)}>
                 <Plus className="h-4 w-4" />
                 Add Fleet Company
              </Button>
           </div>

           <Card>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-slate-50/50">
                       <TableRow>
                          <TableHead className="px-6">Partner Information</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Network</TableHead>
                          <TableHead>Revenue (Est.)</TableHead>
                          <TableHead className="text-right px-6">Actions</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {filteredPartners.filter(p => p.type === "FLEET").map((p) => (
                          <TableRow key={p._id}>
                             <TableCell className="px-6 py-4">
                                <div className="font-black text-slate-800">{p.name}</div>
                                <div className="text-[10px] text-muted-foreground font-medium">{p.contactEmail} • {p.contactPhone}</div>
                                <div className="mt-1"><Badge variant="outline" className="text-[9px] uppercase tracking-tighter">{p.countryCode} Workspace</Badge></div>
                             </TableCell>
                             <TableCell className="font-mono text-xs font-bold text-blue-600 tracking-wider">{p.partnerCode}</TableCell>
                             <TableCell>
                                <Badge className={p.isSuspended ? "bg-red-600" : "bg-green-600"}>
                                   {p.isSuspended ? "SUSPENDED" : "ACTIVE"}
                                </Badge>
                             </TableCell>
                             <TableCell>
                                <div className="flex flex-col">
                                   <span className="text-xs font-black text-slate-700">Drivers: {p.metrics?.driverCount || 0}</span>
                                   <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1"><Activity className="w-2.5 h-2.5"/> Active Jobs: {p.metrics?.activeJobs || 0}</span>
                                </div>
                             </TableCell>
                             <TableCell>
                                <div className="space-y-1">
                                   <div className="flex justify-between items-center gap-4 border-b border-slate-50 pb-0.5">
                                      <span className="text-[9px] text-slate-400 font-bold">TODAY</span>
                                      <span className="text-xs font-black text-slate-900">R{(p.metrics?.todayRevenue || 0).toFixed(2)}</span>
                                   </div>
                                   <div className="flex justify-between items-center gap-4 border-b border-slate-50 pb-0.5">
                                      <span className="text-[9px] text-slate-400 font-bold">WEEKLY</span>
                                      <span className="text-xs font-bold text-slate-700">R{(p.metrics?.weeklyRevenue || 0).toFixed(2)}</span>
                                   </div>
                                   <div className="flex justify-between items-center gap-4">
                                      <span className="text-[9px] text-slate-400 font-bold">MONTHLY</span>
                                      <span className="text-xs font-bold text-slate-700">R{(p.metrics?.monthlyRevenue || 0).toFixed(2)}</span>
                                   </div>
                                </div>
                             </TableCell>
                             <TableCell className="text-right px-6 space-x-1">
                                <Button variant="outline" size="icon" className="h-8 w-8" title="View Live Map"><Map className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" title="Regenerate Codes" onClick={() => handleRegenerateCode(p._id)}><RefreshCcw className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" title="Generate Statement"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button
                                  variant={p.isSuspended ? "outline" : "destructive"}
                                  size="sm"
                                  className="h-8 px-3 font-bold text-[10px] uppercase"
                                  onClick={() => togglePartnerSuspension(p._id, p.isSuspended, "FLEET")}
                                >
                                   {p.isSuspended ? "Activate" : "Suspend"}
                                </Button>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </div>
      )}

      {activeTab === "insurance" && (
        <Card>
           <CardHeader>
              <div className="flex justify-between items-center">
                 <div>
                    <CardTitle>Insurance Ecosystem</CardTitle>
                    <CardDescription>Manage insurance partners, codes, and utilization reports.</CardDescription>
                 </div>
                 <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search insurers..."
                      className="pl-10"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                 </div>
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow>
                       <TableHead className="px-6">Insurance Partner</TableHead>
                       <TableHead>Code</TableHead>
                       <TableHead>Usage (Total)</TableHead>
                       <TableHead>Active Claims</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="text-right px-6">Actions</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {filteredPartners.filter(p => p.type === "INSURANCE").map((p) => (
                       <TableRow key={p._id}>
                          <TableCell className="px-6 py-4">
                             <div className="font-bold text-slate-800">{p.name}</div>
                             <div className="text-[10px] text-muted-foreground">{p.contactEmail}</div>
                             <Badge variant="secondary" className="text-[8px] mt-1 uppercase">{p.countryCode}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-blue-600">{p.partnerCode}</TableCell>
                          <TableCell>
                             <div className="flex flex-col">
                                <span className="text-xs font-bold">142 Codes</span>
                                <span className="text-[10px] text-slate-500">Utilization: 84%</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="text-xs font-black text-orange-600">{p.metrics?.activeJobs || 0}</div>
                          </TableCell>
                          <TableCell>
                             <Badge className={p.isSuspended ? "bg-red-600" : "bg-green-600"}>
                                {p.isSuspended ? "SUSPENDED" : "ACTIVE"}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-right px-6 space-x-1">
                             <Button variant="outline" size="sm" className="h-8 px-3 font-bold text-[10px] uppercase">Codes</Button>
                             <Button variant="outline" size="sm" className="h-8 px-3 font-bold text-[10px] uppercase">Utilization</Button>
                             <Button
                               variant={p.isSuspended ? "outline" : "destructive"}
                               size="sm"
                               className="h-8 px-3 font-bold text-[10px] uppercase"
                               onClick={() => togglePartnerSuspension(p._id, p.isSuspended, "INSURANCE")}
                             >
                                {p.isSuspended ? "Activate" : "Suspend"}
                             </Button>
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </CardContent>
        </Card>
      )}

      {activeTab === "logs" && (
        <Card>
           <CardHeader>
              <CardTitle>System Activity Audit</CardTitle>
              <CardDescription>Comprehensive audit trail of partner and portal control activities.</CardDescription>
           </CardHeader>
           <CardContent className="p-0">
              <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow>
                       <TableHead className="px-6">Timestamp</TableHead>
                       <TableHead>Event Action</TableHead>
                       <TableHead>Entity Context</TableHead>
                       <TableHead>Performed By</TableHead>
                       <TableHead className="px-6">Details / Payload</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {logs.map((log) => (
                       <TableRow key={log._id}>
                          <TableCell className="px-6 py-3 text-[11px] text-muted-foreground whitespace-nowrap">
                             {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                             <Badge variant="secondary" className="text-[9px] font-black tracking-tight">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-[10px] font-bold text-slate-600">{log.entityId || "SYSTEM"}</TableCell>
                          <TableCell>
                             <div className="text-xs font-bold text-slate-800">{log.performedBy?.name}</div>
                             <div className="text-[9px] opacity-60">{log.performedBy?.email}</div>
                          </TableCell>
                          <TableCell className="px-6 py-3">
                             <div className="max-w-[300px] truncate text-[10px] font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                                {JSON.stringify(log.details)}
                             </div>
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </CardContent>
        </Card>
      )}

      {/* CREATE FLEET DIALOG */}
      <Dialog open={isAddFleetOpen} onOpenChange={setIsAddFleetOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Onboard Fleet Partner</DialogTitle>
            <DialogDescription>Create a new fleet company and send an activation invite.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Fleet Company Name</label>
                <Input
                   placeholder="e.g. Towing Pros South"
                   value={newFleet.name}
                   onChange={(e) => setNewFleet({...newFleet, name: e.target.value})}
                />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Fleet Partner Code</label>
                <Input
                   placeholder="e.g. TP-SOUTH"
                   value={newFleet.partnerCode}
                   onChange={(e) => setNewFleet({...newFleet, partnerCode: e.target.value.toUpperCase()})}
                />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Admin Email Address</label>
                <Input
                   type="email"
                   placeholder="admin@company.com"
                   value={newFleet.contactEmail}
                   onChange={(e) => setNewFleet({...newFleet, contactEmail: e.target.value})}
                />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Contact Phone Number</label>
                <Input
                   placeholder="+27..."
                   value={newFleet.contactPhone}
                   onChange={(e) => setNewFleet({...newFleet, contactPhone: e.target.value})}
                />
             </div>
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setIsAddFleetOpen(false)}>Cancel</Button>
             <Button
                onClick={handleCreateFleet}
                disabled={!newFleet.name || !newFleet.partnerCode || !newFleet.contactEmail}
                className="bg-orange-600 hover:bg-orange-700"
             >
                Create & Invite
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
