"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api/axios";

import { ModuleHeader } from "@/components/dashboard/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  fetchPendingProviders,
  fetchApprovedProviders,
  fetchRejectedProviders,
  approveProvider,
  rejectProvider,
  fetchProviderVerification,
} from "@/lib/api/providers";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useCountryStore } from "@/lib/store/countryStore";
import { TrendingUp, BarChart, DollarSign, XCircle, CheckCircle } from "lucide-react";

type Provider = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  countryCode?: string;
  rating?: number;
  ratingCount?: number;

  providerProfile?: {
    verificationStatus?: string;
    jobPreference?: string;
    rejectReason?: string | null; // optional if backend provides it
    rejectedReason?: string | null; // common alternate field
    rejectionReason?: string | null; // common alternate field
  };

  accountStatus?: {
    isSuspended?: boolean;
    isBanned?: boolean;
    isArchived?: boolean;
  };

  identificationType?: "SA_ID" | "PASSPORT";
  identificationNumber?: string;
  passportCountry?: string | null;
};

type VerificationDoc = {
  url?: string | null;
  status?: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "VERIFIED" | "UPDATE_REQUIRED" | "EXPIRED";
  reason?: string | null;
  updatedAt?: string | null;
  submittedAt?: string | null;
  captureTimestamp?: string | null;

  expiryDate?: string | null;
  expiryType?: "NA" | "HAS_EXPIRY";
  updateRequired?: boolean;
  updateReason?: string | null;
  gracePeriodEnd?: string | null;

  history?: Array<{
    url: string;
    status: string;
    reason?: string;
    submittedAt?: string;
    updatedAt?: string;
    captureTimestamp?: string;
    expiryDate?: string;
    updateReason?: string;
  }>;
};

type VerificationDocs = {
  idDocument?: VerificationDoc;
  driverLicense?: VerificationDoc;
  selfie?: VerificationDoc;
  vehicleRC1?: VerificationDoc;
  huruCriminalCheck?: VerificationDoc;
  proofOfResidence?: VerificationDoc;
  proofOfVehicle?: VerificationDoc;
  vehicleLicenseDisc?: VerificationDoc;
};

type TabKey = "pending" | "approved" | "rejected";

function withApiPrefix(path: string) {
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const alreadyHasApi = base.endsWith("/api") || base.includes("/api/");
  return `${alreadyHasApi ? "" : "/api"}${path.startsWith("/") ? "" : "/"}${path}`;
}

function normalizeRole(r?: string) {
  const x = String(r || "").trim().toUpperCase();
  if (x === "TOW_TRUCK" || x === "TOWTRUCK") return "Tow Truck";
  if (x === "MECHANIC") return "Mechanic";
  return x || "—";
}

function getRejectReason(p?: Provider | null) {
  return (
    p?.providerProfile?.rejectReason ||
    p?.providerProfile?.rejectedReason ||
    p?.providerProfile?.rejectionReason ||
    null
  );
}

const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slonevia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

