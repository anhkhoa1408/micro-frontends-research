import { Component, Inject, OnDestroy, OnInit, Optional } from "@angular/core";
import { MFE_PROPS, type MountProps } from "../bootstrap";

@Component({
  selector: "app-remote-3",
  standalone: true,
  template: `
    <div class="angular-remote">
      <h2>🅰️ Angular Remote Micro Frontend</h2>

      @if (props?.auth?.isAuthenticated) {
        <div class="auth-info">
          Logged in as: <strong>{{ props?.auth?.user?.username }}</strong>
        </div>
      }

      <div class="card">
        <button (click)="increment()">count is {{ count }}</button>
        <button class="btn-send" (click)="sendMessage()">Send Message to Other MFEs</button>
      </div>

      @if (messages.length > 0) {
        <div class="messages">
          <h4>Messages from other MFEs:</h4>
          @for (msg of messages; track msg) {
            <div class="message">{{ msg }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .angular-remote {
        padding: 1.5rem;
        border: 2px solid #dd0031;
        border-radius: 8px;
        font-family: sans-serif;
      }
      h2 {
        color: #dd0031;
        margin-top: 0;
      }
      .auth-info {
        padding: 0.5rem;
        background: #ffebee;
        border-radius: 4px;
        margin-bottom: 1rem;
      }
      .card {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0;
      }
      .card button {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        background: white;
      }
      .btn-send {
        background: #dd0031 !important;
        color: white;
        border-color: #dd0031 !important;
      }
      .messages {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #f5f5f5;
        border-radius: 4px;
      }
      .messages h4 {
        margin: 0 0 0.5rem 0;
      }
      .message {
        padding: 0.25rem 0;
        font-size: 0.9rem;
        border-bottom: 1px solid #eee;
      }
    `,
  ],
})
export class RemoteAppComponent implements OnInit, OnDestroy {
  count = 0;
  messages: string[] = [];
  private subscription: any;

  constructor(@Optional() @Inject(MFE_PROPS) public props: MountProps) {}

  ngOnInit() {
    const eventBus = this.props?.eventBus;
    if (eventBus) {
      this.subscription = eventBus.on("global:message", (payload: { from: string; text: string }) => {
        this.messages = [...this.messages, `[${payload.from}]: ${payload.text}`];
      });
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  increment() {
    this.count++;
  }

  sendMessage() {
    const eventBus = this.props?.eventBus;
    eventBus?.emit("global:message", {
      from: "Angular MFE",
      text: `Hello from Angular! Count is ${this.count}`,
    });
  }
}
