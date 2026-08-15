const {
  shareAll,
  withModuleFederationPlugin,
} = require("@angular-architects/module-federation/webpack");

module.exports = withModuleFederationPlugin({
  name: "app-host",

  exposes: {
    "./Component": "./src/app/app.ts",
  },

  remotes: {
    "app-remote-1": "app-remote-1@http://localhost:5175/remoteEntry.js",
    "app-remote-2": "app-remote-2@http://localhost:5174/remoteEntry.js",
    "app-remote-3": "app-remote-3@http://localhost:5176/remoteEntry.js",
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
  },
});
