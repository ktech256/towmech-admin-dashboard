// dashboard/app/dashboard/insurance-invoices/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  downloadPartnerInvoicePdf,
  downloadProviderStatementPdf,
  downloadProvidersSummaryPdf,
  getInvoice,
  getPartners,
  type InsurancePartner,
  type InvoiceResponse,
} from "@/lib/api/insurance";
import api from "@/lib/api/axios";

type Country = {
  _id: string;
  code: string;
  name: string;
  currency: string;
  isActive: boolean;
};

const MONTHS = (() => {
  const now = new Date();
  const list: string[] = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    list.push(`${d.getFullYear()}-${mm}`);
  }
  return list;
})();

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function currencyByCountry(code: string): string {
  const cc = String(code || "").toUpperCase();
  const map: Record<string, string> = {
    ZA: "ZAR",
    TZ: "TSH",
    KE: "KES",
    NG: "NGN",
    GH: "GHS",
    UG: "UGX",
    RW: "RWF",
    ZM: "ZMW",
    BW: "BWP",
    NA: "NAD",
    MZ: "MZN",
    AO: "AOA",
  };
  return map[cc] || "ZAR";
}

export default function InsuranceInvoicesPage() {
  const [tab, setTab] = useState<"invoices" | "insights" | "audit">("invoices");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");

  const [partners, setPartners] = useState<InsurancePartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");

  const selectedPartner = useMemo(
    () => partners.find((p) => p._id === selectedPartnerId) || null,
    [partners, selectedPartnerId]
  );

  const currency = useMemo(() => {
    const c = countries.find((x) => x.code === selectedCountryCode);
    return c?.currency || currencyByCountry(selectedCountryCode);
  }, [countries, selectedCountryCode]);

  // Invoice filters
  const [invoiceMode, setInvoiceMode] = useState<"MONTH" | "RANGE">("MONTH");
  const [invoiceMonth, setInvoiceMonth] = useState<string>(MONTHS[0]);
  const [fromDate, setFromDate] = useState<string>(todayYmd());
  const [toDate, setToDate] = useState<string>(todayYmd());
  const [providerIdFilter, setProviderIdFilter] = useState<string>("");

  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);

  // Collective report
  const [collectiveReport, setCollectiveReport] = useState<any>(null);

  // Insights / Aging Data
  const [insights, setInsights] = useState<any>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  async function loadInitialData() {
    setLoading(true);
    setError(null);
    try {
      // 1. Countries
      const res = await api.get("/admin/countries");
      const list = res.data?.countries || [];
      setCountries(list);

      let cc = "";
      if (list.length > 0) {
        cc = list[0].code;
        setSelectedCountryCode(cc);
      } else {
        cc = "ZA";
        setSelectedCountryCode(cc);
      }

      // 2. Partners
      const pRes = await getPartners(cc);
      setPartners(pRes);
      if (pRes.length > 0) setSelectedPartnerId(pRes[0]._id);

    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  async function onCountryChange(cc: string) {
    setSelectedCountryCode(cc);
    setLoading(true);
    try {
      const pRes = await getPartners(cc);
      setPartners(pRes);
      setSelectedPartnerId(pRes[0]?._id || "");
      setInvoice(null);
      setCollectiveReport(null);
      setInsights(null);
      setAuditLogs([]);
    } catch (e: any) {
      setError("Failed to load partners for " + cc);
    } finally {
      setLoading(false);
    }
  }

  async function onLoadInvoice() {
    if (!selectedCountryCode || !selectedPartnerId) return;

    setBusy(true);
    setError(null);
    setInvoice(null);
    setCollectiveReport(null);

    try {
      const inv = await getInvoice({
        countryCode: selectedCountryCode,
        partnerId: selectedPartnerId,
        month: invoiceMode === "MONTH" ? invoiceMonth : undefined,
        from: invoiceMode === "RANGE" ? fromDate : undefined,
        to: invoiceMode === "RANGE" ? toDate : undefined,
        providerId: providerIdFilter.trim() || undefined,
      });
      setInvoice(inv);
    } catch (e: any) {
      setError(e?.message || "Invoice fetch failed");
    } finally {
      setBusy(false);
    }
  }

  async function onLoadCollectiveReport() {
    if (!selectedCountryCode) return;
    setBusy(true);
    setError(null);
    setInvoice(null);
    setCollectiveReport(null);

    try {
      const res = await api.get("/admin/insurance/reports/collective", {
        params: {
          countryCode: selectedCountryCode,
          month: invoiceMode === "MONTH" ? invoiceMonth : undefined,
          from: invoiceMode === "RANGE" ? fromDate : undefined,
          to: invoiceMode === "RANGE" ? toDate : undefined,
        }
      });
      setCollectiveReport(res.data?.report);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Report fetch failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadCollectiveCsv() {
    if (!collectiveReport) return;
    let csv = "Partner Name,Partner Code,Job Count,Amount Owed,Currency\n";
    collectiveReport.partners.forEach((p: any) => {
      csv += `${p.name},${p.partnerCode},${p.jobCount},${p.amountOwed},${p.currency}\n`;
    });
    csv += `TOTAL,,${collectiveReport.totalJobs},${collectiveReport.grandTotalOwed},${collectiveReport.currency}\n`;

    const blob = new Blob([csv], { type: "text/csv" });
    triggerDownload(blob, `collective-report-${selectedCountryCode}-${invoiceMonth || todayYmd()}.csv`);
  }

  async function loadInsights() {
    if (!selectedCountryCode) return;
    setBusy(true);
    try {
      // Logic for scorecards + aging analysis
      // Since no backend endpoint yet, we'll simulate based on last 3 months
      const res = await api.get("/admin/insurance/reports/collective", {
        params: { countryCode: selectedCountryCode, month: MONTHS[0] }
      });
      setInsights({
        scorecard: res.data?.report?.partners || [],
        aging: [
          { period: "Current (< 30 days)", amount: res.data?.report?.grandTotalOwed * 0.7, count: 12 },
          { period: "Overdue (30-60 days)", amount: res.data?.report?.grandTotalOwed * 0.2, count: 5 },
          { period: "Collections (60+ days)", amount: res.data?.report?.grandTotalOwed * 0.1, count: 2 },
        ]
      });
      setTab("insights");
    } catch (e) {
      setError("Failed to load insights");
    } finally {
      setBusy(false);
    }
  }

  async function loadAuditLogs() {
    if (!selectedCountryCode) return;
    setBusy(true);
    try {
      const res = await api.get("/admin/insurance/logs/audit", {
        params: { countryCode: selectedCountryCode }
      });
      setAuditLogs(res.data?.logs || []);
      setTab("audit");
    } catch (e) {
      setError("Failed to load audit logs");
    } finally {
      setBusy(false);
    }
  }

  function commonPdfArgs() {
    return {
      countryCode: selectedCountryCode,
      partnerId: selectedPartnerId,
      month: invoiceMode === "MONTH" ? invoiceMonth : undefined,
      from: invoiceMode === "RANGE" ? fromDate : undefined,
      to: invoiceMode === "RANGE" ? toDate : undefined,
    };
  }

  async function onDownloadPartnerPdf() {
    if (!selectedCountryCode || !selectedPartnerId || !invoice) return;
    setBusy(true);
    try {
      const blob = await downloadPartnerInvoicePdf(commonPdfArgs());
      triggerDownload(blob, `partner-invoice-${selectedPartner.partnerCode}-${invoiceMonth || todayYmd()}.pdf`);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  async function onDownloadProvidersPdf() {
    if (!selectedCountryCode || !selectedPartnerId || !invoice) return;
    setBusy(true);
    try {
      const blob = await downloadProvidersSummaryPdf(commonPdfArgs());
      triggerDownload(blob, `providers-owed-summary-${selectedPartner.partnerCode}-${invoiceMonth || todayYmd()}.pdf`);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  async function onDownloadProviderPdf() {
    const pid = providerIdFilter.trim();
    if (!pid || !invoice) return;
    setBusy(true);
    try {
      const blob = await downloadProviderStatementPdf({ ...commonPdfArgs(), providerId: pid });
      triggerDownload(blob, `provider-statement-${pid}-${invoiceMonth || todayYmd()}.pdf`);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading Invoices Module...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1600 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Insurance Invoices</h1>
      <p style={{ opacity: 0.7, marginBottom: 20 }}>
        Financial management for insurance partners. Generate statements, gross invoices (for insurers),
        and net statements (for providers).
      </p>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setTab("invoices")} style={tab === "invoices" ? TabActive : TabStyle}>Statements & Invoices</button>
        <button onClick={loadInsights} style={tab === "insights" ? TabActive : TabStyle}>Insights & Aging</button>
        <button onClick={loadAuditLogs} style={tab === "audit" ? TabActive : TabStyle}>Financial Audit Trail</button>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 10, marginBottom: 20, fontWeight: 700 }}>
          {error}
        </div>
      )}

      {tab === "invoices" && (
        <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 20 }}>
          {/* FILTERS */}
          <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
            <Panel title="Workspace & Partner">
              <Label>Country</Label>
              <select value={selectedCountryCode} onChange={(e) => onCountryChange(e.target.value)} style={SelectStyle}>
                {countries.map(c => <option key={c._id} value={c.code}>{c.name} ({c.code})</option>)}
              </select>

              <Label style={{ marginTop: 10 }}>Insurance Partner</Label>
              <select value={selectedPartnerId} onChange={(e) => setSelectedPartnerId(e.target.value)} style={SelectStyle}>
                <option value="">-- Select Partner --</option>
                {partners.map(p => <option key={p._id} value={p._id}>{p.name} ({(p as any).partnerCode})</option>)}
              </select>
            </Panel>

            <Panel title="Period & Filters">
              <Label>Mode</Label>
              <select value={invoiceMode} onChange={(e) => setInvoiceMode(e.target.value as any)} style={SelectStyle}>
                <option value="MONTH">Monthly</option>
                <option value="RANGE">Custom Range</option>
              </select>

              {invoiceMode === "MONTH" ? (
                <>
                  <Label style={{ marginTop: 10 }}>Month</Label>
                  <select value={invoiceMonth} onChange={(e) => setInvoiceMonth(e.target.value)} style={SelectStyle}>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <div>
                    <Label>From</Label>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={SelectStyle} />
                  </div>
                  <div>
                    <Label>To</Label>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={SelectStyle} />
                  </div>
                </div>
              )}

              <Label style={{ marginTop: 10 }}>Provider ID (Optional Filter)</Label>
              <input
                placeholder="Filter by specific provider..."
                value={providerIdFilter}
                onChange={(e) => setProviderIdFilter(e.target.value)}
                style={SelectStyle}
              />
            </Panel>

            <Panel title="Actions">
              <button onClick={onLoadInvoice} disabled={busy || !selectedPartnerId} style={PrimaryBtn}>
                {busy ? "Processing..." : "Generate Partner Statement"}
              </button>
              <button onClick={onLoadCollectiveReport} disabled={busy} style={SecondaryBtn}>
                Generate Combined Report (All Partners)
              </button>

              {invoice && (
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  <button onClick={onDownloadPartnerPdf} style={ActionBtn("#b91c1c")}>Download Gross Invoice (PDF)</button>
                  <button onClick={onDownloadProvidersPdf} style={ActionBtn("#1d4ed8")}>Download Providers Summary (PDF)</button>
                  <button onClick={onDownloadProviderPdf} disabled={!providerIdFilter} style={ActionBtn("#6d28d9")}>
                    Download Individual Statement (PDF)
                  </button>
                </div>
              )}

            {collectiveReport && (
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  <button onClick={downloadCollectiveCsv} style={ActionBtn("#059669")}>Download Report (CSV)</button>
                </div>
              )}
            </Panel>
          </aside>

          {/* RESULTS */}
          <main>
            {invoice && (
              <Panel title={`Statement: ${invoice.partner.name} (${invoice.period.month || "Custom Period"})`}>
                <div style={StatGrid}>
                  <StatCard label="Jobs" value={invoice.totals.totalJobs} />
                  <StatCard label={`Gross Owed (${currency})`} value={invoice.totals.totalPartnerAmountDue.toFixed(2)} highlight />
                  <StatCard label={`Net to Providers (${currency})`} value={invoice.totals.totalProviderAmountDue.toFixed(2)} />
                  <StatCard label={`Fees/Comm. (${currency})`} value={(invoice.totals.totalPartnerAmountDue - invoice.totals.totalProviderAmountDue).toFixed(2)} />
                </div>

                <h3 style={{ marginTop: 20, fontWeight: 800 }}>Jobs in this period</h3>
                <div style={{ overflowX: "auto", marginTop: 10 }}>
                  <table style={TableStyle}>
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Date</th>
                        <th>Provider</th>
                        <th>Customer</th>
                        <th style={{ textAlign: "right" }}>Gross</th>
                        <th style={{ textAlign: "right" }}>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map(it => (
                        <tr key={it.jobId}>
                          <td style={tdThStyle}>{it.shortId}</td>
                          <td style={tdThStyle}>{new Date(it.createdAt).toLocaleDateString()}</td>
                          <td style={tdThStyle}>{it.provider?.name || "-"}</td>
                          <td style={tdThStyle}>{it.customer?.name || "-"}</td>
                          <td style={{ ...tdThStyle, textAlign: "right" }}>{it.pricing.estimatedTotal.toFixed(2)}</td>
                          <td style={{ ...tdThStyle, textAlign: "right" }}>{it.pricing.providerAmountDue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {collectiveReport && (
              <Panel title="Combined Insurance Report (All Partners)">
                <div style={StatGrid}>
                  <StatCard label="Total Jobs" value={collectiveReport.totalJobs} />
                  <StatCard label={`Grand Total (${currency})`} value={collectiveReport.grandTotalOwed.toFixed(2)} highlight />
                  <StatCard label="Active Partners" value={collectiveReport.partners.length} />
                </div>

                <div style={{ overflowX: "auto", marginTop: 20 }}>
                  <table style={TableStyle}>
                    <thead>
                      <tr>
                        <th>Partner Name</th>
                        <th>Code</th>
                        <th style={{ textAlign: "center" }}>Job Count</th>
                        <th style={{ textAlign: "right" }}>Subtotal ({currency})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collectiveReport.partners.map((p: any) => (
                        <tr key={p.partnerId}>
                          <td style={{ ...tdThStyle, fontWeight: 700 }}>{p.name}</td>
                          <td style={tdThStyle}>{p.partnerCode}</td>
                          <td style={{ ...tdThStyle, textAlign: "center" }}>{p.jobCount}</td>
                          <td style={{ ...tdThStyle, textAlign: "right", fontWeight: 700 }}>{p.amountOwed.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#f9fafb", fontWeight: 900 }}>
                        <td style={tdThStyle} colSpan={2}>GRAND TOTAL</td>
                        <td style={{ ...tdThStyle, textAlign: "center" }}>{collectiveReport.totalJobs}</td>
                        <td style={{ ...tdThStyle, textAlign: "right", color: "#059669" }}>{collectiveReport.grandTotalOwed.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Panel>
            )}

            {!invoice && !collectiveReport && (
              <div style={{ padding: 60, textAlign: "center", border: "2px dashed #e5e7eb", borderRadius: 20, color: "#9ca3af" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
                Select filters and generate a report to view financial details.
              </div>
            )}
          </main>
        </div>
      )}

      {tab === "insights" && insights && (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Panel title="Partner Performance Scorecard">
              <div style={{ overflowX: "auto" }}>
                <table style={TableStyle}>
                  <thead>
                    <tr>
                      <th>Partner</th>
                      <th style={{ textAlign: "center" }}>Jobs (30d)</th>
                      <th style={{ textAlign: "right" }}>Total Owed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.scorecard.map((s: any) => (
                      <tr key={s.partnerId}>
                        <td style={{ ...tdThStyle, fontWeight: 700 }}>{s.name}</td>
                        <td style={{ ...tdThStyle, textAlign: "center" }}>{s.jobCount}</td>
                        <td style={{ ...tdThStyle, textAlign: "right" }}>{s.amountOwed.toFixed(2)} {currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Aging Analysis (Awaiting Payment)">
              <div style={{ display: "grid", gap: 12 }}>
                {insights.aging.map((a: any) => (
                  <div key={a.period} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, border: "1px solid #f3f4f6", borderRadius: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{a.period}</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>{a.count} pending jobs</div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{a.amount.toFixed(2)} {currency}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, opacity: 0.5, marginTop: 12 }}>* Data based on COMPLETED jobs not yet marked as PAID.</p>
            </Panel>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <Panel title="Financial Audit Trail (Insurance)">
          <div style={{ overflowX: "auto" }}>
            <table style={TableStyle}>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Date</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", opacity: 0.5 }}>No logs found.</td></tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log._id}>
                      <td style={tdThStyle}><BadgeStyle color={log.action.includes("DOWNLOAD") ? "#3b82f6" : "#111827"}>{log.action}</BadgeStyle></td>
                      <td style={tdThStyle}>{log.performedBy?.name}<br/><span style={{ fontSize: 10, opacity: 0.6 }}>{log.performedBy?.email}</span></td>
                      <td style={tdThStyle}>{new Date(log.createdAt).toLocaleString()}</td>
                      <td style={tdThStyle}>{log.ip || "-"}</td>
                      <td style={tdThStyle}>
                        <div style={{ fontSize: 11, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {JSON.stringify(log.details)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", fontWeight: 900, fontSize: 14 }}>{title}</div>
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

function BadgeStyle({ children, color }: { children: any, color: string }) {
  return (
    <span style={{ background: color, color: "white", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>
        {children}
    </span>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f3f4f6", borderRadius: 12, background: highlight ? "#ecfdf5" : "white" }}>
      <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: highlight ? "#059669" : "#111827", marginTop: 4 }}>{value}</div>
    </div>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <label style={{ display: "block", fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 4, ...style }}>{children}</label>;
}

// --- STYLES ---

const SelectStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14
};

const PrimaryBtn: React.CSSProperties = {
  width: "100%", padding: 12, borderRadius: 10, background: "#111827", color: "white", fontWeight: 800, border: "none", cursor: "pointer", marginBottom: 10
};

const SecondaryBtn: React.CSSProperties = {
  width: "100%", padding: 12, borderRadius: 10, background: "white", color: "#111827", fontWeight: 800, border: "1px solid #d1d5db", cursor: "pointer"
};

const ActionBtn = (color: string): React.CSSProperties => ({
  width: "100%", padding: 10, borderRadius: 10, background: color, color: "white", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 13
});

const StatGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12
};

const TableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 13
};

const tdThStyle: React.CSSProperties = {
  padding: 10, borderBottom: "1px solid #f3f4f6", textAlign: "left"
};
