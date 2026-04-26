import type { Context } from "hono";
import type { App } from "../types/app";

export function getPlatformFromUserAgent(c: Context): App | undefined {
  const platfrom = c.req.header("user-agent")?.split("/")[0];
  switch (platfrom) {
    case "Egern":
      return "Egern";
    case "Loon":
      return "Loon";
    case "Quantumult%20X":
    case "Quantumult X":
      return "Quantumult X";
    case "Shadowrocket":
      return "Shadowrocket";
    case "Stash":
      return "Stash";
    case "Surge":
      return "Surge";
  }
}
