import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { ApplicationRef } from '@angular/core';
import { RemoteAppComponent } from './app/remote-app.component';

// Standalone run (when accessed directly)
async function standalone() {
  const app = await createApplication({
    providers: [],
  });
  const element = createCustomElement(RemoteAppComponent, { injector: app.injector });
  customElements.define('app-remote-3-element', element);

  const root = document.querySelector('app-root');
  if (root) {
    root.innerHTML = '<app-remote-3-element></app-remote-3-element>';
  }
}

// Only bootstrap standalone if not loaded as remote
if (document.querySelector('app-root')) {
  standalone();
}

// Mount/unmount for cross-framework usage
let appRef: ApplicationRef | null = null;

export async function mount(el: HTMLElement) {
  const app = await createApplication({
    providers: [],
  });
  appRef = app;

  const element = createCustomElement(RemoteAppComponent, { injector: app.injector });

  // Register custom element if not already registered
  if (!customElements.get('app-remote-3-element')) {
    customElements.define('app-remote-3-element', element);
  }

  el.innerHTML = '<app-remote-3-element></app-remote-3-element>';
}

export function unmount(el: HTMLElement) {
  el.innerHTML = '';
  appRef?.destroy();
  appRef = null;
}
