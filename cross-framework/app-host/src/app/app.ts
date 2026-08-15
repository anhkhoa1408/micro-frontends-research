import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { authService } from '@mfe/auth';
import type { User } from '@mfe/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  isAuthenticated = false;
  user: User | null = null;
  private unsubscribe?: () => void;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    const state = authService.getState();
    this.isAuthenticated = state.isAuthenticated;
    this.user = state.user;

    this.ngZone.runOutsideAngular(() => {
      this.unsubscribe = authService.subscribe(
        (newState: { isAuthenticated: boolean; user: User | null }) => {
          this.ngZone.run(() => {
            this.isAuthenticated = newState.isAuthenticated;
            this.user = newState.user;
          });
        },
      );
    });
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }

  logout() {
    authService.logout();
  }
}
