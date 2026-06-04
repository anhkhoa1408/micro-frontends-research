import { createRoot, type Root } from "react-dom/client";
import App from "./App";

export interface MountProps {
  auth?: { isAuthenticated: boolean; user: any; token: string | null };
  eventBus?: any;
}

let root: Root | null = null;

export function mount(el: HTMLElement, props?: MountProps) {
  root = createRoot(el);
  root.render(<App {...props} />);
}

export function unmount() {
  root?.unmount();
  root = null;
}
