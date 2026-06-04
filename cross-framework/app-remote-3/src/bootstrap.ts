import { createApplication } from "@angular/platform-browser";
import { createCustomElement } from "@angular/elements";
import { ApplicationRef, InjectionToken, provideZonelessChangeDetection } from "@angular/core";
import { RemoteAppComponent } from "./app/remote-app.component";

export interface MountProps {
  auth?: { isAuthenticated: boolean; user: any; token: string | null };
  eventBus?: any;
}

export const MFE_PROPS = new InjectionToken<MountProps>("MFE_PROPS");

// Standalone run is handled by main.ts when accessed directly.
// This file is the entry point for Module Federation (exposes mount/unmount).

// Mount/unmount for cross-framework usage
let appRef: ApplicationRef | null = null;

export async function mount(el: HTMLElement, props: MountProps = {}) {
  const app = await createApplication({
    providers: [provideZonelessChangeDetection(), { provide: MFE_PROPS, useValue: props }],
  });
  appRef = app;

  const element = createCustomElement(RemoteAppComponent, { injector: app.injector });

  // Register custom element if not already registered
  if (!customElements.get("app-remote-3-element")) {
    customElements.define("app-remote-3-element", element);
  }

  el.innerHTML = "<app-remote-3-element></app-remote-3-element>";
}

export function unmount(el: HTMLElement) {
  el.innerHTML = "";
  appRef = null;
}
