// Replace [EventSource] with window.postMessage,
// so that it can be used in vscode webview.

let vscode = acquireVsCodeApi();
let current;
window.addEventListener("message", event => {
  current && current.onmessage(event);
  // Remember last render argument.
  if (typeof event.data === "string") {
    vscode.setState({ data: event.data });
  }
});
export class EventSource {
  // Ignore params.
  constructor() {
    current = this;
    // Skip connected event.
    setTimeout(() => {
      this.onmessage({ data: "0" });
      // Restore previous state.
      let prev = vscode.getState();
      prev && this.onmessage(prev);
    });
  }
  onmessage() {}
  onerror() {}
  _postMessage(msg) {
    vscode.postMessage(msg);
  }
}
