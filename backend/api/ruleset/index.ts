import { Hono } from "hono/tiny";
import { getPlatformFromUserAgent } from "../../util/getPlatform";
import { missing_url, unsupported_platform } from "../../../i18n.json";
import { parse, stringify } from "./parser";

export default new Hono().get("/:platform?", async (c) => {
  // @ts-ignore
  const lang = c.get("language") as "en" | "zh";
  const { platform } = c.req.param();
  const target = targetFromPlatform(platform || getPlatformFromUserAgent(c) || "");
  if (!target) throw new Error(unsupported_platform[lang]);
  const { url } = c.req.query();
  if (!url) throw new Error(missing_url[lang]);
  const ruleset = await fetch(url).then((r) => r.text());
  const result = parse(ruleset, {
    target,
    include: c.req.query("x"),
    exclude: c.req.query("y"),
    noResolve: c.req.query("nore"),
    sni: c.req.query("sni"),
  });
  return c.text(stringify(result));
});

function targetFromPlatform(platform: string): string | undefined {
  switch (platform) {
    case "loon":
      return "loon-rule-set";
    case "stash":
      return "stash-rule-set";
    case "surge":
      return "surge-rule-set";
  }
}
