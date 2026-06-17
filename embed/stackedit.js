/*!
 * stackedit.js — minimal loader for a self-hosted StackEdit editor.
 *
 * This is the host-page SDK (the tiny counterpart to the editor app built from
 * this repo). It opens the editor in an iframe and receives its content via
 * postMessage. Drop this file on any page, then:
 *
 *   const se = new StackEdit({ editorOrigin: 'https://your-editor-host.com' });
 *   se.openFile({ name: 'doc.md', content: '# Hello' }, (payload) => {
 *     console.log(payload.content.text); // Markdown
 *     console.log(payload.content.html); // rendered HTML
 *   });
 *
 * `editorOrigin` MUST point at where you deployed the editor (its index.html).
 * For local testing use the running dev server: 'http://localhost:8080'.
 */
(function (global) {
  const defaults = {
    editorOrigin: 'https://stackedit.io', // <-- change to YOUR deployed editor
  };

  function StackEdit(options) {
    this.config = Object.assign({}, defaults, options);
  }

  StackEdit.prototype.openFile = function openFile(file, onContent) {
    const { editorOrigin } = this.config;

    // Build the iframe and seed it via URL hash params.
    //   origin        = host page origin (REQUIRED — the editor postMessages back to it)
    //   fileName      = initial file name (optional)
    //   contentText   = initial Markdown content (optional)
    const params = new URLSearchParams();
    params.set('origin', global.location.origin);
    if (file && file.name) params.set('fileName', file.name);
    if (file && file.content) params.set('contentText', file.content);

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'border:0;position:fixed;inset:0;width:100%;height:100%;z-index:9999';
    iframe.src = `${editorOrigin}/#${params.toString()}`;

    // Listen for messages from the editor iframe.
    function onMessage(event) {
      // SECURITY: only trust messages from our editor origin.
      if (event.origin !== new URL(editorOrigin).origin) return;

      const msg = event.data;
      switch (msg && msg.type) {
        case 'ready':
          if (typeof this.onReady === 'function') this.onReady();
          break;
        case 'fileChange':
          if (typeof onContent === 'function') onContent(msg.payload);
          break;
        case 'close':
          global.removeEventListener('message', onMessage);
          iframe.remove();
          if (typeof this.onClose === 'function') this.onClose();
          break;
        default:
          break;
      }
    }
    global.addEventListener('message', onMessage);

    document.body.appendChild(iframe);
    return iframe;
  };

  global.StackEdit = StackEdit;
}(typeof window !== 'undefined' ? window : this));
