import os from "os";
import path from "path";

export default (env, argv) => {
  return {
    devtool: false,
    entry: {
      build: "./surge.js",
    },
    experiments: {
      outputModule: true,
    },
    output: {
      filename: `Script.Hub.js`,
      iife: false,
      library: {
        type: "module",
      },
      path:
        argv.mode === "development"
          ? path.join(
              os.homedir(),
              "Library/Mobile Documents/iCloud~com~nssurge~inc/Documents/Script",
            )
          : path.resolve(import.meta.dirname, "../assets/script"),
    },
    // TypeScript Config
    module: {
      rules: [
        {
          test: /\.(?:js|mjs|ts)$/,
          exclude: [/node_modules/],
          loader: "builtin:swc-loader",
          options: {
            detectSyntax: "auto",
          },
          type: "javascript/auto",
        },
      ],
    },
  };
};
