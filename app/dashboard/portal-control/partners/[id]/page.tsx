"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { fetchPartnerDetails, generatePartnerCodes } from "@/lib/api/portal-control";
import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Ticket, FileText, Map, Activity, ArrowLeft,
  Calendar, CheckCircle, Clock, XCircle, Shield
} from "lucide-react";
import { toast } from "sonner";

export default function PartnerDetailsPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get("type") || "FLEET";

  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchPartnerDetails(id as string, type);
      setDetails(data);
    } catch (err: any) {
      toast.error("Failed to load partner details. Isolation check might have failed or partner doesn't exist in this workspace.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCodes = async () => {
     try {
        setGenerating(true);
        await generatePartnerCodes(id as string, { type, count: 5, expiresInDays: 30 });
        toast.success("Batch of 5 codes generated successfully ✅");
        loadDetails();
     } catch (err: any) {
        toast.error("Generation failed");
     } finally {
        setGenerating(false);
     }
  };

  useEffect(() => {
    if (id) loadDetails();
  }, [id]);

  if (loading || !details) return <div className="p-8 text-center font-black">Loading Management Suite...</div>;

  const p = details.partner;
  const ds = details.driverStats;
  const cs = details.codeStats;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
         <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
         <ModuleHeader
            title={p.name}
            description={`${type} Partner • ${p.partnerCode} • ${p.countryCode} Workspace`}
         />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-black uppercase text-slate-400">Partner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Contact Email:</span>
                  <span className="font-bold">{p.contactEmail}</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Contact Phone:</span>
                  <span className="font-bold">{p.contactPhone}</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Status:</span>
                  <Badge variant={p.isSuspended ? "warning" : "default"}>{p.status}</Badge>
               </div>
               <div className="flex justify-between text-xs border-t pt-2">
                  <span className="text-slate-500">Workspace:</span>
                  <span className="font-bold">{p.countryCode}</span>
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-black uppercase text-slate-400">Network Statistics</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                     <p className="text-[10px] text-slate-400 uppercase font-black">Total Drivers</p>
                     <p className="text-2xl font-black">{ds.total}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                     <p className="text-[10px] text-green-600 uppercase font-black">Verified</p>
                     <p className="text-2xl font-black text-green-700">{ds.verified}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-xl">
                     <p className="text-[10px] text-orange-600 uppercase font-black">Online</p>
                     <p className="text-2xl font-black text-orange-700">{ds.online}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                     <p className="text-[10px] text-blue-600 uppercase font-black">Pending</p>
                     <p className="text-2xl font-black text-blue-700">{ds.pending}</p>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
               <CardTitle className="text-sm font-black uppercase text-slate-400">Code Management</CardTitle>
               <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleGenerateCodes} disabled={generating}>
                  {generating ? "..." : "Generate"}
               </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                     <p className="text-[10px] text-slate-400 uppercase font-black">Generated</p>
                     <p className="text-2xl font-black">{cs.total}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                     <p className="text-[10px] text-slate-400 uppercase font-black">{type === "INSURANCE" ? "Used Count" : "Used By Drivers"}</p>
                     <p className="text-2xl font-black">{cs.used}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                     <p className="text-[10px] text-slate-400 uppercase font-black">Active</p>
                     <p className="text-2xl font-black text-blue-600">{type === "INSURANCE" ? cs.active : cs.unused}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl">
                     <p className="text-[10px] text-red-600 uppercase font-black">Expired/Revoked</p>
                     <p className="text-2xl font-black text-red-700">{(cs.expired || 0) + (cs.revoked || 0)}</p>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="flex items-center gap-2">
                     <Users className="h-5 w-5 text-blue-500" />
                     {type === "INSURANCE" ? "Active Insurance Jobs" : "Linked Service Providers"}
                  </CardTitle>
                  <CardDescription>Real-time view of {type === "INSURANCE" ? "claims" : "drivers"} under this partner.</CardDescription>
               </div>
               <Button size="sm" variant="outline" className="gap-2"><Map className="h-3.5 w-3.5" /> View Map</Button>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className="px-6">{type === "INSURANCE" ? "Job ID" : "Driver Name"}</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right px-6">Action</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {type === "INSURANCE" ? (
                        details.activeJobs.map((j: any) => (
                           <TableRow key={j._id}>
                              <TableCell className="px-6 font-mono font-bold text-xs">{j._id.slice(-8).toUpperCase()}</TableCell>
                              <TableCell><Badge variant="outline">{j.status}</Badge></TableCell>
                              <TableCell className="text-right px-6"><Button variant="link" size="sm">View Job</Button></TableCell>
                           </TableRow>
                        ))
                     ) : (
                        details.drivers.map((d: any) => (
                           <TableRow key={d._id}>
                              <TableCell className="px-6 font-bold">{d.name}</TableCell>
                              <TableCell>
                                 <Badge className={d.providerProfile.isOnline ? "bg-green-600" : "bg-slate-400"}>
                                    {d.providerProfile.isOnline ? "ONLINE" : "OFFLINE"}
                                 </Badge>
                              </TableCell>
                              <TableCell className="text-right px-6"><Button variant="link" size="sm">View Profile</Button></TableCell>
                           </TableRow>
                        ))
                     )}
                     {(type === "INSURANCE" ? details.activeJobs : details.drivers).length === 0 && (
                        <TableRow>
                           <TableCell colSpan={3} className="text-center py-8 text-slate-400 font-bold">No active records found.</TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>

         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="flex items-center gap-2">
                     <Shield className="h-5 w-5 text-orange-500" />
                     Financial Control & Statements
                  </CardTitle>
                  <CardDescription>Review revenue, generate statements, and manage invoices.</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex gap-4">
                  <Button variant="outline" className="w-full gap-2 h-12 font-bold"><FileText className="h-4 w-4" /> Export CSV</Button>
                  <Button variant="outline" className="w-full gap-2 h-12 font-bold"><FileText className="h-4 w-4" /> Download PDF</Button>
               </div>
               <div className="p-4 border rounded-2xl border-orange-100 bg-orange-50/10">
                  <p className="text-[10px] font-black uppercase text-orange-600 mb-1">Billing Integration</p>
                  <p className="text-xs text-slate-600">Prepare monthly invoices and track outstanding claim payments for this partner.</p>
                  <Button disabled variant="secondary" size="sm" className="mt-3 w-full font-black text-[10px] uppercase">Coming Soon: Invoicing Module</Button>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
