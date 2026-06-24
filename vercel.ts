import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  version: 2,
  regions: ["hkg1"],
  builds: [
    {
      src: "backend/index.ts",
      use: "@vercel/node",
    },
    {
      src: "/assets/*",
      use: "@vercel/static",
    },
  ],
  routes: [
    {
      handle: "filesystem",
    },
    {
      source: "/(?!assets$)(.*)",
      destination: "backend/index.ts",
    },
  ],
};
