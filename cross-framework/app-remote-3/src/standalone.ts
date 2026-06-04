import { createApplication } from "@angular/platform-browser";
import { createCustomElement } from "@angular/elements";
import { provideZonelessChangeDetection } from "@angular/core";
import { RemoteAppComponent } from "./app/remote-app.component";
import { MFE_PROPS } from "./bootstrap";

// Standalone bootstrap (only runs when app is accessed directly at port 5176)
async function bootstrap() {
  const app = await createApplication({
    providers: [provideZonelessChangeDetection(), { provide: MFE_PROPS, useValue: {} }],
  });
  const element = createCustomElement(RemoteAppComponent, { injector: app.injector });

  if (!customElements.get("app-remote-3-element")) {
    customElements.define("app-remote-3-element", element);
  }

  const root = document.querySelector("app-root");
  if (root) {
    root.innerHTML = "<app-remote-3-element></app-remote-3-element>";
  }
}

bootstrap();
