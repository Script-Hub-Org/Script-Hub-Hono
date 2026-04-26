import { Hono } from "hono/tiny";
import { html } from "../../page/index.js";

export default new Hono().get("/", (c) => {
  return c.html(html);
});
