import { Hono } from "hono/tiny";
import api from "./api/index.js";

export default new Hono()
  .get("/", (c) => c.redirect("/assets/index.html"))
  .route("/api", api)
  .onError((e, c) => {
    console.error(`${e}`);
    return c.text(`${e}`, 500);
  });
