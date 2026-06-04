import { createApp } from 'vue';
import App from './App.vue';

let app = null;

export function mount(el) {
  app = createApp(App);
  app.mount(el);
}

export function unmount() {
  app?.unmount();
  app = null;
}
