import api from "@/lib/api/axios";

// ✅ Fetch all admin users (ADMIN + SUPERADMIN)
export async function fetchAdmins() {
  try {
    const res = await api.get("/api/superadmin/admins");
    return res.data;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to fetch admins ❌"
    );
  }
}

// ✅ Create admin (SuperAdmin only)
export async function createAdmin(payload: {
  name: string;
  email: string;
  password: string;
  role?: string;
  permissions?: Record<string, boolean>;
}) {
  try {
    const res = await api.post("/api/superadmin/create-admin", payload);
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      "Could not create admin ❌";
    throw new Error(message);
  }
}

// ✅ Update permissions (SuperAdmin only)
export async function updateAdminPermissions(
  adminId: string,
  permissions: Record<string, boolean>
) {
  try {
    const res = await api.patch(
      `/api/superadmin/admin/${adminId}/permissions`,
      { permissions }
    );
    return res.data;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update permissions ❌"
    );
  }
}

// ✅ Archive admin (SuperAdmin only)
export async function archiveAdmin(adminId: string) {
  try {
    const res = await api.patch(`/api/superadmin/admin/${adminId}/archive`, {});
    return res.data;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to archive admin ❌"
    );
  }
}

// ✅ Suspend / Unsuspend / Ban / Unban admins via adminUsers routes
export async function suspendUser(userId: string) {
  try {
    const res = await api.patch(`/api/admin/users/${userId}/suspend`, {});
    return res.data;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Suspend failed ❌"
    );
  }
}

export async function unsuspendUser(userId: string) {
  try {
    const res = await api.patch(`/api/admin/users/${userId}/unsuspend`, {});
    return res.data;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unsuspend failed ❌"
    );
  }
}

export async function banUser(userId: string) {
  try {
    const res = await api.patch(`/api/admin/users/${userId}/ban`, {});
    return res.data;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Ban failed ❌"
    );
  }
}

export async function unbanUser(userId: string) {
  try {
    const res = await api.patch(`/api/admin/users/${userId}/unban`, {});
    return res.data;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unban failed ❌"
    );
  }
}