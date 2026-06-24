import { Hono } from "hono/tiny";
import { unsupported_platform } from "../../../i18n.json";
import { getPlatformFromUserAgent } from "../../util/getPlatform.js";

export default new Hono().get("/:title/:platform?", (c) => {
  const { title, platform } = c.req.param();
  switch (platform || getPlatformFromUserAgent(c) || "") {
    case "loon": {
      return c.text("Loon");
    }
    case "surge": {
      console.log(title);
      return c.text("Surge");
    }
    case "stash": {
      return c.text("Stash");
    }
    case "quantumult%20x":
    case "quantumult x":
    case "qx": {
      return c.text("Qx");
    }
    default: {
      // @ts-ignore
      const lang = c.get("language") as "en" | "zh";
      throw new Error(unsupported_platform[lang]);
    }
  }
});
