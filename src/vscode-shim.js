// Replace [EventSource] with window.postMessage,
// so that it can be used in vscode webview.

// Example usage in extension.ts:
//
// import html from "@hyrious/marked-cli/index.vscode.html"
//
// let panels = new Set()
//
// function createPanel(doc) {
//   let panel = vscode.window.createWebviewPanel(
//     'panel_id',
//     'Preview Markdown', // title
//     vscode.ViewColumn.Beside,
//     { enableScripts: true }
//   )
//
//   function update() {
//     panel.webview.postMessage(doc.getText()) // <--
//   }
//
//   function close() {
//     panel.dispose()
//     panels.delete(this_)
//   }
//
//   let this_ = { doc, panel, update, close }
//   panel.webview.html = html
//   panels.add(this_)
//   this_.update()
//   return this_
// }
//
// vscode.commands.registerCommand('vscode-marked.render', () => {
//   let doc = vscode.window.activeTextEditor?.document
//   if (!doc) return
//   let p = panels.find(p => p.doc === doc)
//   if (p) return p.panel.reveal()
//   createPanel(doc)
// })
//
// vscode.workspace.onDidSaveTextDocument(doc => {
//   panels.forEach(panel => panel.doc === doc && panel.update())
// })
//
// vscode.workspace.onDidCloseTextDocument(doc => {
//   panels.forEach(p => p.doc === doc && p.close())
// })

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
}