// Phase 6: Complete Verification Document Matrix Implementation
export default function ProvidersPage() {
  const [tab, setTab] = useState<TabKey>("pending");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [maxRating, setMaxRating] = useState("5");

  // ✅ country scoping (multi-country)
  const { countryCode } = useCountryStore();

  // ✅ docs modal state
  const [openDocsModal, setOpenDocsModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [docs, setDocs] = useState<VerificationDocs | null>(null);

  const [countrySearch, setCountrySearch] = useState("");

  // ✅ reject modal state (with reason)
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Provider | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  // ✅ scorecard modal state
  const [openScorecardModal, setOpenScorecardModal] = useState(false);
  const [scorecardData, setScorecardData] = useState<any>(null);
  const [scorecardLoading, setScorecardLoading] = useState(false);

  const loadProviders = async (activeTab: TabKey) => {
    setLoading(true);
    setError(null);

    try {
      let data;
      const queryParams = `?minRating=${minRating}&maxRating=${maxRating}`;
      if (activeTab === "pending") data = await api.get(`/api/admin/providers/providers/pending${queryParams}`);
      else if (activeTab === "approved") data = await api.get(`/api/admin/providers/providers/approved${queryParams}`);
      else data = await api.get(`/api/admin/providers/providers/rejected${queryParams}`);

      const list = data?.data?.providers || data?.data?.data || [];
      setProviders(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load providers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!countryCode) {
      setProviders([]);
      setLoading(false);
      setError("Please select a country first.");
      return;
    }
    loadProviders(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, countryCode, minRating, maxRating]);

  const filteredProviders = useMemo(() => {
    const list = Array.isArray(providers) ? providers : [];
    const s = search.trim().toLowerCase();
    if (!s) return list;

    return list.filter((p) => {
      return (
        (p.name || "").toLowerCase().includes(s) ||
        (p.email || "").toLowerCase().includes(s) ||
        (p.role || "").toLowerCase().includes(s) ||
        (p.providerProfile?.jobPreference || "").toLowerCase().includes(s) ||
        (p.providerProfile?.verificationStatus || "").toLowerCase().includes(s)
      );
    });
  }, [providers, search]);

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      await approveProvider(id);
      await loadProviders(tab);
      setOpenDocsModal(false);
      setOpenRejectModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Approve failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ✅ reject with reason (tries multiple payload keys so it works with most backends)
  const handleReject = async (id: string, reasonText: string) => {
    const reason = reasonText.trim();
    if (!reason) {
      alert("Please add a reject reason.");
      return;
    }

    setActionLoadingId(id);
    try {
      // rejectProvider signature may be (id) only; passing a second arg is safe only if your wrapper supports it.
      // So we call it, and if it fails, we fallback to direct PATCH with common payload keys.
      try {
        // @ts-ignore - allow optional reason if implemented
        await rejectProvider(id, { reason, rejectReason: reason, message: reason });
      } catch (_e) {
        await api.patch(withApiPrefix(`/admin/providers/${id}/reject`), {
          reason,
          rejectReason: reason,
          message: reason,
        });
      }

      await loadProviders(tab);
      setOpenDocsModal(false);
      setOpenRejectModal(false);
      setRejectTarget(null);
      setRejectReason("");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Reject failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDocs = async (provider: Provider) => {
    setSelectedProvider(provider);
    setDocsLoading(true);
    setDocsError(null);
    setDocs(null);
    setOpenDocsModal(true);

    try {
      const data = await fetchProviderVerification(provider._id);
      if (data?.provider) {
        setSelectedProvider(data.provider);
      }
      setDocs(data?.verificationDocs || null);
    } catch (err: any) {
      setDocsError(err?.response?.data?.message || "Failed to load documents.");
    } finally {
      setDocsLoading(false);
    }
  };

  const handleApproveDoc = async (field: string) => {
    if (!selectedProvider) return;
    try {
      const payload: any = {};
      if (field === "idDocument") {
        payload.asType = selectedProvider.identificationType;
      }
      const res = await api.patch(`/api/admin/providers/providers/${selectedProvider._id}/documents/${field}/approve`, payload);
      setDocs(res.data.verificationDocs);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Approve doc failed");
    }
  };

  const handleRejectDoc = async (field: string) => {
    if (!selectedProvider) return;
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      const res = await api.patch(`/api/admin/providers/providers/${selectedProvider._id}/documents/${field}/reject`, { reason });
      setDocs(res.data.verificationDocs);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Reject doc failed");
    }
  };

  const handleRequireUpdate = async (field: string) => {
    if (!selectedProvider) return;
    const reason = prompt("Reason for document update (e.g. Expired, Blurry):");
    if (reason === null) return;
    try {
      const res = await api.patch(`/api/admin/providers/providers/${selectedProvider._id}/documents/${field}/require-update`, { reason });
      setDocs(res.data.verificationDocs);
      alert("Update request sent to provider ✅");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Update request failed");
    }
  };

  const handleSetExpiry = async (field: string, expiryType: string, expiryDate?: string) => {
    if (!selectedProvider) return;
    try {
      const res = await api.patch(`/api/admin/providers/providers/${selectedProvider._id}/documents/${field}/expiry`, { expiryDate, expiryType });
      setDocs(res.data.verificationDocs);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Expiry update failed");
    }
  };

  const handleUpdateIdentification = async (payload: any) => {
    if (!selectedProvider) return;
    try {
      const res = await api.patch(`/api/admin/providers/providers/${selectedProvider._id}/identification`, payload);
      setSelectedProvider(res.data.provider);
      alert("Identification updated ✅");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Update failed");
    }
  };

  const handleFinalApprove = async () => {
    if (!selectedProvider) return;
    try {
      await api.patch(`/api/admin/providers/providers/${selectedProvider._id}/final-approve`);
      alert("Provider fully verified! ✅");
      setOpenDocsModal(false);
      loadProviders(tab);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Final approve failed");
    }
  };

  const openReject = (provider: Provider) => {
    setRejectTarget(provider);
    setRejectReason(getRejectReason(provider) || "");
    setOpenRejectModal(true);
  };

  const openScorecard = async (provider: Provider) => {
    setSelectedProvider(provider);
    setScorecardLoading(true);
    setOpenScorecardModal(true);
    try {
      const res = await api.get(`/api/admin/providers/providers/${provider._id}/financials`);
      setScorecardData(res.data);
    } catch (err) {
      alert("Failed to load scorecard");
    } finally {
      setScorecardLoading(false);
    }
  };

  // ✅ Status actions (uses adminUsers routes)
  const suspendUser = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(withApiPrefix(`/admin/users/${id}/suspend`), {
        reason: "Suspended by admin",
      });
      await loadProviders(tab);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Suspend failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const unsuspendUser = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(withApiPrefix(`/admin/users/${id}/unsuspend`), {});
      await loadProviders(tab);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Unsuspend failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const banUser = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(withApiPrefix(`/admin/users/${id}/ban`), {
        reason: "Banned by admin",
      });
      await loadProviders(tab);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Ban failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const unbanUser = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.patch(withApiPrefix(`/admin/users/${id}/unban`), {});
      await loadProviders(tab);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Unban failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderDoc = (label: string, doc?: VerificationDoc, field?: string) => {
    const url = doc?.url;
    const status = doc?.status || "NOT_SUBMITTED";
    const expiryType = doc?.expiryType || "NA";
    const expiryDate = doc?.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : "";

    const daysRemaining = doc?.expiryDate
        ? Math.ceil((new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const filteredCountries = countrySearch.trim()
        ? ALL_COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
        : [];

    return (
      <div className="space-y-2 rounded-lg border p-3 bg-white">
        {field === "idDocument" && selectedProvider && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 space-y-2">
                <div className="text-[10px] font-black text-blue-600 uppercase">Registration ID Details</div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Type</div>
                        <div className="text-sm font-bold text-slate-800">
                            {selectedProvider.identificationType === "SA_ID"
                                ? "South African ID"
                                : selectedProvider.identificationType === "PASSPORT"
                                    ? "Passport"
                                    : "Unknown Type"}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Number</div>
                        <div className="text-sm font-black text-slate-800 tracking-wider">
                            {selectedProvider.identificationNumber || "—"}
                        </div>
                    </div>
                </div>

                {selectedProvider.identificationType === "PASSPORT" && (
                    <div className="pt-2 border-t border-blue-100">
                        <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">Passport Country</div>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full text-xs font-bold p-2 border rounded bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Search & select country..."
                                value={selectedProvider.passportCountry || countrySearch}
                                onChange={(e) => {
                                    setCountrySearch(e.target.value);
                                    if (selectedProvider.passportCountry) {
                                        handleUpdateIdentification({ passportCountry: null });
                                    }
                                }}
                            />
                            {!selectedProvider.passportCountry && (
                                <XCircle className="absolute right-2 top-2 text-red-400" size={16} />
                            )}
                            {countrySearch && !selectedProvider.passportCountry && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                                    {filteredCountries.map(c => (
                                        <div
                                            key={c}
                                            className="p-2 text-xs hover:bg-blue-50 cursor-pointer font-medium"
                                            onClick={() => {
                                                handleUpdateIdentification({ passportCountry: c });
                                                setCountrySearch("");
                                            }}
                                        >
                                            {c}
                                        </div>
                                    ))}
                                    {filteredCountries.length === 0 && <div className="p-2 text-xs text-slate-400">No matches.</div>}
                                </div>
                            )}
                        </div>
                        {!selectedProvider.passportCountry && (
                            <div className="text-[10px] text-red-600 font-bold mt-1">⚠️ Passport country not selected.</div>
                        )}
                    </div>
                )}
            </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-800">{label}</div>
          <Badge className={
            status === "APPROVED" || status === "VERIFIED" ? "bg-green-600 text-white" :
            status === "REJECTED" || status === "EXPIRED" ? "bg-red-600 text-white" :
            status === "UPDATE_REQUIRED" ? "bg-orange-600 text-white" :
            status === "PENDING" ? "bg-yellow-600 text-white" :
            "bg-slate-200 text-slate-600"
          }>
            {status}
          </Badge>
        </div>

        {/* Expiry Management */}
        {field && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border text-[10px]">
                <div className="flex flex-col gap-1 flex-1">
                    <label className="font-bold text-slate-500 uppercase">Expiry Type</label>
                    <select
                        value={expiryType}
                        onChange={(e) => handleSetExpiry(field, e.target.value, expiryDate)}
                        className="bg-white border rounded px-1 py-0.5 outline-none"
                    >
                        <option value="NA">N/A</option>
                        <option value="HAS_EXPIRY">Has Expiry</option>
                    </select>
                </div>
                {expiryType === "HAS_EXPIRY" && (
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="font-bold text-slate-500 uppercase">Expiry Date</label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => handleSetExpiry(field, expiryType, e.target.value)}
                            className="bg-white border rounded px-1 py-0.5 outline-none"
                        />
                    </div>
                )}
                {daysRemaining !== null && (
                    <div className="text-right">
                        <div className="font-bold text-slate-400 uppercase">Remaining</div>
                        <div className={daysRemaining < 0 ? "text-red-600 font-bold" : daysRemaining < 7 ? "text-orange-500 font-bold" : "text-green-600"}>
                            {daysRemaining} Days
                        </div>
                    </div>
                )}
            </div>
        )}

        {!url ? (
          <div className="text-sm text-muted-foreground py-4 text-center">No file uploaded yet.</div>
        ) : (
          <div className="space-y-2">
            <img
              src={url}
              alt={label}
              className="h-44 w-full rounded-md object-cover border bg-white"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />

            <div className="text-[10px] text-slate-500">
              {doc.submittedAt && `Submitted: ${new Date(doc.submittedAt).toLocaleString()}`}
            </div>

            {doc.captureTimestamp && (
              <div className="text-[10px] text-blue-500 font-medium">
                Camera Captured: {new Date(doc.captureTimestamp).toLocaleString()}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 underline"
              >
                View Current
              </a>

              {field && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[10px] bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    onClick={() => handleApproveDoc(field)}
                    disabled={status === "APPROVED" || status === "VERIFIED"}
                  >
                    {field === "idDocument"
                        ? (selectedProvider?.identificationType === "SA_ID" ? "Approve SA ID" : "Approve Passport")
                        : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[10px] bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                    onClick={() => handleRejectDoc(field)}
                    disabled={status === "REJECTED"}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    onClick={() => handleRequireUpdate(field)}
                  >
                    Update Doc
                  </Button>
                </div>
              )}
            </div>

            {(doc?.reason || doc?.updateReason) && (
              <div className="rounded bg-red-50 p-2 text-[10px] text-red-700 border border-red-100">
                <span className="font-bold">{status === "UPDATE_REQUIRED" ? "UPDATE REASON:" : "REJECT REASON:"}</span> {doc.reason || doc.updateReason}
              </div>
            )}

            {doc?.history && doc.history.length > 0 && (
              <div className="mt-3 border-t pt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Version History</div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {doc.history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-[9px] bg-slate-50 p-1 rounded">
                      <a href={h.url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate max-w-[80px]">v{doc.history!.length - i}</a>
                      <span className="opacity-60">{h.status}</span>
                      <span className="opacity-40">{h.updatedAt ? new Date(h.updatedAt).toLocaleDateString() : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const tabButton = (key: TabKey, label: string) => {
    const active = tab === key;
    return (
      <button
        onClick={() => setTab(key)}
        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
          active
            ? "bg-slate-900 text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        {label}
      </button>
    );
  };

  const statusPill = (p: Provider) => {
    const st = p.accountStatus || {};
    if (st.isBanned) return <Badge className="bg-red-600 text-white">BANNED</Badge>;
    if (st.isSuspended) return <Badge className="bg-orange-600 text-white">SUSPENDED</Badge>;
    if (st.isArchived) return <Badge className="bg-slate-700 text-white">ARCHIVED</Badge>;
    return <Badge className="bg-green-600 text-white">ACTIVE</Badge>;
  };

  const verificationPill = (p: Provider) => {
    const v = String(p.providerProfile?.verificationStatus || "").toUpperCase();
    if (!v) return <Badge variant="secondary">—</Badge>;
    if (v.includes("APPROV")) return <Badge className="bg-green-600 text-white">APPROVED</Badge>;
    if (v.includes("REJECT")) return <Badge className="bg-red-600 text-white">REJECTED</Badge>;
    if (v.includes("PEND")) return <Badge className="bg-yellow-600 text-white">PENDING</Badge>;
    return <Badge variant="secondary">{v}</Badge>;
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Driver & Provider Management"
        description="Verify and manage mechanics and tow truck providers."
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabButton("pending", "Pending")}
        {tabButton("approved", "Approved")}
        {tabButton("rejected", "Rejected")}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">
            {tab === "pending"
              ? "Pending Provider Verifications"
              : tab === "approved"
              ? "Approved Providers"
              : "Rejected Providers"}
          </CardTitle>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Min ★</span>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                className="w-20"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              />
            </div>
            <Input
              className="max-w-sm"
              placeholder="Search by name, email, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading providers...
            </div>
          )}

          {error && <div className="py-10 text-center text-sm text-red-600">{error}</div>}

          {!loading && !error && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>ID Status</TableHead>
                    <TableHead>Preference</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Verification</TableHead>
                    {tab === "rejected" ? <TableHead>Reject Reason</TableHead> : null}
                    <TableHead>Account</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredProviders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        className="text-center py-8 text-sm text-muted-foreground"
                      colSpan={tab === "rejected" ? 10 : 9}
                    >
                      No providers found ✅
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProviders.map((p) => {
                      const st = p.accountStatus || {};
                      const busy = actionLoadingId === p._id;
                      const reason = getRejectReason(p);

                      return (
                        <TableRow key={p._id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col gap-1">
                                <span>{p.name || "—"}</span>
                                {p.identificationType === "SA_ID" && (
                                    <div className="flex items-center gap-1 text-[9px] font-black text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full w-fit uppercase">
                                        <CheckCircle size={10} /> SA ID Holder
                                    </div>
                                )}
                                {p.identificationType === "PASSPORT" && (
                                    <div className={`flex items-center gap-1 text-[9px] font-black border px-1.5 py-0.5 rounded-full w-fit uppercase ${
                                        p.passportCountry === "South Africa"
                                        ? "text-green-700 bg-green-50 border-green-200"
                                        : "text-blue-700 bg-blue-50 border-blue-200"
                                    }`}>
                                        <CheckCircle size={10} />
                                        {p.passportCountry === "South Africa" ? "South African Passport" : `Passport Holder - ${p.passportCountry || "Unknown"}`}
                                    </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>{p.email || "—"}</TableCell>

                          <TableCell>
                            <Badge variant="secondary">{normalizeRole(p.role)}</Badge>
                          </TableCell>

                          <TableCell>
                            {p.identificationType === "SA_ID" ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">SA ID</Badge>
                            ) : p.identificationType === "PASSPORT" ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">PASSPORT</Badge>
                            ) : (
                                <span className="text-xs opacity-40">N/A</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="bg-slate-50">
                              {p.providerProfile?.jobPreference || "BOTH"}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {typeof p.rating === "number" ? (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-yellow-600">★ {p.rating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({p.ratingCount || 0})</span>
                              </div>
                            ) : "—"}
                          </TableCell>

                          <TableCell>{verificationPill(p)}</TableCell>

                          {tab === "rejected" ? (
                            <TableCell className="max-w-[260px]">
                              <div className="text-sm text-slate-700 line-clamp-2">
                                {reason || "—"}
                              </div>
                            </TableCell>
                          ) : null}

                          <TableCell>{statusPill(p)}</TableCell>

                          <TableCell>
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                          </TableCell>

                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                              onClick={() => openScorecard(p)}
                            >
                              Financials
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDocs(p)}
                            >
                              Docs
                            </Button>

                            {/* ✅ Approve should exist for rejected too */}
                            {(tab === "pending" || tab === "rejected") && (
                              <Button
                                size="sm"
                                disabled={busy}
                                onClick={() => handleApprove(p._id)}
                              >
                                {busy ? "..." : "Approve"}
                              </Button>
                            )}

                            {/* ✅ Reject available on pending + approved (optional) */}
                            {tab !== "rejected" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busy}
                                onClick={() => openReject(p)}
                              >
                                Reject
                              </Button>
                            )}

                            {/* ✅ Account controls */}
                            {!st.isSuspended ? (
                              <Button size="sm" disabled={busy} onClick={() => suspendUser(p._id)}>
                                {busy ? "..." : "Suspend"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={busy}
                                onClick={() => unsuspendUser(p._id)}
                              >
                                {busy ? "..." : "Unsuspend"}
                              </Button>
                            )}

                            {!st.isBanned ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busy}
                                onClick={() => banUser(p._id)}
                              >
                                {busy ? "..." : "Ban"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={busy}
                                onClick={() => unbanUser(p._id)}
                              >
                                {busy ? "..." : "Unban"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Docs Modal (fixed visibility + scroll) */}
      <Dialog
        open={openDocsModal}
        onOpenChange={(v) => {
          setOpenDocsModal(v);
          if (!v) {
            setSelectedProvider(null);
            setDocs(null);
            setDocsError(null);
            setDocsLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Verification Documents - {selectedProvider?.name || "Provider"}
              {selectedProvider?.identificationType === "SA_ID" && (
                  <Badge className="bg-green-600 text-white border-none text-[10px]">🟢 SA ID HOLDER</Badge>
              )}
              {selectedProvider?.identificationType === "PASSPORT" && (
                  <Badge className={`${selectedProvider.passportCountry === "South Africa" ? "bg-green-600" : "bg-blue-600"} text-white border-none text-[10px]`}>
                      {selectedProvider.passportCountry === "South Africa" ? "🟢 SOUTH AFRICAN PASSPORT HOLDER" : `🔵 PASSPORT HOLDER – ${selectedProvider.passportCountry || "Unknown"}`}
                  </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[72vh] overflow-y-auto pr-1">
            {docsLoading && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Loading documents...
              </div>
            )}

            {docsError && (
              <div className="py-10 text-center text-sm text-red-600">{docsError}</div>
            )}

            {!docsLoading && !docsError && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {renderDoc("ID Document", docs?.idDocument, "idDocument")}
                  {renderDoc("Driver Licence", docs?.driverLicense, "driverLicense")}
                  {renderDoc("Selfie / Profile", docs?.selfie, "selfie")}
                  {renderDoc("HURU Criminal Check", docs?.huruCriminalCheck, "huruCriminalCheck")}
                  {renderDoc("Proof of Residence", docs?.proofOfResidence, "proofOfResidence")}

                  {/* Vehicle Docs (Tow Truck Only) */}
                  {(selectedProvider?.role?.toLowerCase().includes("tow") ||
                    selectedProvider?.role?.toLowerCase().includes("truck") ||
                    docs?.vehicleRC1?.url ||
                    docs?.proofOfVehicle?.url ||
                    docs?.vehicleLicenseDisc?.url) && (
                    <>
                      {renderDoc("Vehicle RC1", docs?.vehicleRC1, "vehicleRC1")}
                      {renderDoc("Proof of Vehicle", docs?.proofOfVehicle, "proofOfVehicle")}
                      {renderDoc("Vehicle Licence Disc", docs?.vehicleLicenseDisc, "vehicleLicenseDisc")}
                    </>
                  )}
                </div>

                {/* ✅ Phase 6: Final Approve Button */}
                {selectedProvider && (tab === "pending" || tab === "rejected") && (
                  <div className="flex flex-col items-end gap-2 border-t pt-4">
                    {selectedProvider.identificationType === "PASSPORT" && !selectedProvider.passportCountry && (
                        <div className="text-[10px] text-red-600 font-black animate-pulse">
                            ⚠️ BLOCKER: CANNOT APPROVE WITHOUT PASSPORT COUNTRY
                        </div>
                    )}
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                      onClick={handleFinalApprove}
                      disabled={selectedProvider.identificationType === "PASSPORT" && !selectedProvider.passportCountry}
                    >
                      FINAL APPROVE PROVIDER ✅
                    </Button>
                  </div>
                )}

                {/* ✅ Show reject reason (if any) */}
                {selectedProvider && getRejectReason(selectedProvider) ? (
                  <div className="rounded-md border p-3 bg-white">
                    <div className="text-xs text-muted-foreground">Reject reason</div>
                    <div className="text-sm font-medium text-slate-900">
                      {getRejectReason(selectedProvider)}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Reject Modal (captures reason) */}
      <Dialog
        open={openRejectModal}
        onOpenChange={(v) => {
          setOpenRejectModal(v);
          if (!v) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden bg-white">
          <DialogHeader>
            <DialogTitle>Reject Provider</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border p-3 bg-white">
              <div className="text-sm font-medium text-slate-900">
                {rejectTarget?.name || "Provider"}
              </div>
              <div className="text-xs text-muted-foreground">{rejectTarget?.email || ""}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Reject reason</div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this provider is rejected (missing docs, invalid license, etc.)"
                className="w-full min-h-[120px] rounded-md border border-input bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="text-xs text-muted-foreground">
                This helps providers know what to fix before re-submitting documents.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpenRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!rejectTarget || actionLoadingId === rejectTarget?._id}
                onClick={() => rejectTarget && handleReject(rejectTarget._id, rejectReason)}
              >
                {rejectTarget && actionLoadingId === rejectTarget._id ? "..." : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Financial Scorecard Modal */}
      <Dialog
        open={openScorecardModal}
        onOpenChange={(v) => {
          setOpenScorecardModal(v);
          if (!v) setScorecardData(null);
        }}
      >
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Provider Financial Scorecard</DialogTitle>
          </DialogHeader>

          {scorecardLoading ? (
            <div className="py-20 text-center text-sm text-muted-foreground">Loading scorecard...</div>
          ) : scorecardData ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border">
                 <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl">
                    {selectedProvider?.name?.[0]}
                 </div>
                 <div>
                    <h3 className="font-bold text-lg">{selectedProvider?.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedProvider?.email}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-xl border bg-white shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      <TrendingUp size={14} className="text-green-600"/> Weekly Earnings
                    </p>
                    <p className="text-2xl font-black mt-1">{scorecardData.weeklyEarnings.toFixed(2)} {scorecardData.currency}</p>
                 </div>
                 <div className="p-4 rounded-xl border bg-white shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      <BarChart size={14} className="text-blue-600"/> Monthly Earnings
                    </p>
                    <p className="text-2xl font-black mt-1">{scorecardData.monthlyEarnings.toFixed(2)} {scorecardData.currency}</p>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div className="p-4 rounded-xl border text-center">
                    <p className="text-xs opacity-60">Completed Jobs</p>
                    <p className="text-xl font-bold text-green-600">{scorecardData.completedJobs}</p>
                 </div>
                 <div className="p-4 rounded-xl border text-center">
                    <p className="text-xs opacity-60">Active Jobs</p>
                    <p className="text-xl font-bold text-blue-600">{scorecardData.activeJobs}</p>
                 </div>
                 <div className="p-4 rounded-xl border text-center">
                    <p className="text-xs opacity-60">Cancel Rate</p>
                    <p className="text-xl font-bold text-red-600">{scorecardData.cancellationRate}%</p>
                 </div>
              </div>

              <div className="p-4 rounded-xl border bg-slate-900 text-white flex justify-between items-center">
                 <div>
                    <p className="text-xs opacity-70">Rating Trend (Avg)</p>
                    <p className="text-lg font-black">★ {scorecardData.ratingTrend.toFixed(1)}</p>
                 </div>
                 <CheckCircle size={30} className="text-green-400 opacity-50" />
              </div>

              <div className="flex justify-end pt-2">
                 <Button onClick={() => setOpenScorecardModal(false)}>Close Scorecard</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}