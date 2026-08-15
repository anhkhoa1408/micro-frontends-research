import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { authService } from '@mfe/auth';
import { eventBus } from '@mfe/event-bus';

@Component({
  selector: 'app-angular-wrapper',
  standalone: true,
  template: '<div #angularHost></div>',
})
export class AngularRemoteWrapperComponent implements OnInit, OnDestroy {
  @ViewChild('angularHost', { static: true }) angularHost!: ElementRef;

  private unmountFn?: (el: HTMLElement) => void;

  constructor(private ngZone: NgZone) {}

  async ngOnInit() {
    const { mount, unmount } = await loadRemoteModule({
      type: 'module',
      remoteEntry: 'http://localhost:5176/remoteEntry.js',
      exposedModule: './AngularApp',
    });

    // Run remote Angular app outside the host's NgZone to avoid NG0909
    this.ngZone.runOutsideAngular(() => {
      mount(this.angularHost.nativeElement, {
        auth: authService.getState(),
        eventBus,
      });
    });
    this.unmountFn = unmount;
  }

  ngOnDestroy() {
    this.unmountFn?.(this.angularHost.nativeElement);
  }
}
