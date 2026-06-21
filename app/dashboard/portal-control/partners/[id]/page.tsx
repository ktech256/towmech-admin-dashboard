"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { fetchPartnerDetails, generatePartnerCodes, updatePartnerDetails, fetchPartnerStatements, revokePartnerCode } from "@/lib/api/portal-control";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Ticket, FileText, Map, Activity, ArrowLeft,
  Calendar, CheckCircle, Clock, XCircle, Shield, Edit,
  BarChart3, CreditCard, LayoutDashboard, Search, Download, Plus
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

export default function PartnerDetailsPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") || "FLEET";

  const [activeTab, setActiveTab] = useState<"info" | "drivers" | "codes" | "statements" | "invoices" | "analytics">("info");
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Partner State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);

  // Statements State
  const [statements, setStatements] = useState<any>(null);
  const [loadingStatements, setLoadingLoadingStatements] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchPartnerDetails(id as string, type);
      setDetails(data);
    } catch (err: any) {
      toast.error("Failed to load partner details.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadStatements = async () => {
     try {
        setLoadingLoadingStatements(true);
        const data = await fetchPartnerStatements(id as string, { type, ...dateRange });
        setStatements(data);
     } catch (err) {
        toast.error("Failed to load statements");
     } finally {
        setLoadingLoadingStatements(false);
     }
  };

  useEffect(() => {
    if (id) loadDetails();
  }, [id]);

  useEffect(() => {
     if (activeTab === "statements") loadStatements();
  }, [activeTab]);

  const handleEditPartner = async () => {
     try {
        await updatePartnerDetails(id as string, { ...editingPartner, type });
        toast.success("Partner updated successfully ✅");
        setIsEditOpen(false);
        loadDetails();
     } catch (err: any) {
        toast.error(err.response?.data?.message || "Update failed");
     }
  };

  const handleRevoke = async (codeId: string) => {
     if (!confirm("Are you sure you want to revoke this code?")) return;
     try {
        await revokePartnerCode(id as string, codeId, type);
        toast.success("Code revoked ✅");
        loadDetails();
     } catch (err) {
        toast.error("Action failed");
     }
  };

  if (loading || !details) return <div className="p-8 text-center font-black">Initializing Management Plane...</div>;

  const p = details.partner;
  const ds = details.driverStats;
  const cs = details.codeStats;
  const an = details.analytics;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
         <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
         <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-800">{p.name}</h1>
            <p className="text-sm text-slate-500 font-bold">{type} Partner • {p.partnerCode} • {p.countryCode} Workspace</p>
         </div>
         <Button variant="outline" className="gap-2 font-bold" onClick={() => { setEditingPartner(p); setIsEditOpen(true); }}>
            <Edit className="h-4 w-4" /> Edit Details
         </Button>
      </div>

      <div className="flex gap-2 border-b pb-4 overflow-x-auto no-scrollbar">
         {[
           { id: "info", label: "Overview", icon: LayoutDashboard },
           { id: "drivers", label: type === "INSURANCE" ? "Claims" : "Drivers", icon: Users },
           { id: "codes", label: "Code Management", icon: Ticket },
           { id: "statements", label: "Statements", icon: FileText },
           { id: "invoices", label: "Invoices", icon: CreditCard },
           { id: "analytics", label: "Analytics", icon: BarChart3 }
         ].map(t => (
           <Button
             key={t.id}
             variant={activeTab === t.id ? "default" : "ghost"}
             onClick={() => setActiveTab(t.id as any)}
             className="gap-2 shrink-0 font-bold"
           >
             <t.icon className="h-4 w-4" />
             {t.label}
           </Button>
         ))}
      </div>

      {activeTab === "info" && (
         <div className="grid gap-6 md:grid-cols-3">
            <Card>
               <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-slate-400">Account Lifecycle</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-500 font-bold">Created Date:</span>
                     <span className="font-black text-slate-800">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-500 font-bold">Onboarded By:</span>
                     <span className="font-black text-blue-600">{p.createdBy?.name || "System"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-500 font-bold">Portal Status:</span>
                     <Badge variant={p.isSuspended ? "warning" : "default"}>{p.status}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-500 font-bold">Activation:</span>
                     <Badge variant="secondary">{p.invitationStatus || "Unknown"}</Badge>
                  </div>
                  {p.notes && (
                     <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Internal Notes</p>
                        <p className="text-xs text-slate-600">{p.notes}</p>
                     </div>
                  )}
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-slate-400">Network Statistics</CardTitle></CardHeader>
               <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[10px] text-slate-400 uppercase font-black">Total {type === "INSURANCE" ? "Claims" : "Drivers"}</p>
                        <p className="text-2xl font-black">{type === "INSURANCE" ? an.completedCount : ds.total}</p>
                     </div>
                     <div className="p-3 bg-green-50 rounded-xl">
                        <p className="text-[10px] text-green-600 uppercase font-black">Verified</p>
                        <p className="text-2xl font-black text-green-700">{ds.verified}</p>
                     </div>
                     <div className="p-3 bg-orange-50 rounded-xl">
                        <p className="text-[10px] text-orange-600 uppercase font-black">Active (Live)</p>
                        <p className="text-2xl font-black text-orange-700">{type === "INSURANCE" ? details.activeJobs.length : ds.online}</p>
                     </div>
                     <div className="p-3 bg-blue-50 rounded-xl">
                        <p className="text-[10px] text-blue-600 uppercase font-black">Pending</p>
                        <p className="text-2xl font-black text-blue-700">{ds.pending}</p>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase text-slate-400">Revenue (Today)</CardTitle></CardHeader>
               <CardContent className="flex flex-col justify-center h-24">
                  <h3 className="text-4xl font-black text-slate-800">R{an.todayRevenue.toFixed(2)}</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-1">
                     <Activity className="h-2.5 w-2.5 text-green-500" /> Currently handling {details.activeJobs.length} live {type === "INSURANCE" ? "claims" : "jobs"}.
                  </p>
               </CardContent>
            </Card>
         </div>
      )}

      {activeTab === "drivers" && (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="flex items-center gap-2">
                     <Users className="h-5 w-5 text-blue-500" />
                     {type === "INSURANCE" ? "Active Insurance Jobs" : "Linked Service Providers"}
                  </CardTitle>
                  <CardDescription>Comprehensive list of all {type === "INSURANCE" ? "claims" : "drivers"} associated with this partner.</CardDescription>
               </div>
               <Button size="sm" variant="outline" className="gap-2 font-bold"><Map className="h-3.5 w-3.5" /> View Live Map</Button>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader className="bg-slate-50/50">
                     <TableRow>
                        <TableHead className="px-6">{type === "INSURANCE" ? "Job Context" : "Driver Information"}</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead className="text-right px-6">Action</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {type === "INSURANCE" ? (
                        details.activeJobs.map((j: any) => (
                           <TableRow key={j._id}>
                              <TableCell className="px-6">
                                 <div className="font-black text-slate-800">CLAIM #{j._id.slice(-8).toUpperCase()}</div>
                                 <div className="text-[10px] text-slate-500 font-bold">{j.assignedTo?.name || "Searching..."}</div>
                              </TableCell>
                              <TableCell><Badge variant="outline" className="font-black text-[9px]">{j.status}</Badge></TableCell>
                              <TableCell><span className="text-xs font-bold text-slate-600">Active</span></TableCell>
                              <TableCell className="text-right px-6"><Button variant="link" className="font-black text-[10px] uppercase">Details</Button></TableCell>
                           </TableRow>
                        ))
                     ) : (
                        details.drivers.map((d: any) => (
                           <TableRow key={d._id}>
                              <TableCell className="px-6">
                                 <div className="font-black text-slate-800">{d.name}</div>
                                 <div className="text-[10px] text-slate-500 font-bold">{d.phone} • {d.role}</div>
                              </TableCell>
                              <TableCell><Badge variant={d.providerProfile.verificationStatus === "APPROVED" ? "default" : "secondary"}>{d.providerProfile.verificationStatus}</Badge></TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-1.5">
                                    <div className={`h-2 w-2 rounded-full ${d.providerProfile.isOnline ? "bg-green-500" : "bg-slate-300"}`}></div>
                                    <span className="text-xs font-bold text-slate-600">{d.providerProfile.isOnline ? "ONLINE" : "OFFLINE"}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-right px-6"><Button variant="link" className="font-black text-[10px] uppercase">View Profile</Button></TableCell>
                           </TableRow>
                        ))
                     )}
                     {(type === "INSURANCE" ? details.activeJobs : details.drivers).length === 0 && (
                        <TableRow>
                           <TableCell colSpan={4} className="text-center py-20 text-slate-400 font-bold">No active records found for this partner.</TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      )}

      {activeTab === "codes" && (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="flex items-center gap-2">
                     <Ticket className="h-5 w-5 text-orange-500" />
                     {type === "INSURANCE" ? "Policy Code Management" : "Driver Verification Codes"}
                  </CardTitle>
                  <CardDescription>Generate and manage verification tokens for {type === "INSURANCE" ? "policy holders" : "fleet drivers"}.</CardDescription>
               </div>
               <Button className="bg-orange-600 hover:bg-orange-700 font-bold gap-2" onClick={() => generatePartnerCodes(id as string, { type, count: 5, expiresInDays: 30 }).then(() => { toast.success("Codes generated ✅"); loadDetails(); })}>
                  <Plus className="h-4 w-4" /> Generate Batch
               </Button>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader className="bg-slate-50/50">
                     <TableRow>
                        <TableHead className="px-6">Verification Code</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Used By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right px-6">Action</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {details.codes.map((c: any) => (
                        <TableRow key={c._id}>
                           <TableCell className="px-6 font-mono font-black text-blue-600 text-sm tracking-widest">{c.code}</TableCell>
                           <TableCell className="text-xs text-slate-500 font-bold">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                           <TableCell>
                              <div className="text-xs font-bold text-slate-800">
                                 {type === "INSURANCE" ? `${c.usage?.usedCount} / ${c.usage?.maxUses}` : (c.usedBy?.name || "—")}
                              </div>
                           </TableCell>
                           <TableCell>
                              {type === "INSURANCE" ? (
                                 <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "ACTIVE" : "INACTIVE"}</Badge>
                              ) : (
                                 <Badge variant={c.isRevoked ? "warning" : (c.usedBy ? "secondary" : "default")}>
                                    {c.isRevoked ? "REVOKED" : (c.usedBy ? "USED" : "ACTIVE")}
                                 </Badge>
                              )}
                           </TableCell>
                           <TableCell className="text-right px-6">
                              <Button variant="link" className="text-red-600 font-black text-[10px] uppercase" onClick={() => handleRevoke(c._id)}>Revoke</Button>
                           </TableCell>
                        </TableRow>
                     ))}
                     {details.codes.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 font-black">No codes generated yet.</TableCell></TableRow>
                     )}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      )}

      {activeTab === "statements" && (
         <div className="space-y-6">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-black uppercase text-slate-400">Statement Generator</CardTitle>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <Input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="h-auto border-none bg-transparent text-[10px] font-bold p-0 w-24" />
                        <span className="text-[10px] text-slate-400">to</span>
                        <Input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="h-auto border-none bg-transparent text-[10px] font-bold p-0 w-24" />
                     </div>
                     <Button size="sm" className="font-bold" onClick={loadStatements}>Generate</Button>
                  </div>
               </CardHeader>
               <CardContent>
                  <div className="flex justify-between items-center border-t pt-4">
                     <div className="flex gap-4">
                        <Button variant="outline" size="sm" className="gap-2 font-bold"><Download className="h-3.5 w-3.5" /> Export CSV</Button>
                        <Button variant="outline" size="sm" className="gap-2 font-bold"><Download className="h-3.5 w-3.5" /> Download PDF</Button>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Revenue</p>
                        <p className="text-2xl font-black text-slate-800">R{statements?.totalRevenue?.toFixed(2) || "0.00"}</p>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardContent className="p-0">
                  <Table>
                     <TableHeader className="bg-slate-50/50">
                        <TableRow>
                           <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Date</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Ref ID</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Context</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Amount</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Receipt</th>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {loadingStatements ? (
                           <tr><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-400">Analyzing transactions...</TableCell></tr>
                        ) : statements?.jobs.map((j: any) => (
                           <TableRow key={j._id}>
                              <TableCell className="px-6 text-xs font-bold text-slate-600">{new Date(j.completedAt).toLocaleDateString()}</TableCell>
                              <TableCell className="text-xs font-mono font-bold text-slate-800">#{j._id.slice(-8).toUpperCase()}</TableCell>
                              <TableCell className="text-xs font-bold text-slate-700">{j.assignedTo?.name || "Insurance Job"}</TableCell>
                              <TableCell className="text-sm font-black">R{(j.pricing?.providerAmountDue || j.pricing?.estimatedTotal || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-right px-6"><Button variant="link" className="text-[10px] font-black uppercase underline">View</Button></TableCell>
                           </TableRow>
                        ))}
                        {(!statements || statements.jobs.length === 0) && !loadingStatements && (
                           <tr><TableCell colSpan={5} className="text-center py-20 font-black text-slate-400">No finalized transactions for this period.</TableCell></tr>
                        )}
                     </TableBody>
                  </Table>
               </CardContent>
            </Card>
         </div>
      )}

      {activeTab === "invoices" && (
         <Card className="border-orange-100 bg-orange-50/10">
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-500" />
                  Billing & Invoicing Suite
               </CardTitle>
               <CardDescription>Preparation area for automated partner billing and claim settlement tracking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-6 bg-white border rounded-2xl shadow-sm">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Outstanding Balance</p>
                     <p className="text-3xl font-black text-red-600">R0.00</p>
                     <p className="text-[10px] text-slate-500 font-bold mt-2 italic">Next automatic invoice generation scheduled for end of month.</p>
                  </div>
                  <div className="p-6 bg-white border rounded-2xl shadow-sm">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Settled (Lifetime)</p>
                     <p className="text-3xl font-black text-green-600">R{an.monthlyRevenue.toFixed(2)}</p>
                     <p className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5 text-green-500" /> All previous claim periods finalized.</p>
                  </div>
               </div>
               <div className="flex justify-center items-center py-20 border border-dashed rounded-3xl bg-white/50">
                  <div className="text-center space-y-3">
                     <Clock className="h-10 w-10 text-slate-300 mx-auto" />
                     <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Invoicing Module: COMING SOON</p>
                     <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto">This partner is currently under Manual Settlement terms. Automatic billing will be enabled in Phase 3.</p>
                  </div>
               </div>
            </CardContent>
         </Card>
      )}

      {activeTab === "analytics" && (
         <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
               {[
                  { label: "Today's Revenue", val: `R${an.todayRevenue.toFixed(2)}`, color: "text-slate-800" },
                  { label: "Weekly Revenue", val: `R${an.weeklyRevenue.toFixed(2)}`, color: "text-blue-600" },
                  { label: "Monthly Revenue", val: `R${an.monthlyRevenue.toFixed(2)}`, color: "text-orange-600" },
                  { label: "Completed Success", val: `${an.completedCount} Jobs`, color: "text-green-600" }
               ].map(stat => (
                  <Card key={stat.label}>
                     <CardContent className="p-5">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-xl font-black ${stat.color}`}>{stat.val}</p>
                     </CardContent>
                  </Card>
               ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
               <Card>
                  <CardHeader><CardTitle className="text-sm font-black uppercase">Network Performance</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 uppercase">Fulfillment Rate</span>
                        <span className="text-xs font-black text-green-600">{(an.completedCount / (an.completedCount + an.cancelledCount) * 100 || 0).toFixed(1)}%</span>
                     </div>
                     <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${(an.completedCount / (an.completedCount + an.cancelledCount) * 100 || 0)}%` }}></div>
                     </div>
                     <div className="flex items-center justify-between mt-4">
                        <span className="text-xs font-bold text-slate-600 uppercase">Cancellation Rate</span>
                        <span className="text-xs font-black text-red-600">{(an.cancelledCount / (an.completedCount + an.cancelledCount) * 100 || 0).toFixed(1)}%</span>
                     </div>
                     <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full" style={{ width: `${(an.cancelledCount / (an.completedCount + an.cancelledCount) * 100 || 0)}%` }}></div>
                     </div>
                  </CardContent>
               </Card>
               <Card>
                  <CardHeader><CardTitle className="text-sm font-black uppercase text-slate-400">Activity Overview</CardTitle></CardHeader>
                  <CardContent className="flex items-center justify-center py-10">
                     <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-slate-200 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enhanced Charts COMING SOON</p>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      )}

      {/* EDIT PARTNER DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Edit Partner Details</DialogTitle>
            <DialogDescription>Update the primary information and internal notes for this ecosystem partner.</DialogDescription>
          </DialogHeader>
          {editingPartner && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Company Name</label>
                  <Input value={editingPartner.name} onChange={(e) => setEditingPartner({...editingPartner, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Partner Code</label>
                  <Input value={editingPartner.partnerCode} onChange={(e) => setEditingPartner({...editingPartner, partnerCode: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Admin Email Address</label>
                  <Input type="email" value={editingPartner.contactEmail} onChange={(e) => setEditingPartner({...editingPartner, contactEmail: e.target.value})} />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Contact Phone Number</label>
                  <Input value={editingPartner.contactPhone} onChange={(e) => setEditingPartner({...editingPartner, contactPhone: e.target.value})} />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Internal Management Notes</label>
                  <Textarea value={editingPartner.notes || ""} onChange={(e) => setEditingPartner({...editingPartner, notes: e.target.value})} placeholder="Add details about contract, support, or special arrangements..." className="text-xs h-20" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditPartner} className="bg-slate-900 text-white font-bold">Save Changes ✅</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
