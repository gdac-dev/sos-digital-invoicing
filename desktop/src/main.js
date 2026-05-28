const { app, BrowserWindow, Menu, Tray, ipcMain, shell, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
let store;

async function initStore() {
  const StoreModule = await import('electron-store');
  const Store = StoreModule.default || StoreModule;
  store = new Store({
    encryptionKey: 'sos-digital-secure-key',
    defaults: {
      dbUrl: '',
      language: 'fr',
      theme: 'light'
    }
  });
}

let mainWindow;
let settingsWindow;
let tray;
let serverProcess;

const IS_DEV = !app.isPackaged;
const PORT = 3001;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (IS_DEV) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const clientPath = path.join(process.resourcesPath, 'client', 'dist', 'index.html');
    console.log('Loading client from:', clientPath);
    mainWindow.loadFile(clientPath);
  }

  setupMenu();
}

function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    title: 'Paramètres - SOS DIGITAL',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'settings', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function setupMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        { label: 'Paramètres...', click: openSettings },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter' }
      ]
    },
    {
      label: 'Factures',
      click: () => mainWindow.webContents.send('navigate', '/invoices')
    },
    {
      label: 'Paiements',
      click: () => mainWindow.webContents.send('navigate', '/payments')
    },
    {
      label: 'Clients',
      click: () => mainWindow.webContents.send('navigate', '/clients')
    },
    {
      label: 'Rapports',
      click: () => mainWindow.webContents.send('navigate', '/reports')
    },
    {
      label: 'Tableau de bord',
      click: () => mainWindow.webContents.send('navigate', '/')
    },
    {
      label: 'Aide',
      submenu: [
        { label: 'Documentation', click: () => shell.openExternal('https://sosdigital.cm/support') },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupTray() {
  tray = new Tray(path.join(__dirname, '../build/icon.png')); // We will provide an icon later
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Ouvrir', click: () => mainWindow.show() },
    { label: 'Nouvelle Facture', click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate', '/invoices/new');
    }},
    { type: 'separator' },
    { label: 'Quitter', click: () => app.quit() }
  ]);
  tray.setToolTip('SOS DIGITAL Invoicing');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => mainWindow.show());
}

const { spawn } = require('child_process');

function startBackend() {
  return new Promise((resolve, reject) => {
    const dbUrl = store.get('dbUrl');
    if (!dbUrl) {
      return resolve(false); // Backend needs DB config
    }

    const serverDir = IS_DEV 
      ? path.join(__dirname, '../../server') 
      : path.join(process.resourcesPath, 'server');

    const serverEntry = path.join(serverDir, 'src', 'index.js');
    
    console.log('Starting backend server...');
    console.log('  Server dir:', serverDir);
    console.log('  Entry:', serverEntry);
    console.log('  execPath:', process.execPath);
    
    const serverEnv = {
      ...process.env,
      DATABASE_URL: dbUrl,
      PORT: String(PORT),
      NODE_ENV: IS_DEV ? 'development' : 'production',
      JWT_SECRET: 'local-desktop-secret-sos-digital',
      CLIENT_URL: `http://localhost:5173,file://`,
      ELECTRON_RUN_AS_NODE: '1'
    };

    serverProcess = spawn(process.execPath, [serverEntry], {
      cwd: serverDir,
      env: serverEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    serverProcess.stdout.on('data', (data) => {
      console.log('[SERVER]', data.toString().trim());
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('[SERVER ERR]', data.toString().trim());
    });

    serverProcess.on('error', (err) => {
      console.error('Backend process spawn error:', err);
    });

    serverProcess.on('exit', (code) => {
      console.log('Backend process exited with code:', code);
    });

    // Wait for server to be ready by polling the health endpoint
    let attempts = 0;
    const maxAttempts = 20;
    const checkReady = () => {
      attempts++;
      const http = require('http');
      const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('Backend server is ready!');
          resolve(true);
        } else if (attempts < maxAttempts) {
          setTimeout(checkReady, 500);
        } else {
          console.warn('Backend did not respond OK, proceeding anyway');
          resolve(true);
        }
      });
      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(checkReady, 500);
        } else {
          console.warn('Backend health check timed out, proceeding anyway');
          resolve(true);
        }
      });
      req.setTimeout(1000);
    };
    setTimeout(checkReady, 1500);
  });
}

// Deep links (whatsapp:// is handled externally, but we can register sosdigital://)
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  await initStore();
  
  // Try to start backend first
  const backendStarted = await startBackend();
  
  createWindow();
  // Don't crash if no icon exists yet, ignore errors on tray setup if missing image
  try { setupTray(); } catch(e){}

  if (!backendStarted) {
    // If backend couldn't start (no DB config), force open settings
    openSettings();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// === IPC Handlers ===

ipcMain.handle('get-config', (e, key) => store.get(key));

ipcMain.handle('set-config', async (e, key, value) => {
  store.set(key, value);
  if (key === 'dbUrl') {
    // Restart backend when DB URL changes
    if (serverProcess) serverProcess.kill();
    const started = await startBackend();
    if (started && mainWindow) {
      mainWindow.reload(); // Reload UI to reconnect
    }
    return started;
  }
  return true;
});

ipcMain.handle('show-notification', (e, title, body) => {
  new Notification({ title, body }).show();
});

ipcMain.handle('save-pdf', async (e, defaultPath, buffer) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (!canceled && filePath) {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return filePath;
  }
  return null;
});

ipcMain.handle('open-external', (e, url) => {
  // If it's WhatsApp, force whatsapp:// if specified, but usually it comes as https://wa.me/...
  if (url.includes('wa.me')) {
    const phone = url.split('wa.me/')[1];
    shell.openExternal(`whatsapp://send?phone=${phone}`);
  } else {
    shell.openExternal(url);
  }
});
