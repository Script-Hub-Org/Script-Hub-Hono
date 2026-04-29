import app from "../index.ts";

(async () => {
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
})();
