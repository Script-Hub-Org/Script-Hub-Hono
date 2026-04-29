import { Hono } from "hono/tiny";
import api from "./api";

export default new Hono().route("/api", api).onError((e, c) => {
  console.error(`${e}`);
  return c.text(`${e}`, 500);
});
