import { Hono } from "hono/tiny";
import { languageDetector } from "hono/language";

import rewrite from "./rewrite/index.ts";
import ruleset from "./ruleset/index.ts";

export default new Hono()
  .get("/", (c) => c.text("OK"))
  .use(
    languageDetector({
      order: ["header"],
      convertDetectedLanguage: (lang) => lang.split("-")[0],
      supportedLanguages: ["en", "zh"],
      fallbackLanguage: "en",
    }),
  )
  .route("/rewrite", rewrite)
  .route("/ruleset", ruleset);
