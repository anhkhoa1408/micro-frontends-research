import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { authService } from '@mfe/auth';
import { eventBus } from '@mfe/event-bus';

@Component({
  selector: 'app-react-wrapper',
  standalone: true,
  template: '<div #reactHost></div>',
})
export class ReactWrapperComponent implements OnInit, OnDestroy {
  @ViewChild('reactHost', { static: true }) reactHost!: ElementRef;

  private unmountFn?: () => void;

  async ngOnInit() {
    const { mount, unmount } = await loadRemoteModule({
      type: 'module',
      remoteEntry: 'http://localhost:5175/remoteEntry.js',
      exposedModule: './App',
    });
    mount(this.reactHost.nativeElement, {
      auth: authService.getState(),
      eventBus,
    });
    this.unmountFn = unmount;
  }

  ngOnDestroy() {
    this.unmountFn?.();
  }
}
