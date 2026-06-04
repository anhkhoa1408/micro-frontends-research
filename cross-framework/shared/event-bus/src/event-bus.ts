export type EventCallback<T = unknown> = (payload: T) => void;

interface Subscription {
  unsubscribe: () => void;
}

/**
 * Framework-agnostic Event Bus for cross-MFE communication.
 *
 * Two mechanisms:
 * 1. Internal pub/sub (for complex state sharing between MFEs on the same page)
 * 2. Custom Events on `window` (for simple fire-and-forget notifications)
 *
 * Usage:
 *   eventBus.emit('cart:updated', { itemCount: 3 });
 *   eventBus.on('cart:updated', (payload) => console.log(payload));
 */
class EventBus {
  private listeners = new Map<string, Set<EventCallback<any>>>();

  /**
   * Subscribe to an event. Returns an object with `unsubscribe()` for cleanup.
   */
  on<T = unknown>(event: string, callback: EventCallback<T>): Subscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return {
      unsubscribe: () => {
        this.listeners.get(event)?.delete(callback);
      },
    };
  }

  /**
   * Subscribe to an event, but auto-unsubscribe after the first invocation.
   */
  once<T = unknown>(event: string, callback: EventCallback<T>): Subscription {
    const sub = this.on<T>(event, (payload) => {
      sub.unsubscribe();
      callback(payload);
    });
    return sub;
  }

  /**
   * Emit an event to all subscribers. Also dispatches a CustomEvent on window
   * so that listeners attached via window.addEventListener can also receive it.
   */
  emit<T = unknown>(event: string, payload?: T): void {
    // Internal pub/sub
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }

    // Browser Custom Event (for cross-frame or simpler integrations)
    window.dispatchEvent(new CustomEvent(`mfe:${event}`, { detail: payload }));
  }

  /**
   * Remove all listeners for a specific event, or all events if no event specified.
   */
  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Helper to listen to Custom Events on window (useful from frameworks that
   * prefer DOM events over direct pub/sub).
   */
  onCustomEvent<T = unknown>(event: string, callback: EventCallback<T>): Subscription {
    const handler = (e: Event) => {
      callback((e as CustomEvent<T>).detail);
    };
    window.addEventListener(`mfe:${event}`, handler);

    return {
      unsubscribe: () => {
        window.removeEventListener(`mfe:${event}`, handler);
      },
    };
  }
}

// Singleton: shared across all MFEs loaded in the same window
const eventBus = (window as any).__MFE_EVENT_BUS__ || new EventBus();
(window as any).__MFE_EVENT_BUS__ = eventBus;

export { eventBus, EventBus };
export type { Subscription };
