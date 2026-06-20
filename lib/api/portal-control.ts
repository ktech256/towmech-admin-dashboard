import api from "./axios";

export const fetchPortalSettings = async () => {
  const res = await api.get("/api/admin/portal-control/settings");
  return res.data;
};

export const updatePortalSettings = async (settings: any) => {
  const res = await api.patch("/api/admin/portal-control/settings", settings);
  return res.data;
};

export const triggerGlobalForceLogout = async () => {
  const res = await api.post("/api/admin/portal-control/force-logout");
  return res.data;
};

export const fetchAllPartners = async (params?: any) => {
  const res = await api.get("/api/admin/portal-control/partners", { params });
  return res.data;
};

export const updatePartnerPortalStatus = async (id: string, payload: { status?: string; isSuspended?: boolean; type: string }) => {
  const res = await api.patch(`/api/admin/portal-control/partners/${id}/status`, payload);
  return res.data;
};

export const createPartner = async (partner: any) => {
  const res = await api.post("/api/admin/partners", partner);
  return res.data;
};

export const regeneratePartnerToken = async (id: string) => {
  const res = await api.post(`/api/admin/portal-control/partners/${id}/regenerate-token`);
  return res.data;
};

export const fetchPartnerAuditLogs = async (params?: any) => {
  const res = await api.get("/api/admin/portal-control/audit-logs", { params });
  return res.data;
};
