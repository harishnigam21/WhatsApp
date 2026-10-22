import { renderAsync } from "docx-preview";

export const openDocxBlobInNewTab = async (blob: Blob) => {
  const newTab = window.open();
  if (!newTab) return;

  newTab.document.write(`
    <html>
      <head><title>Document Preview</title></head>
      <body>
        <div id="container"></div>
      </body>
    </html>
  `);
  newTab.document.close();

  const container = newTab.document.getElementById("container");
  if (container) {
    // Safely renders the binary array data directly into the DOM windows
    await renderAsync(blob, container);
  }
};
