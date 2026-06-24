import { handle } from "hono/cloudflare-pages";
import app from "../backend/index";

export const onRequest = handle(app);
