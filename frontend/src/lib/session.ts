export const tokenCookie = "gridflow_token";
export const tenantCookie = "gridflow_tenant";
export const tenantIdCookie = "gridflow_tenant_id";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  workspace_id: number | null;
};

export type AuthTenant = {
  id: number;
  name: string;
  slug: string;
};

export type AuthSession = {
  token: string;
  tenant: AuthTenant;
  user: AuthUser;
};

const maxAge = 60 * 60 * 24 * 14;

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const row = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  if (!row) return null;
  return decodeURIComponent(row.slice(name.length + 1));
}

export function writeSession(session: AuthSession) {
  writeCookie(tokenCookie, session.token);
  writeCookie(tenantCookie, session.tenant.slug);
  writeCookie(tenantIdCookie, String(session.tenant.id));
}

export function clearSession() {
  clearCookie(tokenCookie);
  clearCookie(tenantCookie);
  clearCookie(tenantIdCookie);
}
