# Cross-Framework Micro Frontends with Module Federation

A demonstration project showing how to compose a **single-page application** from independently deployed micro frontends written in **different frameworks** (Angular, React, Vue) — all loaded at runtime via [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Angular Host (port 4200)                      │
│                                                                 │
│  /react   ──► ReactWrapperComponent   ──► mount() from remote-1│
│  /vue     ──► VueWrapperComponent     ──► mount() from remote-2│
│  /angular ──► AngularRemoteWrapperCmp ──► mount() from remote-3│
│                                                                 │
│  Webpack Module Federation (consumer)                           │
└────────┬──────────────────┬──────────────────┬──────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│  React Remote  │ │   Vue Remote   │ │ Angular Remote │
│  (port 5175)   │ │  (port 5174)   │ │  (port 5176)   │
│                │ │                │ │                │
│  Vite +        │ │  Vite +        │ │  Webpack +     │
│  @module-      │ │  @module-      │ │  @angular-     │
│  federation/   │ │  federation/   │ │  architects/   │
│  vite          │ │  vite          │ │  module-fed    │
└────────────────┘ └────────────────┘ └────────────────┘
```

---

## How Remote Loading Works

### The Core Problem

When combining different frameworks in one shell, you cannot simply import a React component into Angular or vice versa — they have incompatible rendering models. The solution is a **framework-agnostic contract**: each remote exposes plain JavaScript functions (`mount` and `unmount`) that the host can call regardless of which framework produced them.

### The Mount/Unmount Contract

Every remote application — regardless of whether it's React, Vue, or Angular — must expose exactly two functions:

```typescript
export function mount(el: HTMLElement): void; // Render the app into the given DOM element
export function unmount(el?: HTMLElement): void; // Tear down the app and clean up resources
```

This contract decouples the host from any knowledge of the remote's internals. The host only needs to:

1. Fetch the remote bundle via Module Federation
2. Call `mount(element)` to render
3. Call `unmount()` when navigating away (to prevent memory leaks)

### Host-Side: Wrapper Components

For each remote, the Angular host defines a **wrapper component**. These wrappers follow an identical pattern:

```typescript
@Component({
  selector: "app-react-wrapper",
  standalone: true,
  template: "<div #reactHost></div>", // Empty container for the remote to render into
})
export class ReactWrapperComponent implements OnInit, OnDestroy {
  @ViewChild("reactHost", { static: true }) reactHost!: ElementRef;
  private unmountFn?: () => void;

  async ngOnInit() {
    // 1. Dynamically load the remote module at runtime
    const { mount, unmount } = await loadRemoteModule({
      type: "module",
      remoteEntry: "http://localhost:5175/remoteEntry.js",
      exposedModule: "./App",
    });

    // 2. Mount the remote app into our container element
    mount(this.reactHost.nativeElement);
    this.unmountFn = unmount;
  }

  ngOnDestroy() {
    // 3. Cleanup when Angular destroys this component (e.g., route change)
    this.unmountFn?.();
  }
}
```

**Key points:**

- `loadRemoteModule()` (from `@angular-architects/module-federation`) fetches the `remoteEntry.js` manifest, resolves the exposed module, and returns its exports.
- The `<div #reactHost>` is an empty DOM node that the remote "owns" — the host never touches its children directly.
- Cleanup in `ngOnDestroy` is critical to avoid memory leaks (dangling React roots, Vue app instances, etc.).

### Host-Side: Routing

Each wrapper component is mapped to a route. When the user navigates, Angular lazily renders the wrapper, which in turn loads and mounts the remote:

```typescript
export const routes: Routes = [
  { path: "react", component: ReactWrapperComponent },
  { path: "vue", component: VueWrapperComponent },
  { path: "angular", component: AngularRemoteWrapperComponent },
];
```

---

## Remote-Side: How Each Framework Exposes Itself

### 1. React Remote (`app-remote-1`)

| Property                 | Value                         |
| ------------------------ | ----------------------------- |
| Bundler                  | Vite                          |
| Module Federation Plugin | `@module-federation/vite`     |
| Port                     | 5175                          |
| Exposed module           | `./App` → `src/bootstrap.tsx` |

**How it works:**

React's `createRoot` API is designed to mount into any DOM element. The bootstrap file wraps this in the standard `mount`/`unmount` contract:

```tsx
// src/bootstrap.tsx
import { createRoot, type Root } from "react-dom/client";
import App from "./App";

let root: Root | null = null;

export function mount(el: HTMLElement) {
  root = createRoot(el); // Create a React root at the given element
  root.render(<App />); // Render the React component tree
}

export function unmount() {
  root?.unmount(); // Destroy the React tree and release resources
  root = null;
}
```

**Why this approach:** React 18+ uses `createRoot` which naturally accepts any DOM element. No additional bridging (like Web Components) is needed — React can render directly into the host-provided `<div>`.

### 2. Vue Remote (`app-remote-2`)

| Property                 | Value                           |
| ------------------------ | ------------------------------- |
| Bundler                  | Vite                            |
| Module Federation Plugin | `@module-federation/vite`       |
| Port                     | 5174                            |
| Exposed module           | `./VueApp` → `src/bootstrap.js` |

**How it works:**

Vue's `createApp` also mounts to any DOM element, making it straightforward:

```javascript
// src/bootstrap.js
import { createApp } from "vue";
import App from "./App.vue";

let app = null;

export function mount(el) {
  app = createApp(App); // Create a Vue application instance
  app.mount(el); // Mount it to the provided element
}

export function unmount() {
  app?.unmount(); // Destroy the Vue instance and clean up reactivity system
  app = null;
}
```

**Why this approach:** Vue 3's Composition API and `createApp` are designed to mount into arbitrary elements. Like React, no Web Component wrapping is required.

### 3. Angular Remote (`app-remote-3`)

| Property                 | Value                                   |
| ------------------------ | --------------------------------------- |
| Bundler                  | Webpack                                 |
| Module Federation Plugin | `@angular-architects/module-federation` |
| Port                     | 5176                                    |
| Exposed module           | `./AngularApp` → `src/bootstrap.ts`     |

**How it works:**

Angular is more complex because it cannot simply "render into an element" like React/Vue. Angular components require a running Angular platform and dependency injection context. The solution is **Angular Elements** — which converts Angular components into standard Web Components (Custom Elements):

```typescript
// src/bootstrap.ts
import { createApplication } from "@angular/platform-browser";
import { createCustomElement } from "@angular/elements";
import { ApplicationRef } from "@angular/core";
import { RemoteAppComponent } from "./app/remote-app.component";

let appRef: ApplicationRef | null = null;

export async function mount(el: HTMLElement) {
  // 1. Bootstrap a minimal Angular application (no routing, no full module)
  const app = await createApplication({ providers: [] });
  appRef = app;

  // 2. Convert the Angular component to a Web Component (Custom Element)
  const element = createCustomElement(RemoteAppComponent, { injector: app.injector });

  // 3. Register the custom element in the browser's registry (only once)
  if (!customElements.get("app-remote-3-element")) {
    customElements.define("app-remote-3-element", element);
  }

  // 4. Insert the custom element into the host-provided container
  el.innerHTML = "<app-remote-3-element></app-remote-3-element>";
}

export function unmount(el: HTMLElement) {
  el.innerHTML = ""; // Remove the custom element from DOM
  appRef?.destroy(); // Destroy the Angular platform and release resources
  appRef = null;
}
```

**Why Angular Elements?**

- Angular components rely on change detection, dependency injection, and zone.js — they cannot render without a running Angular environment.
- `createCustomElement()` wraps the component as a standard HTML Custom Element, which can live in any DOM context (including inside another Angular app's `<div>`).
- The host Angular app and the remote Angular app have **separate** Angular platforms — they don't share DI or change detection.

---

## Module Federation Configuration

### How Module Federation Connects Everything

Module Federation works by having each remote produce a **manifest file** (`remoteEntry.js`) that describes what modules are available. The host is configured to know where each remote's manifest lives.

At runtime:

1. Host encounters a route that needs a remote module
2. `loadRemoteModule()` fetches the remote's `remoteEntry.js`
3. The manifest tells the host how to load the actual code chunks
4. The exposed module's exports (`mount`, `unmount`) are returned to the host

### Host Configuration (`app-host/webpack.config.js`)

```javascript
const { shareAll, withModuleFederationPlugin } = require("@angular-architects/module-federation/webpack");

module.exports = withModuleFederationPlugin({
  name: "app-host",

  remotes: {
    "app-remote-1": "app-remote-1@http://localhost:5175/remoteEntry.js",
    "app-remote-2": "app-remote-2@http://localhost:5174/remoteEntry.js",
    "app-remote-3": "app-remote-3@http://localhost:5176/remoteEntry.js",
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
  },
});
```

**Explanation:**

- `remotes` maps logical names to URLs where each remote's `remoteEntry.js` is served.
- `shared` declares packages that should be shared (deduplicated) between host and remotes to reduce bundle size.

### Remote Configurations

| Remote                 | Plugin                                  | Config file         | Expose key     |
| ---------------------- | --------------------------------------- | ------------------- | -------------- |
| app-remote-1 (React)   | `@module-federation/vite`               | `vite.config.ts`    | `./App`        |
| app-remote-2 (Vue)     | `@module-federation/vite`               | `vite.config.js`    | `./VueApp`     |
| app-remote-3 (Angular) | `@angular-architects/module-federation` | `webpack.config.js` | `./AngularApp` |

Each remote's config specifies:

- `name`: unique identifier matching what the host expects
- `filename`: output manifest name (always `remoteEntry.js`)
- `exposes`: mapping of public module names to internal file paths
- `shared`: libraries to share with the host (to avoid duplicate React, Vue, etc.)

---

## Tech Stack

| App          | Framework | Version | Bundler | Module Federation Plugin                |
| ------------ | --------- | ------- | ------- | --------------------------------------- |
| app-host     | Angular   | 20      | Webpack | `@angular-architects/module-federation` |
| app-remote-1 | React     | 18+     | Vite    | `@module-federation/vite`               |
| app-remote-2 | Vue       | 3       | Vite    | `@module-federation/vite`               |
| app-remote-3 | Angular   | 20      | Webpack | `@angular-architects/module-federation` |

---

## Project Structure

```
cross-framework/
├── app-host/                          # Angular 20 — Shell/Host application
│   ├── webpack.config.js              # Module Federation: declares all remotes
│   ├── src/
│   │   ├── main.ts                    # Entry point (dynamic import for MF compatibility)
│   │   ├── bootstrap.ts              # Bootstraps Angular application
│   │   └── app/
│   │       ├── app.routes.ts          # Maps URL paths to wrapper components
│   │       ├── react-wrapper.component.ts      # Loads & mounts React remote
│   │       ├── vue-wrapper.component.ts        # Loads & mounts Vue remote
│   │       └── angular-remote-wrapper.component.ts  # Loads & mounts Angular remote
│   └── types/
│       └── module-federation.d.ts     # TypeScript declarations for remote modules
│
├── app-remote-1/                      # React — Vite-based remote
│   ├── vite.config.ts                 # Module Federation: exposes ./App
│   └── src/
│       ├── bootstrap.tsx              # mount() / unmount() — entry for MF
│       └── App.tsx                    # Main React component
│
├── app-remote-2/                      # Vue 3 — Vite-based remote
│   ├── vite.config.js                 # Module Federation: exposes ./VueApp
│   └── src/
│       ├── bootstrap.js               # mount() / unmount() — entry for MF
│       └── App.vue                    # Main Vue component
│
└── app-remote-3/                      # Angular 20 — Webpack-based remote
    ├── webpack.config.js              # Module Federation: exposes ./AngularApp
    └── src/
        ├── main.ts                    # Dynamic import for MF compatibility
        ├── bootstrap.ts               # mount() / unmount() via Angular Elements
        └── app/
            └── remote-app.component.ts  # Standalone Angular component
```

---

## Key Concepts Explained

### Why `mount`/`unmount` instead of direct component sharing?

Different frameworks have fundamentally different rendering paradigms:

- **React** uses a virtual DOM and reconciliation
- **Vue** uses a reactivity system with templates
- **Angular** uses change detection, zones, and dependency injection

There's no universal "component" format. By standardizing on DOM-level functions (`mount` into an element, `unmount` to clean up), we create a **framework-agnostic boundary** that any framework can implement.

### Why does Angular remote need Angular Elements?

React and Vue can mount into any DOM element natively (`createRoot(el)`, `createApp().mount(el)`). Angular cannot — it needs a bootstrapped platform, module system, and injector. Angular Elements bridges this gap by converting components into standard Web Components (Custom Elements) that behave like regular HTML tags in any DOM context.

### Why dynamic imports in `main.ts`?

Both the host and Angular remote use `import('./bootstrap')` in their `main.ts`. This is required for Module Federation to work correctly — it allows Webpack to resolve shared dependencies before the application code runs. Without this async boundary, shared modules might load multiple copies.

### Why separate bundlers (Webpack vs Vite)?

- **Angular host & remote**: Use Webpack because `@angular-architects/module-federation` integrates with Angular CLI's Webpack-based build system.
- **React & Vue remotes**: Use Vite because `@module-federation/vite` provides first-class Vite support with faster dev server and HMR.

Both produce compatible `remoteEntry.js` manifests that follow the Module Federation protocol.

---

## Cross-MFE Communication

Communication between micro frontends is one of the trickiest parts of MFE architecture. Since each MFE may use a different framework with its own state management, we need a **framework-agnostic** approach.

### Two Mechanisms

This project implements both approaches, used together:

#### 1. Shared Event Bus (Internal Pub/Sub)

A singleton `EventBus` instance lives on `window.__MFE_EVENT_BUS__` and is shared across all MFEs loaded on the same page. Any MFE can publish or subscribe:

```typescript
// Any MFE can emit
eventBus.emit("global:message", { from: "React MFE", text: "Hello!" });

// Any MFE can subscribe
const sub = eventBus.on("global:message", (payload) => {
  console.log(payload.from, payload.text);
});

// Cleanup when component unmounts
sub.unsubscribe();
```

**When to use:** Complex state sharing, multiple subscribers, need cleanup control.

#### 2. Browser Custom Events

Every `eventBus.emit()` also dispatches a `CustomEvent` on `window` with a `mfe:` prefix:

```javascript
// Fired automatically by eventBus.emit('global:message', data)
// Equivalent to:
window.dispatchEvent(new CustomEvent("mfe:global:message", { detail: data }));

// Listen from any framework (or vanilla JS):
window.addEventListener("mfe:global:message", (e) => {
  console.log(e.detail);
});
```

**When to use:** Simple fire-and-forget notifications, integration with non-MFE code, cross-tab communication (via storage events).

### How Props Are Passed to Remotes

The host passes both `auth` state and the `eventBus` instance to each remote via the `mount()` function:

```typescript
// Host wrapper component (Angular)
mount(element, {
  auth: authService.getState(), // { isAuthenticated, user, token }
  eventBus, // Shared event bus singleton
});
```

Each remote receives these props and integrates them into its own framework:

| Framework | How props are consumed                                                           |
| --------- | -------------------------------------------------------------------------------- |
| React     | Passed as component props: `<App auth={props.auth} eventBus={props.eventBus} />` |
| Vue       | Passed via `createApp(App, { hostProps: props })` → `defineProps()`              |
| Angular   | Injected via `InjectionToken`: `@Inject(MFE_PROPS) props: MountProps`            |

### Communication Flow Example

```
React MFE                     Event Bus                    Vue MFE
    │                             │                           │
    │── emit('global:message') ──►│                           │
    │                             │── notify subscriber ─────►│
    │                             │                           │
    │                             │   Also dispatches:        │
    │                             │   CustomEvent on window   │
    │                             │                           │
```

---

## Authentication

### Architecture

```
┌─────────────┐       POST /api/auth/login       ┌──────────────┐
│  Angular    │  ──────────────────────────────►  │  Auth Server │
│  Host       │  ◄──────────────────────────────  │  (port 3001) │
│  (Login UI) │       { token, user }             │  Express+JWT │
└──────┬──────┘                                   └──────────────┘
       │
       │  Stores token + user in localStorage
       │  Notifies all subscribers
       │
       ▼
┌──────────────────────────────────────────────────────┐
│              AuthService (singleton on window)         │
│                                                       │
│  • login(credentials) → fetch → store → notify       │
│  • logout() → clear storage → notify                 │
│  • getState() → { isAuthenticated, user, token }     │
│  • subscribe(listener) → called on every change      │
│  • Dispatches CustomEvent 'mfe:auth:changed'         │
│                                                       │
│  Storage: localStorage('mfe_auth_token')             │
│           localStorage('mfe_auth_user')              │
└──────────────────────────────────────────────────────┘
       │
       │  Auth state passed to remotes via mount(el, { auth })
       │
       ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ React MFE  │  │  Vue MFE   │  │ Angular MFE│
│            │  │            │  │            │
│ Shows user │  │ Shows user │  │ Shows user │
│ info       │  │ info       │  │ info       │
└────────────┘  └────────────┘  └────────────┘
```

### How It Works

1. **User visits a protected route** → Angular's `authGuard` checks `authService.isAuthenticated()`
2. **If not authenticated** → Redirects to `/login`
3. **User submits login form** → `authService.login()` calls `POST /api/auth/login`
4. **Auth server validates credentials** → Returns JWT token + user object
5. **AuthService stores token/user** in `localStorage` and notifies all subscribers
6. **Host shell updates** → Shows username + logout button in header
7. **User navigates to MFE route** → Guard passes, wrapper mounts remote with auth state
8. **Remote receives auth** → Displays current user info

### Auth Guard (Route Protection)

```typescript
const authGuard = () => {
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(["/login"]);
};

export const routes: Routes = [
  { path: "login", component: LoginComponent },
  { path: "react", component: ReactWrapperComponent, canActivate: [authGuard] },
  { path: "vue", component: VueWrapperComponent, canActivate: [authGuard] },
  { path: "angular", component: AngularRemoteWrapperComponent, canActivate: [authGuard] },
];
```

### Cross-Tab Sync

The `AuthService` listens to `window.storage` events, so logging out in one tab automatically logs out all other tabs showing the same application.

### Auth Server

A simple Express server with hardcoded users (for demo purposes):

| Username | Password | Roles       |
| -------- | -------- | ----------- |
| admin    | admin123 | admin, user |
| user     | user123  | user        |

Endpoints:

- `POST /api/auth/login` — Returns `{ token, user }` on valid credentials
- `GET /api/auth/me` — Returns current user (requires `Authorization: Bearer <token>`)
- `GET /api/auth/health` — Health check

---

## Getting Started (Updated)

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
cd cross-framework/auth-server && npm install
cd cross-framework/app-host && npm install
cd cross-framework/app-remote-1 && npm install
cd cross-framework/app-remote-2 && npm install
cd cross-framework/app-remote-3 && npm install
```

### Running the Application

Start services in this order:

```bash
# Terminal 1 — Auth Server
cd cross-framework/auth-server && npm run dev       # → http://localhost:3001

# Terminal 2 — React remote
cd cross-framework/app-remote-1 && npm run dev      # → http://localhost:5175

# Terminal 3 — Vue remote
cd cross-framework/app-remote-2 && npm run dev      # → http://localhost:5174

# Terminal 4 — Angular remote
cd cross-framework/app-remote-3 && npm start        # → http://localhost:5176

# Terminal 5 — Angular host (start last)
cd cross-framework/app-host && npm start            # → http://localhost:4200
```

### Test Flow

1. Open http://localhost:4200 → Redirects to `/login`
2. Login with `admin` / `admin123`
3. Navigate between `/react`, `/vue`, `/angular` tabs
4. Click "Send Message to Other MFEs" in any remote
5. Navigate to another remote → See the received messages
6. Click "Logout" → Redirected to login

---

## Updated Project Structure

```
cross-framework/
├── shared/                            # Shared libraries (framework-agnostic)
│   ├── auth/                          # Authentication service
│   │   └── src/
│   │       ├── index.ts               # Public API
│   │       ├── auth-service.ts        # AuthService singleton (login, logout, subscribe)
│   │       └── types.ts              # User, AuthState, LoginCredentials interfaces
│   └── event-bus/                     # Cross-MFE event bus
│       └── src/
│           ├── index.ts               # Public API
│           └── event-bus.ts           # EventBus singleton (emit, on, once, clear)
│
├── auth-server/                       # Express + JWT auth server (port 3001)
│   └── src/
│       └── server.ts                  # Login endpoint, token verification
│
├── app-host/                          # Angular 20 — Shell/Host
│   ├── webpack.config.js              # Module Federation: 3 remotes
│   └── src/app/
│       ├── app.ts                     # Shell component (auth state in header)
│       ├── app.html                   # Navigation + router-outlet
│       ├── app.routes.ts              # Routes with authGuard
│       ├── login.component.ts         # Login form
│       ├── react-wrapper.component.ts # Mounts React with { auth, eventBus }
│       ├── vue-wrapper.component.ts   # Mounts Vue with { auth, eventBus }
│       └── angular-remote-wrapper.component.ts
│
├── app-remote-1/ (React)              # Receives props, uses eventBus
├── app-remote-2/ (Vue)                # Receives props, uses eventBus
└── app-remote-3/ (Angular)            # Receives props via InjectionToken
```
