import { $app } from "./app.js";

export function fetch(url: string, options: RequestInit) {
  switch ($app) {
    case "Node.js": {
      return globalThis.fetch(url, options);
    }
    case "Shadowrocket":
    case "Egern":
    case "Loon":
    case "Stash":
    case "Surge": {
      return new Promise((resolve, reject) => {
        // @ts-ignore
        $httpClient[options.method.toLowerCase() || "get"](
          {
            url,
            headers: options.headers || {},
            body: options.body,
          },
          // @ts-ignore
          (error, response, body) => {
            if (error) return reject(error);
            return resolve({
              ok: true,
              status: response?.status || 200,
              headers: response?.headers || {},
              text: async () => body,
              json: async () => JSON.parse(body || "{}"),
              arrayBuffer: async () => body,
            });
          },
        );
      });
    }
    case "Quantumult X": {
      return new Promise((resolve, reject) => {
        // @ts-ignore
        $task
          .fetch({
            url,
            // @ts-ignore
            method: options.method.toLowerCase() || "get",
            headers: options.headers || {},
            body: options.body,
          })
          .then(
            // @ts-ignore
            (resp) => {
              resolve({
                ok: true,
                status: resp.statusCode,
                headers: resp.headers || {},
                text: async () => resp.body,
                json: async () => JSON.parse(resp.body || "{}"),
                arrayBuffer: async () => resp.bodyBytes,
              });
            },
            // @ts-ignore
            (err) => reject(err?.error || "UndefinedError"),
          );
      });
    }
  }
}
