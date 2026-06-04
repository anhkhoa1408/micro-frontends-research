import { createRoot, type Root } from "react-dom/client";
import App from "./App";

let root: Root | null = null;

export function mount(el: HTMLElement) {
  root = createRoot(el);
  root.render(<App />);
}

export function unmount() {
  root?.unmount();
  root = null;
}
