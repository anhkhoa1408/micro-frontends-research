import { Component } from "@angular/core";

@Component({
  selector: "app-remote-3",
  standalone: true,
  template: `
    <div class="angular-remote">
      <h2>Angular Remote App (app-remote-3)</h2>
      <p>Count: {{ count }}</p>
      <button (click)="increment()">Increment</button>
    </div>
  `,
  styles: [
    `
      .angular-remote {
        padding: 20px;
        border: 2px solid #dd0031;
        border-radius: 8px;
        font-family: sans-serif;
      }
      h2 {
        color: #dd0031;
      }
      button {
        padding: 8px 16px;
        background: #dd0031;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    `,
  ],
})
export class RemoteAppComponent {
  count = 0;

  increment() {
    this.count++;
  }
}
