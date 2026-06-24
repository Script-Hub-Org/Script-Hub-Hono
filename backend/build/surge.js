import app from "../index.ts";
import html from "../../assets/index.html?raw";

(async () => {
  const url = new URL($request.url);
  switch (url.pathname) {
    case "/":
      $done({
        response: {
          status: 200,
          headers: { "Content-Type": "text/html" },
          body: html,
        },
      });
    default:
      $done(
        await app
          .fetch(
            new Request($request.url, {
              method: $request.method,
              headers: $request.headers,
              body: $request.body,
            }),
          )
          .then(async (r) => ({
            response: {
              status: r.status,
              headers: Object.fromEntries(r.headers),
              body: await r.text(),
            },
          })),
      );
  }
})();
