const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('pcpal', {
  isDesktopApp: true,
  platform: process.platform,
});
