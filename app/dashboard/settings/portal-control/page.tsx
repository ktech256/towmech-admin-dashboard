"use client";

import { useEffect, useState } from "react";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShieldAlert, Power, Users, LayoutDashboard, History } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPortalSettings,
  updatePortalSettings,
  triggerGlobalForceLogout,
  fetchAllPartners,
  updatePartnerPortalStatus,
  fetchPartnerAuditLogs
} from "@/lib/api/portal-control";

export default function PortalControlCenter() {
  const [activeTab, setActiveTab] = useState<"master" | "fleet" | "insurance" | "logs">("master");
  const [settings, setSettings] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const handleToggleSetting = async (field: string, value: boolean) => {
    try {
      const res = await updatePortalSettings({ [field]: value });
      setSettings(res.settings);
      toast.success("Master control updated ✅");
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

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.partnerCode.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !settings) return <div className="p-8 text-center text-muted-foreground">Loading Control Center...</div>;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Partner Portals Control Center"
        description="Master control for Fleet and Insurance self-management ecosystems."
      />

      <div className="flex gap-2 border-b pb-4 overflow-x-auto">
         {[
           { id: "master", label: "Master Control", icon: Power },
           { id: "fleet", label: "Fleet Companies", icon: Users },
           { id: "insurance", label: "Insurance Companies", icon: LayoutDashboard },
           { id: "logs", label: "Audit Logs", icon: History }
         ].map(t => (
           <Button
             key={t.id}
             variant={activeTab === t.id ? "default" : "ghost"}
             onClick={() => setActiveTab(t.id as any)}
             className="gap-2"
           >
             <t.icon className="h-4 w-4" />
             {t.label}
           </Button>
         ))}
      </div>

      {activeTab === "master" && (
        <div className="grid gap-6 md:grid-cols-2">
           <Card className="border-red-100 bg-red-50/30">
              <CardHeader>
                 <CardTitle className="text-red-800 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Emergency Shutdown Mode
                 </CardTitle>
                 <CardDescription>Immediately disables all partner portal access. Android apps remain unaffected.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                 <span className="font-bold text-red-900">{settings?.emergencyShutdownMode ? "SHUTDOWN ACTIVE" : "System Operational"}</span>
                 <Switch
                   checked={!!settings?.emergencyShutdownMode}
                   onCheckedChange={(v) => handleToggleSetting("emergencyShutdownMode", v)}
                 />
              </CardContent>
           </Card>

           <Card>
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <Power className="h-5 w-5 text-orange-500" />
                    Feature Flags
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between border-b pb-2">
                    <div>
                       <p className="font-bold">Fleet Portal Access</p>
                       <p className="text-xs text-muted-foreground">Global toggle for fleet.towmech.com</p>
                    </div>
                    <Switch
                      checked={!!settings?.fleetPortalEnabled}
                      onCheckedChange={(v) => handleToggleSetting("fleetPortalEnabled", v)}
                    />
                 </div>
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="font-bold">Insurance Portal Access</p>
                       <p className="text-xs text-muted-foreground">Global toggle for insurance.towmech.com</p>
                    </div>
                    <Switch
                      checked={!!settings?.insurancePortalEnabled}
                      onCheckedChange={(v) => handleToggleSetting("insurancePortalEnabled", v)}
                    />
                 </div>
              </CardContent>
           </Card>

           <Card className="md:col-span-2">
              <CardHeader>
                 <CardTitle>Session Invalidation</CardTitle>
                 <CardDescription>Force all active partner users to re-login immediately.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Button variant="destructive" className="gap-2" onClick={handleForceLogout}>
                    <Power className="h-4 w-4" />
                    Kill All Active Partner Sessions
                 </Button>
              </CardContent>
           </Card>
        </div>
      )}

      {(activeTab === "fleet" || activeTab === "insurance") && (
        <Card>
           <CardHeader>
              <div className="flex justify-between items-center">
                 <CardTitle>{activeTab === "fleet" ? "Fleet Partners" : "Insurance Partners"}</CardTitle>
                 <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search code or name..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                 </div>
              </div>
           </CardHeader>
           <CardContent>
              <Table>
                 <TableHeader>
                    <TableRow>
                       <TableHead>Partner</TableHead>
                       <TableHead>Code</TableHead>
                       <TableHead>Country</TableHead>
                       <TableHead>Drivers/Jobs</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {filteredPartners.filter(p => p.type === (activeTab === "fleet" ? "FLEET" : "INSURANCE")).map((p) => (
                       <TableRow key={p._id}>
                          <TableCell>
                             <div className="font-bold">{p.name}</div>
                             <div className="text-[10px] text-muted-foreground">{p.contactEmail}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{p.partnerCode}</TableCell>
                          <TableCell>
                             <Badge variant="outline">{p.countryCode}</Badge>
                          </TableCell>
                          <TableCell>
                             <div className="text-xs font-medium">Drivers: {p.metrics?.driverCount || 0}</div>
                             <div className="text-[10px] text-orange-600">Active Jobs: {p.metrics?.activeJobs || 0}</div>
                          </TableCell>
                          <TableCell>
                             <Badge className={p.isSuspended ? "bg-red-600" : "bg-green-600"}>
                                {p.isSuspended ? "SUSPENDED" : "ACTIVE"}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button
                               variant={p.isSuspended ? "outline" : "destructive"}
                               size="sm"
                               onClick={() => togglePartnerSuspension(p._id, p.isSuspended, p.type || (activeTab === "insurance" ? "INSURANCE" : "FLEET"))}
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
              <CardTitle>Partner Audit Logs</CardTitle>
              <CardDescription>Tracking all critical activities across all portals.</CardDescription>
           </CardHeader>
           <CardContent>
              <Table>
                 <TableHeader>
                    <TableRow>
                       <TableHead>Timestamp</TableHead>
                       <TableHead>Action</TableHead>
                       <TableHead>Partner</TableHead>
                       <TableHead>Performed By</TableHead>
                       <TableHead>Details</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {logs.map((log) => (
                       <TableRow key={log._id}>
                          <TableCell className="text-xs text-muted-foreground">
                             {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                             <Badge variant="secondary" className="text-[9px]">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-bold">{log.entityId || "N/A"}</TableCell>
                          <TableCell>
                             <div className="text-xs font-medium">{log.performedBy?.name}</div>
                             <div className="text-[9px] opacity-50">{log.performedBy?.email}</div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-[10px]">
                             {JSON.stringify(log.details)}
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </CardContent>
        </Card>
      )}
    </div>
  );
}
