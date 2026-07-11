/**
 * Minimal server-side Google OIDC helpers (no SDK). The id_token payload is
 * trusted without signature verification because it arrives directly from
 * Google's token endpoint over TLS during the code exchange, per Google's
 * own guidance for server-side flows.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export const OAUTH_STATE_COOKIE = "rmf_oauth_state";

export function googleConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

export function redirectUri(origin: string): string {
  return `${origin}/api/auth/google/callback`;
}

export function buildGoogleAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  givenName: string | null;
}

export async function exchangeGoogleCode(
  origin: string,
  code: string
): Promise<GoogleIdentity | null> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { id_token?: string };
  if (!json.id_token) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(json.id_token.split(".")[1], "base64url").toString("utf-8")
    ) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      given_name?: string;
    };
    if (!payload.sub || !payload.email) return null;
    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      givenName: payload.given_name ?? null,
    };
  } catch {
    return null;
  }
}
