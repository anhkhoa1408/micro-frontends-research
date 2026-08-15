import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactWrapperComponent } from './react-wrapper.component';
import { VueWrapperComponent } from './vue-wrapper.component';
import { AngularRemoteWrapperComponent } from './angular-remote-wrapper.component';
import { LoginComponent } from './login.component';
import { authService } from '@mfe/auth';

const authGuard = () => {
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'react',
    component: ReactWrapperComponent,
    canActivate: [authGuard],
  },
  {
    path: 'vue',
    component: VueWrapperComponent,
    canActivate: [authGuard],
  },
  {
    path: 'angular',
    component: AngularRemoteWrapperComponent,
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'react',
    pathMatch: 'full',
  },
];
