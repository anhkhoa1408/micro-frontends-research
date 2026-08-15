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
  selector: 'app-vue-wrapper',
  standalone: true,
  template: '<div #vueHost></div>',
})
export class VueWrapperComponent implements OnInit, OnDestroy {
  @ViewChild('vueHost', { static: true }) vueHost!: ElementRef;

  private unmountFn?: () => void;

  async ngOnInit() {
    const { mount, unmount } = await loadRemoteModule({
      type: 'module',
      remoteEntry: 'http://localhost:5174/remoteEntry.js',
      exposedModule: './VueApp',
    });
    mount(this.vueHost.nativeElement, {
      auth: authService.getState(),
      eventBus,
    });
    this.unmountFn = unmount;
  }

  ngOnDestroy() {
    this.unmountFn?.();
  }
}
