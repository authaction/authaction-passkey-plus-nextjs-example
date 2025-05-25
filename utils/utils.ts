// utils/auth.ts

let cached: { token: string; expiresAt: number } | null = null;

const {
  AUTHACTION_TENANT_DOMAIN: TENANT_DOMAIN = "",
  AUTHACTION_PASSKEY_CLIENT_ID: CLIENT_ID = "",
  AUTHACTION_PASSKEY_CLIENT_SECRET: CLIENT_SECRET = "",
} = process.env;

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.token;
  }

  const res = await fetch(`https://${TENANT_DOMAIN}/oauth2/m2m/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      audience: `https://${TENANT_DOMAIN}`,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`M2M token fetch failed: ${res.status}`);
  }

  const { access_token, expires_in } = await res.json();
  cached = {
    token: access_token,
    expiresAt: now + expires_in * 1000 - 5000,
  };
  return access_token;
}
