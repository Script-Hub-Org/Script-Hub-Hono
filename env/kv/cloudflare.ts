import type { Context } from "hono";

export class CloudflareKV {
  CF_KV_ACCOUNT_ID: string;
  CF_KV_NAMESPACE_ID: string;
  CF_KV_API_TOKEN: string;

  constructor(c: Context) {
    this.CF_KV_ACCOUNT_ID = c.get("CF_KV_ACCOUNT_ID");
    this.CF_KV_NAMESPACE_ID = c.get("CF_KV_NAMESPACE_ID");
    this.CF_KV_API_TOKEN = c.get("CF_KV_API_TOKEN");
    if (!this.CF_KV_ACCOUNT_ID || !this.CF_KV_NAMESPACE_ID || !this.CF_KV_API_TOKEN) {
      throw new Error("CF_KV_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_KV_API_TOKEN are required");
    }
  }

  async get(key: string): Promise<string> {
    return await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.CF_KV_ACCOUNT_ID}/storage/kv/namespaces/${this.CF_KV_NAMESPACE_ID}/values/${key}`,
      { headers: { Authorization: `Bearer ${this.CF_KV_API_TOKEN}` } },
    ).then((r) => r.text());
  }

  async set(key: string, value: string) {
    return await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.CF_KV_ACCOUNT_ID}/storage/kv/namespaces/${this.CF_KV_NAMESPACE_ID}/bulk`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.CF_KV_API_TOKEN}`,
        },
        body: JSON.stringify([
          {
            key, // A key’s name. The name may be at most 512 bytes. All printable, non-whitespace characters are valid.
            value, // A UTF-8 encoded string to be stored, up to 25 MiB in length.
          },
        ]),
      },
    )
      .then((r) => r.json())
      .then((j) => j.success);
  }
}
