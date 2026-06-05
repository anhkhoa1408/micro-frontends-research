# Same-Framework Micro Frontends with Module Federation

A demonstration project showing how to compose a **single-page application** from independently deployed micro frontends — all built with **React 19** and loaded at runtime via [Module Federation](https://module-federation.io/) (Vite plugin).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              React Host (port 5173)                      │
│                                                         │
│   import App1 from "app_remote_1/App1"                  │
│   import App2 from "app_remote_2/App2"                  │
│                                                         │
│   <App1 />                                              │
│   <App2 />                                              │
│                                                         │
│   Vite + @module-federation/vite (consumer)             │
└────────────────┬──────────────────┬─────────────────────┘
                 │                  │
                 ▼                  ▼
┌────────────────────────┐ ┌────────────────────────┐
│   React Remote 1       │ │   React Remote 2       │
│   (port 6002)          │ │   (port 6003)          │
│                        │ │                        │
│   Vite +               │ │   Vite +               │
│   @module-federation/  │ │   @module-federation/  │
│   vite                 │ │   vite                 │
│                        │ │                        │
│   Exposes: ./App1      │ │   Exposes: ./App2      │
└────────────────────────┘ └────────────────────────┘
```

---

## How It Works

### Direct Component Sharing

Since all applications use the **same framework** (React), there's no need for the `mount`/`unmount` pattern used in cross-framework setups. Remote components are imported and rendered directly as regular React components:

```tsx
// app-host/src/App.tsx
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

Module Federation handles loading the remote bundles at runtime. The host doesn't bundle the remote code — it fetches it from the remote's dev server (or CDN in production).

### Shared Dependencies

React and React DOM are declared as `shared` in all three configs. This means:

- Only **one copy** of React is loaded at runtime (avoiding duplicate React instances)
- The host and remotes negotiate which version to use
- Bundle size is reduced since shared libraries aren't duplicated

### Type Safety

The host uses ambient type declarations to provide TypeScript support for remote modules:

```typescript
// @types/index.d.ts
declare module "app_remote_1/App1" {
  const App1: React.ComponentType;
  export default App1;
}
```

---

## Tech Stack

| App          | Framework | Version | Bundler | Module Federation Plugin  |
| ------------ | --------- | ------- | ------- | ------------------------- |
| app-host     | React     | 19      | Vite 7  | `@module-federation/vite` |
| app-remote-1 | React     | 19      | Vite 7  | `@module-federation/vite` |
| app-remote-2 | React     | 19      | Vite 7  | `@module-federation/vite` |

---

## Project Structure

```
same-framework/
├── app-host/                          # React — Shell/Host application
│   ├── vite.config.ts                 # Module Federation: declares 2 remotes
│   ├── @types/
│   │   └── index.d.ts                 # Type declarations for remote modules
│   └── src/
│       ├── main.tsx                   # Entry point
│       └── App.tsx                    # Renders <App1 /> and <App2 />
│
├── app-remote-1/                      # React — Remote application 1
│   ├── vite.config.ts                 # Module Federation: exposes ./App1
│   └── src/
│       ├── main.tsx                   # Standalone entry (for independent dev)
│       └── App.tsx                    # Exported component
│
└── app-remote-2/                      # React — Remote application 2
    ├── vite.config.ts                 # Module Federation: exposes ./App2
    └── src/
        ├── main.tsx                   # Standalone entry (for independent dev)
        └── App.tsx                    # Exported component
```

---

## Module Federation Configuration

### Host (`app-host/vite.config.ts`)

```typescript
federation({
  name: "app-host",
  remotes: {
    app_remote_1: {
      type: "module",
      name: "app_remote_1",
      entry: "http://localhost:6002/remoteEntry.js",
    },
    app_remote_2: {
      type: "module",
      name: "app_remote_2",
      entry: "http://localhost:6003/remoteEntry.js",
    },
  },
  shared: ["react", "react-dom"],
});
```

### Remote 1 (`app-remote-1/vite.config.ts`)

```typescript
federation({
  name: "app_remote_1",
  filename: "remoteEntry.js",
  exposes: {
    "./App1": "./src/App.tsx",
  },
  shared: ["react", "react-dom"],
});
```

### Remote 2 (`app-remote-2/vite.config.ts`)

```typescript
federation({
  name: "app_remote_2",
  filename: "remoteEntry.js",
  exposes: {
    "./App2": "./src/App.tsx",
  },
  shared: ["react", "react-dom"],
});
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
cd same-framework/app-host && npm install
cd same-framework/app-remote-1 && npm install
cd same-framework/app-remote-2 && npm install
```

### Running the Application

Start remotes first, then the host:

```bash
# Terminal 1 — Remote 1
cd same-framework/app-remote-1 && npm run dev    # → http://localhost:6002

# Terminal 2 — Remote 2
cd same-framework/app-remote-2 && npm run dev    # → http://localhost:6003

# Terminal 3 — Host (start last)
cd same-framework/app-host && npm run dev        # → http://localhost:5173
```

### Production Build

```bash
# Build all apps
cd same-framework/app-remote-1 && npm run build
cd same-framework/app-remote-2 && npm run build
cd same-framework/app-host && npm run build

# Preview production builds
cd same-framework/app-remote-1 && npm run preview    # → http://localhost:6002
cd same-framework/app-remote-2 && npm run preview    # → http://localhost:6003
cd same-framework/app-host && npm run preview        # → http://localhost:5173
```

---

## Key Differences from Cross-Framework Approach

| Aspect               | Same-Framework                           | Cross-Framework                            |
| -------------------- | ---------------------------------------- | ------------------------------------------ |
| Component sharing    | Direct imports (native React components) | `mount`/`unmount` contract (DOM-level)     |
| Wrapper components   | Not needed                               | Required for each remote                   |
| Shared dependencies  | `react`, `react-dom`                     | Framework-specific per remote              |
| Complexity           | Low                                      | High (bridging different rendering models) |
| Bundle optimization  | Excellent (single React instance)        | Good (some duplication across frameworks)  |
| Developer experience | Familiar React patterns                  | Must understand each framework's lifecycle |
