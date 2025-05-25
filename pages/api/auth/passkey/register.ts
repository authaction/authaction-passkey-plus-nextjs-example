import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken } from "../../../../utils/utils";

const {
  AUTHACTION_TENANT_DOMAIN: TENANT_DOMAIN = "",
  AUTHACTION_PASSKEY_CLIENT_ID: CLIENT_ID = "",
  AUTHACTION_PASSKEY_CLIENT_SECRET: CLIENT_SECRET = "",
  AUTHACTION_APP_ID: APP_ID = "",
} = process.env;


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { externalId, displayName } = req.body;
  if (!externalId || !displayName) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const token = await getAccessToken();
    let apiRes;
      apiRes = await fetch(
        `https://${TENANT_DOMAIN}/api/v1/passkey-plus/${APP_ID}/transaction/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ externalId, displayName }),
        }
      );
    if (!apiRes.ok) {
      const err = await apiRes.text();
      return res.status(apiRes.status).json({ error: err });
    }

    const payload = await apiRes.json();
    const inner = payload.data;
    if (!inner?.transactionId) {
      console.error("Unexpected transaction response:", payload);
      return res
        .status(500)
        .json({ error: "AuthAction returned no transaction ID" });
    }

    return res.status(200).json({
      transactionId: inner.transactionId,
      id: inner.id,
      verified: inner.verified,
    });
  } catch (e: any) {
    console.error("Passkey transaction error:", e);
    return res.status(500).json({ error: e.message });
  }
}
