# Micro Frontends Learning

A hands-on learning repository exploring **Module Federation** — the runtime module sharing mechanism that enables independently deployed micro frontends to compose into a single application.

This repo contains two complete examples demonstrating different architectural approaches.

---

## Repository Structure

```
micro-frontends-learning/
├── same-framework/          # All apps use React — simplest approach
│   ├── app-host/            # React host (port 5173)
│   ├── app-remote-1/        # React remote (port 6002)
│   └── app-remote-2/        # React remote (port 6003)
│
└── cross-framework/         # Apps use Angular, React, Vue — advanced approach
    ├── app-host/            # Angular host (port 4200)
    ├── app-remote-1/        # React remote (port 5175)
    ├── app-remote-2/        # Vue remote (port 5174)
    ├── app-remote-3/        # Angular remote (port 5176)
    ├── auth-server/         # Express + JWT auth (port 3001)
    └── shared/              # Shared libraries
        ├── auth/            # @mfe/auth — authentication service
        └── event-bus/       # @mfe/event-bus — cross-MFE pub/sub
```

---

## Two Approaches Compared

### 1. Same-Framework (`same-framework/`)

The simplest micro frontend architecture — all apps use **React 19 + Vite + @module-federation/vite**.

- Remote components are imported directly as React components
- No wrappers or adapters needed
- Shared `react` and `react-dom` ensure a single React instance at runtime
- Ideal when all teams use the same framework

```tsx
// Host simply imports remote components
import App1 from "app_remote_1/App1";
import App2 from "app_remote_2/App2";

function App() {
  return (
    <>
      <App1 />
      <App2 />
    </>
  );
}
```

### 2. Cross-Framework (`cross-framework/`)

A more complex architecture combining **Angular 20**, **React 18+**, and **Vue 3** in a single shell.

- Each remote exposes `mount(el)` / `unmount()` functions (framework-agnostic contract)
- The Angular host uses wrapper components to load and mount remotes into DOM containers
- Includes authentication (JWT), route guards, and cross-MFE communication via event bus
- Demonstrates real-world patterns: auth state sharing, messaging between MFEs, cleanup on navigation

```typescript
// Framework-agnostic contract — every remote implements this
export function mount(el: HTMLElement, props?: MountProps): void;
export function unmount(el?: HTMLElement): void;
```

---

## Tech Stack Summary

| Example         | App          | Framework  | Bundler | MF Plugin                               |
| --------------- | ------------ | ---------- | ------- | --------------------------------------- |
| same-framework  | app-host     | React 19   | Vite 7  | `@module-federation/vite`               |
| same-framework  | app-remote-1 | React 19   | Vite 7  | `@module-federation/vite`               |
| same-framework  | app-remote-2 | React 19   | Vite 7  | `@module-federation/vite`               |
| cross-framework | app-host     | Angular 20 | Webpack | `@angular-architects/module-federation` |
| cross-framework | app-remote-1 | React 18+  | Vite    | `@module-federation/vite`               |
| cross-framework | app-remote-2 | Vue 3      | Vite    | `@module-federation/vite`               |
| cross-framework | app-remote-3 | Angular 20 | Webpack | `@angular-architects/module-federation` |

---

## Key Concepts

### Module Federation

Module Federation allows JavaScript applications to dynamically load code from other applications at runtime. Each "remote" produces a `remoteEntry.js` manifest describing what modules are available. The "host" fetches this manifest and loads modules on demand.

### When to Use Each Approach

| Scenario                                       | Recommended Approach |
| ---------------------------------------------- | -------------------- |
| All teams use the same framework               | Same-Framework       |
| Teams need framework autonomy                  | Cross-Framework      |
| Migrating from monolith (incremental adoption) | Cross-Framework      |
| Greenfield project with unified stack          | Same-Framework       |
| Need to embed legacy apps in a new shell       | Cross-Framework      |

### Shared Dependencies

Both approaches use Module Federation's `shared` config to deduplicate common libraries. When the host and remotes declare the same library as shared, only one copy is loaded at runtime (negotiated by version).

### Independent Deployment

Each micro frontend can be:

- Developed independently (each has its own dev server)
- Built independently (separate CI/CD pipelines)
- Deployed independently (update one remote without redeploying the host)

---

## Quick Start

### Same-Framework (React)

```bash
# Install
cd same-framework/app-remote-1 && npm install
cd same-framework/app-remote-2 && npm install
cd same-framework/app-host && npm install

# Run (start remotes first)
cd same-framework/app-remote-1 && npm run dev    # → localhost:6002
cd same-framework/app-remote-2 && npm run dev    # → localhost:6003
cd same-framework/app-host && npm run dev        # → localhost:5173
```

### Cross-Framework (Angular + React + Vue)

```bash
# Install
cd cross-framework/auth-server && npm install
cd cross-framework/app-remote-1 && npm install
cd cross-framework/app-remote-2 && npm install
cd cross-framework/app-remote-3 && npm install
cd cross-framework/app-host && npm install

# Run (start in order)
cd cross-framework/auth-server && npm run dev       # → localhost:3001
cd cross-framework/app-remote-1 && npm run dev      # → localhost:5175
cd cross-framework/app-remote-2 && npm run dev      # → localhost:5174
cd cross-framework/app-remote-3 && npm start        # → localhost:5176
cd cross-framework/app-host && npm start            # → localhost:4200
```

Login credentials: `admin` / `admin123` or `user` / `user123`

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Further Reading

- [Module Federation Documentation](https://module-federation.io/)
- [@module-federation/vite](https://github.com/module-federation/vite)
- [@angular-architects/module-federation](https://github.com/angular-architects/module-federation-plugin)
- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)
