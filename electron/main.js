const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

// Keep a global reference to prevent garbage collection
let mainWindow;
let server;

const SERVER_PORT = 3001;

function startExpressServer() {
  return new Promise((resolve, reject) => {
    try {
      // Set environment for Electron mode
      process.env.PORT = String(SERVER_PORT);
      process.env.ELECTRON_MODE = 'true';

      // The Express server is loaded from the existing server/index.js
      // It will start listening on the configured port
      const serverPath = path.join(__dirname, '..', 'server', 'index.js');
      server = require(serverPath);

      // Give the server a moment to bind
      setTimeout(() => {
        console.log(`[Electron] Express server ready on port ${SERVER_PORT}`);
        resolve();
      }, 1500);
    } catch (err) {
      console.error('[Electron] Failed to start Express server:', err);
      reject(err);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 480,
    minHeight: 600,
    title: 'PC Pal',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Friendly appearance for elderly users
    backgroundColor: '#f0f4f8',
    show: false, // Show after ready-to-show to avoid flash
  });

  mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startExpressServer();
    createWindow();
  } catch (err) {
    dialog.showErrorBox(
      'PC Pal - Startup Error',
      `Could not start the PC Pal server.\n\n${err.message}\n\nPlease try restarting the application.`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (server && typeof server.close === 'function') {
    server.close();
  }
});
