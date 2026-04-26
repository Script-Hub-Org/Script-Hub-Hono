import { Hono } from "hono/tiny";
import page from "./page/index.ts";
import api from "./api/index.ts";

export default new Hono()
  .route("/", page)
  .route("/api", api)
  .onError((e, c) => {
    console.error(`${e}`);
    return c.text(`${e}`, 500);
  });
