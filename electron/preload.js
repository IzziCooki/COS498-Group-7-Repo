const { contextBridge } = require('electron');

// Expose minimal, safe APIs to the renderer process
contextBridge.exposeInMainWorld('pcpal', {
  isDesktopApp: true,
  platform: process.platform,
});
