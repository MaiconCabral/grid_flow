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
  theme: "dark" | "light";
  light_background: string;
  dark_background: string;
  accent: string;
  plan: string;
  locale?: "en" | "pt";
};

export type AuthAgency = {
  id: number;
  name: string;
  slug: string;
};

export type AuthAccount = {
  tenant: AuthTenant;
  user: AuthUser;
  agencies: AuthAgency[];
};

export type AuthSession = AuthAccount & {
  token: string;
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
  writeTenant(session.tenant);
}

/** Stores the agency the signed-in person is opening. */
export function writeTenant(tenant: AuthTenant) {
  writeCookie(tenantCookie, tenant.slug);
  writeCookie(tenantIdCookie, String(tenant.id));
}

export function clearSession() {
  clearCookie(tokenCookie);
  clearCookie(tenantCookie);
  clearCookie(tenantIdCookie);
}
