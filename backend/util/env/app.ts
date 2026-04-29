/**
 * https://github.com/NSNanoCat/util/blob/main/lib/app.mjs
 */
import type { App } from "../../types/app";

export const $app: App = (() => {
  const has = (key: string) => key in globalThis;
  switch (true) {
    case has("$task"):
      return "Quantumult X";
    case has("$loon"):
      return "Loon";
    case has("$rocket"):
      return "Shadowrocket";
    case has("Egern"):
      return "Egern";
    // @ts-ignore
    case Boolean(globalThis.$environment?.["surge-version"]):
      return "Surge";
    // @ts-ignore
    case Boolean(globalThis.$environment?.["stash-version"]):
      return "Stash";
    // @ts-ignore
    case Boolean(globalThis.process?.versions?.node):
      return "Node.js";
    default:
      throw new Error("Unknown runtime");
  }
})();
