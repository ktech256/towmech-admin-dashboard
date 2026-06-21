"use client";

import React, { useState } from "react";
import {
  User, Shield, Briefcase, Star, DollarSign, Lock,
  FileText, LifeBuoy, History, CheckCircle, XCircle,
  AlertCircle, Smartphone, Calendar,
  TrendingUp, ExternalLink, Clock, UserCheck, ShieldAlert, Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabKey = "overview" | "jobs" | "ratings" | "financial" | "security" | "documents" | "support" | "audit";

interface Props {
  data: any;
  loading: boolean;
}

export function UserIntelligencePanel({ data, loading }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Aggregating Intelligence</p>
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="py-20 text-center text-slate-500 font-bold">
        User intelligence data unavailable.
      </div>
    );
  }

  const { user, intelligence } = data;
  const isProvider = user.role === "Mechanic" || user.role === "TowTruck";
  const isCompanyDriver = user.providerProfile?.verificationDocs?.companyVerification?.isCompanyDriver;

  const tabs: { id: TabKey; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: User },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "ratings", label: "Ratings", icon: Star },
    { id: "financial", label: "Financial", icon: DollarSign },
    { id: "security", label: "Security", icon: Lock },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "support", label: "Support", icon: LifeBuoy },
    { id: "audit", label: "Audit", icon: History },
  ];

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Info */}
      <div className="flex items-center gap-6 p-8 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden border border-slate-800">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <User size={180} />
         </div>
         <div className="h-24 w-24 rounded-3xl bg-blue-600 flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white/10 ring-8 ring-blue-600/20">
            {user.photoUrl ? (
                <img src={user.photoUrl} alt="" className="h-full w-full object-cover rounded-3xl" />
            ) : (
                user.name?.[0]
            )}
         </div>
         <div className="flex-1 space-y-2 z-10">
            <div className="flex items-center gap-3">
               <h2 className="text-3xl font-black tracking-tighter">{user.name}</h2>
               {user.accountStatus?.isSuspended && <Badge className="bg-red-600 text-white border-none font-black animate-pulse">SUSPENDED</Badge>}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
               <Badge className="bg-blue-500 text-white border-none text-[10px] font-black px-2.5 py-1">
                  {user.role === "TowTruck" ? "TOW TRUCK PROVIDER" : user.role?.toUpperCase()}
               </Badge>
               <Badge className="bg-slate-700 text-white border-none text-[10px] font-black px-2.5 py-1">WORKSPACE: {user.countryCode}</Badge>
               {user.isVerified ? (
                  <Badge className="bg-green-600 text-white border-none text-[10px] font-black px-2.5 py-1 flex gap-1 items-center"><UserCheck size={10}/> VERIFIED</Badge>
               ) : (
                  <Badge className="bg-orange-500 text-white border-none text-[10px] font-black px-2.5 py-1 flex gap-1 items-center"><Clock size={10}/> PENDING VERIFICATION</Badge>
               )}
               {isCompanyDriver && (
                  <Badge className="bg-purple-600 text-white border-none text-[10px] font-black px-2.5 py-1 uppercase">🏢 {user.partnerId?.name}</Badge>
               )}
            </div>
            <div className="text-sm text-slate-400 font-bold flex flex-wrap gap-x-6 gap-y-1 pt-1">
               <span className="flex items-center gap-2 underline decoration-blue-500/30 underline-offset-4 tracking-tight">{user.email}</span>
               <span className="flex items-center gap-2 tracking-widest">{user.phone}</span>
            </div>
         </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar border shadow-inner">
         {tabs.map((tab) => (
            <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0",
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
               )}
            >
               <tab.icon size={14} strokeWidth={3} />
               {tab.label}
            </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px] pb-10">
         {activeTab === "overview" && (
            <div className="space-y-6">
               <div className="grid gap-6 md:grid-cols-3">
                  <StatCard title="Current Health" value={user.accountStatus?.isSuspended ? "SUSPENDED" : "HEALTHY"} icon={Shield} color={user.accountStatus?.isSuspended ? "bg-red-500" : "bg-green-600"} subValue={user.accountStatus?.isSuspended ? user.accountStatus.suspendReason : "Compliant Profile"} />
                  <StatCard title="Registration Date" value={new Date(user.createdAt).toLocaleDateString()} icon={Calendar} color="bg-blue-600" subValue={`Account ID: ${user._id.slice(-8).toUpperCase()}`} />
                  <StatCard title="OTP Status" value={user.phoneVerified ? "VERIFIED" : "PENDING"} icon={Smartphone} color={user.phoneVerified ? "bg-green-600" : "bg-slate-700"} subValue={user.phoneVerifiedAt ? `Verified: ${new Date(user.phoneVerifiedAt).toLocaleDateString()}` : "Verification Required"} />
               </div>

               <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                     <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Core Profile</CardTitle></CardHeader>
                     <CardContent className="p-6 space-y-4">
                        <InfoItem label="Full Name" value={user.name} />
                        <InfoItem label="First Name" value={user.firstName} />
                        <InfoItem label="Last Name" value={user.lastName} />
                        <InfoItem label="Email Address" value={user.email} />
                        <InfoItem label="Mobile Number" value={user.phone} />
                        <InfoItem label="Date of Birth" value={user.birthday ? new Date(user.birthday).toLocaleDateString() : "N/A"} />
                     </CardContent>
                  </Card>

                  <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                     <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Localization & ID</CardTitle></CardHeader>
                     <CardContent className="p-6 space-y-4">
                        <InfoItem label="Country" value={user.country || "Not set"} />
                        <InfoItem label="Workspace Code" value={user.countryCode} />
                        <InfoItem label="Nationality" value={user.nationalityType} />
                        <InfoItem label="ID Type" value={user.identificationType} />
                        <InfoItem label="ID Number" value={user.identificationNumber} />
                        <div className="pt-2 border-t">
                            <InfoItem label="Source" value={isCompanyDriver ? "Company Ecosystem" : "Individual Enrollment"} />
                        </div>
                     </CardContent>
                  </Card>

                  {isCompanyDriver && (
                     <Card className="md:col-span-2 border-purple-100 bg-purple-50/20 shadow-sm rounded-3xl">
                        <CardHeader><CardTitle className="text-xs font-black uppercase text-purple-600 tracking-widest flex gap-2 items-center"><Building2 size={14}/> Fleet Partner Integration</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-6 p-6">
                            <InfoItem label="Associated Partner" value={user.partnerId?.name} />
                            <InfoItem label="Partner Code" value={user.partnerId?.partnerCode} />
                            <InfoItem label="Partner Category" value={user.partnerId?.type} />
                        </CardContent>
                     </Card>
                  )}
               </div>
            </div>
         )}

         {activeTab === "jobs" && (
            <div className="space-y-6">
               <div className="grid gap-4 md:grid-cols-4">
                  <StatCard title="Lifetime Requests" value={intelligence.jobStats.total} icon={Briefcase} color="bg-slate-900" />
                  <StatCard title="Completed" value={intelligence.jobStats.completed} icon={CheckCircle} color="bg-green-600" />
                  <StatCard title="Cancelled" value={intelligence.jobStats.cancelled} icon={XCircle} color="bg-red-600" />
                  <StatCard title="Live/Pending" value={intelligence.jobStats.active + intelligence.jobStats.pending} icon={TrendingUp} color="bg-blue-600" />
               </div>

               <div className="grid gap-6 md:grid-cols-2">
                  <Card className="rounded-3xl border-slate-100">
                     <CardHeader><CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Service Utilization</CardTitle></CardHeader>
                     <CardContent className="space-y-6 p-6">
                        <JobDistributionItem label="Insurance Covered" count={intelligence.jobStats.insurance} total={intelligence.jobStats.total} color="bg-blue-600" />
                        <JobDistributionItem label="Cash Settlements" count={intelligence.jobStats.cash} total={intelligence.jobStats.total} color="bg-green-600" />
                        <JobDistributionItem label="Unsuccessful / Rejected" count={intelligence.jobStats.cancelled + intelligence.jobStats.rejected} total={intelligence.jobStats.total} color="bg-red-500" />
                     </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-100 bg-slate-50/50">
                     <CardHeader><CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Performance Metrics</CardTitle></CardHeader>
                     <CardContent className="p-10 flex flex-col items-center justify-center">
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Rate</p>
                            <p className="text-5xl font-black text-slate-900">
                                {intelligence.jobStats.total > 0
                                    ? Math.round((intelligence.jobStats.completed / intelligence.jobStats.total) * 100)
                                    : 0}%
                            </p>
                            <p className="text-xs font-bold text-slate-500">of all requested services completed</p>
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </div>
         )}

         {activeTab === "ratings" && (
            <div className="space-y-6">
               <div className="grid gap-8 md:grid-cols-3">
                  <Card className="md:col-span-1 flex flex-col items-center justify-center p-12 bg-slate-900 text-white rounded-3xl shadow-xl">
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Quality Score</p>
                     <p className="text-7xl font-black">{intelligence.ratingStats.average.toFixed(1)}</p>
                     <div className="flex gap-1.5 mt-6">
                        {[1, 2, 3, 4, 5].map(s => (
                           <Star key={s} size={28} className={s <= Math.round(intelligence.ratingStats.average) ? "fill-yellow-400 text-yellow-400" : "text-slate-700"} />
                        ))}
                     </div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-8 italic">{intelligence.ratingStats.count} Verified Reviews</p>
                  </Card>

                  <Card className="md:col-span-2 rounded-3xl border-slate-100 flex flex-col justify-center">
                     <CardHeader><CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Customer Satisfaction Spectrum</CardTitle></CardHeader>
                     <CardContent className="space-y-5 p-8">
                        <RatingBar star={5} count={intelligence.ratingStats.star5} total={intelligence.ratingStats.count} />
                        <RatingBar star={4} count={intelligence.ratingStats.star4} total={intelligence.ratingStats.count} />
                        <RatingBar star={3} count={intelligence.ratingStats.star3} total={intelligence.ratingStats.count} />
                        <RatingBar star={2} count={intelligence.ratingStats.star2} total={intelligence.ratingStats.count} />
                        <RatingBar star={1} count={intelligence.ratingStats.star1} total={intelligence.ratingStats.count} />
                     </CardContent>
                  </Card>
               </div>
            </div>
         )}

         {activeTab === "financial" && (
            <div className="space-y-6">
               {isProvider ? (
                  <>
                     <div className="grid gap-6 md:grid-cols-3">
                        <StatCard title="Lifetime Earnings" value={`R${intelligence.financialStats.lifetimeEarnings.toFixed(2)}`} icon={DollarSign} color="bg-slate-900" />
                        <StatCard title="Total Settled" value={`R${intelligence.financialStats.paidPayouts.toFixed(2)}`} icon={CheckCircle} color="bg-green-600" subValue="Transferred to Bank" />
                        <StatCard title="Balance Outstanding" value={`R${intelligence.financialStats.pendingPayouts.toFixed(2)}`} icon={Clock} color="bg-orange-600" subValue="Awaiting Payout Cycle" />
                     </div>
                     <div className="grid gap-6 md:grid-cols-2">
                        <Card className="rounded-3xl border-slate-100">
                           <CardHeader><CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Income Categorization</CardTitle></CardHeader>
                           <CardContent className="space-y-6 p-8">
                              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                 <div className="flex items-center gap-3">
                                    <Shield size={20} className="text-blue-600"/>
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Insurance Jobs</span>
                                 </div>
                                 <span className="text-lg font-black text-blue-700">R{intelligence.financialStats.insuranceEarnings.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl border border-green-100">
                                 <div className="flex items-center gap-3">
                                    <DollarSign size={20} className="text-green-600"/>
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Cash Collections</span>
                                 </div>
                                 <span className="text-lg font-black text-green-700">R{intelligence.financialStats.cashEarnings.toFixed(2)}</span>
                              </div>
                           </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-slate-100 bg-slate-900 text-white flex flex-col items-center justify-center p-10 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 flex items-center justify-center rotate-12">
                                <TrendingUp size={200} />
                            </div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Month to Date</p>
                            <p className="text-4xl font-black">R{(intelligence.financialStats.lifetimeEarnings / 12).toFixed(2)}</p>
                            <p className="text-[10px] text-slate-500 font-bold mt-2 italic">*Estimated average monthly volume</p>
                        </Card>
                     </div>
                  </>
               ) : (
                  <>
                     <div className="grid gap-6 md:grid-cols-3">
                        <StatCard title="Total Spend" value={`R${intelligence.financialStats.totalSpent.toFixed(2)}`} icon={DollarSign} color="bg-slate-900" />
                        <StatCard title="Insurance Coverage" value={`R${intelligence.financialStats.insuranceCovered.toFixed(2)}`} icon={Shield} color="bg-blue-600" />
                        <StatCard title="Direct Payments" value={`R${intelligence.financialStats.cashPayments.toFixed(2)}`} icon={DollarSign} color="bg-green-600" />
                     </div>
                  </>
               )}
            </div>
         )}

         {activeTab === "security" && (
            <div className="space-y-6">
               <div className="grid gap-6 md:grid-cols-2">
                  <Card className="rounded-3xl border-slate-100 shadow-sm">
                     <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Security Health</CardTitle></CardHeader>
                     <CardContent className="space-y-5 p-6">
                        <InfoItem label="Last Login Attempt" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never Recorded"} />
                        <InfoItem label="Device State" value={user.isDeviceBlocked ? "BLOCKED ❌" : "AUTHORIZED ✅"} />
                        <InfoItem label="OTP Failure Count" value={user.otpAttempts || 0} />
                        <InfoItem label="Primary Authentication" value="OTP + Password" />
                        <div className={cn("p-4 rounded-2xl border flex items-center gap-3", user.isDeviceBlocked ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700")}>
                           <ShieldAlert size={20} />
                           <span className="text-xs font-black uppercase tracking-wider">{user.isDeviceBlocked ? "Action Required: Suspicious Activity Detected" : "Identity Verification Verified"}</span>
                        </div>
                     </CardContent>
                  </Card>
                  <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                     <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Platform Footprint</CardTitle></CardHeader>
                     <CardContent className="p-6 space-y-4">
                        <div className="p-6 bg-slate-50 rounded-2xl border text-center">
                            <Smartphone size={40} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Last Used Device</p>
                            <p className="text-lg font-black text-slate-800">Generic Android Device</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-2">IP: {user.lastLoginIp || "Unknown"}</p>
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </div>
         )}

         {activeTab === "documents" && (
            <div className="space-y-6">
                <Card className="rounded-3xl border-slate-100 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Credential Matrix</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" className="font-bold gap-2 text-[10px] h-8">
                           <ExternalLink size={12} /> OPEN VERIFICATION CENTER
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6">
                        {!isProvider ? (
                            <div className="py-20 text-center text-slate-400 font-bold italic flex flex-col gap-3 items-center">
                                <Shield size={40} className="opacity-20" />
                                <span>Customers do not require verification documents.</span>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <DocStatusTile label="National ID" status={user.providerProfile?.verificationDocs?.idDocument?.status} />
                                <DocStatusTile label="Selfie Profile" status={user.providerProfile?.verificationDocs?.selfie?.status} />
                                <DocStatusTile label="Driver License" status={user.providerProfile?.verificationDocs?.driverLicense?.status} />
                                <DocStatusTile label="Global Status" status={user.providerProfile?.verificationStatus} isPrimary />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
         )}

         {activeTab === "support" && (
            <div className="space-y-6">
               <div className="grid gap-6 md:grid-cols-3">
                  <StatCard title="Lifetime Tickets" value={intelligence.supportStats.total} icon={LifeBuoy} color="bg-blue-600" />
                  <StatCard title="Active Inquiries" value={intelligence.supportStats.open} icon={AlertCircle} color="bg-orange-500" />
                  <StatCard title="Resolved cases" value={intelligence.supportStats.closed} icon={CheckCircle} color="bg-green-600" />
               </div>
               <Card className="rounded-3xl border-slate-100 overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between">
                     <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Recent Inbound Tickets</CardTitle>
                     <Button variant="link" className="text-blue-600 font-black text-[10px] uppercase p-0">Detailed Support History</Button>
                  </CardHeader>
                  <CardContent className="p-20 text-center text-slate-300 font-black flex flex-col items-center gap-3 uppercase tracking-tighter">
                     <History size={40} className="opacity-20" />
                     Support Thread Integration coming in next patch.
                  </CardContent>
               </Card>
            </div>
         )}

         {activeTab === "audit" && (
            <div className="space-y-4">
               <Card className="rounded-3xl border-slate-100 overflow-hidden shadow-sm">
                  <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Institutional Audit Trail</CardTitle></CardHeader>
                  <CardContent className="p-0">
                     <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                        <table className="w-full text-left text-[11px]">
                           <thead className="bg-slate-50/50 border-b sticky top-0 z-10">
                              <tr>
                                 <th className="px-8 py-4 font-black uppercase text-slate-400">Timestamp</th>
                                 <th className="px-8 py-4 font-black uppercase text-slate-400">Action Code</th>
                                 <th className="px-8 py-4 font-black uppercase text-slate-400">Performing Official</th>
                                 <th className="px-8 py-4 font-black uppercase text-slate-400">Detailed Metadata</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {intelligence.auditLogs.map((log: any) => (
                                 <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4 whitespace-nowrap text-slate-500 font-bold">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="px-8 py-4"><Badge variant="outline" className="text-[9px] font-black border-slate-300">{log.action}</Badge></td>
                                    <td className="px-8 py-4 font-black text-slate-800">{log.performedBy?.name || "Automated System"}</td>
                                    <td className="px-8 py-4 font-mono text-[10px] text-slate-400 max-w-[300px] truncate">{JSON.stringify(log.details)}</td>
                                 </tr>
                              ))}
                              {intelligence.auditLogs.length === 0 && (
                                 <tr><td colSpan={4} className="text-center py-24 text-slate-400 font-black uppercase tracking-widest opacity-50">Empty Audit Trail</td></tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </CardContent>
               </Card>
            </div>
         )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black text-slate-800">{value || "—"}</span>
    </div>
  );
}

function JobDistributionItem({ label, count, total, color }: any) {
   const percent = total > 0 ? (count / total) * 100 : 0;
   return (
      <div className="space-y-2">
         <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-800">{count} Events <span className="text-slate-400 ml-1">({percent.toFixed(1)}%)</span></span>
         </div>
         <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${percent}%` }}></div>
         </div>
      </div>
   );
}

function RatingBar({ star, count, total }: any) {
   const percent = total > 0 ? (count / total) * 100 : 0;
   return (
      <div className="flex items-center gap-4">
         <span className="text-[10px] font-black text-slate-400 w-16 uppercase">{star} Stars</span>
         <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
         </div>
         <span className="text-[10px] font-black text-slate-800 w-12 text-right">{count}</span>
      </div>
   );
}

function DocStatusTile({ label, status, isPrimary = false }: any) {
    const s = String(status || "").toUpperCase();
    const color = s === "APPROVED" || s === "VERIFIED" ? "bg-green-500" : s === "PENDING" ? "bg-yellow-500" : "bg-slate-300";
    return (
        <div className={cn("p-5 rounded-2xl border transition-all hover:shadow-md", isPrimary ? "bg-blue-50 border-blue-100" : "bg-slate-50/50 border-slate-100")}>
            <p className={cn("text-[9px] font-black uppercase mb-2", isPrimary ? "text-blue-400" : "text-slate-400")}>{label}</p>
            <Badge className={cn("text-[9px] border-none text-white font-black px-2 py-0.5", color)}>{s || "NOT SUBMITTED"}</Badge>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, subValue }: any) {
    return (
      <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white group hover:scale-[1.02] transition-transform duration-300">
        <CardContent className="p-6 flex items-center gap-5">
          <div className={cn("p-3.5 rounded-2xl shadow-lg ring-4 ring-opacity-20", color, color.replace('bg-', 'ring-'))}>
            <Icon size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-0.5">{title}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
            {subValue && <p className="text-[10px] font-bold text-slate-500 line-clamp-1">{subValue}</p>}
          </div>
        </CardContent>
      </Card>
    );
}
