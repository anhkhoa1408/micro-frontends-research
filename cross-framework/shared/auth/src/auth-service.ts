import type { AuthState, LoginCredentials, LoginResponse, User } from './types';

type AuthListener = (state: AuthState) => void;

const STORAGE_KEY = 'mfe_auth_token';
const USER_KEY = 'mfe_auth_user';
const AUTH_API_URL = 'http://localhost:3001/api/auth';

/**
 * Shared Authentication Service.
 *
 * - Manages auth state (token + user) in localStorage
 * - Provides login/logout via the auth server
 * - Notifies all subscribers (across MFEs) when auth state changes
 * - Dispatches Custom Events so any framework can react to auth changes
 */
class AuthService {
  private listeners = new Set<AuthListener>();
  private state: AuthState;

  constructor() {
    this.state = this.loadFromStorage();

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY || e.key === USER_KEY) {
        this.state = this.loadFromStorage();
        this.notify();
      }
    });
  }

  private loadFromStorage(): AuthState {
    const token = localStorage.getItem(STORAGE_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    let user: User | null = null;

    if (userJson) {
      try {
        user = JSON.parse(userJson);
      } catch {
        user = null;
      }
    }

    return {
      isAuthenticated: !!token && !!user,
      token,
      user,
    };
  }

  /**
   * Login via the auth server. Stores token + user in localStorage.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    const data: LoginResponse = await response.json();

    localStorage.setItem(STORAGE_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    this.state = {
      isAuthenticated: true,
      token: data.token,
      user: data.user,
    };

    this.notify();
    return data;
  }

  /**
   * Logout: clears token and user from localStorage.
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);

    this.state = {
      isAuthenticated: false,
      token: null,
      user: null,
    };

    this.notify();
  }

  /**
   * Get the current auth state (synchronous).
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Get the current token (or null if not authenticated).
   */
  getToken(): string | null {
    return this.state.token;
  }

  /**
   * Get the current user (or null if not authenticated).
   */
  getUser(): User | null {
    return this.state.user;
  }

  /**
   * Check if the user is authenticated.
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  /**
   * Subscribe to auth state changes. Returns unsubscribe function.
   */
  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();

    // Notify internal subscribers
    this.listeners.forEach((listener) => listener(state));

    // Dispatch Custom Event for any framework to pick up
    window.dispatchEvent(
      new CustomEvent('mfe:auth:changed', { detail: state })
    );
  }
}

// Singleton: shared across all MFEs loaded in the same window
const authService = (window as any).__MFE_AUTH_SERVICE__ || new AuthService();
(window as any).__MFE_AUTH_SERVICE__ = authService;

export { authService, AuthService };
