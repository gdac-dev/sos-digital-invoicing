const { app, BrowserWindow, Menu, Tray, ipcMain, shell, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
let store;

async function initStore() {
  const StoreModule = await import('electron-store');
  const Store = StoreModule.default || StoreModule;
  store = new Store({
    encryptionKey: 'sos-digital-secure-key',
    defaults: {
      language: 'fr',
      theme: 'light'
    }
  });
}

let mainWindow;
let tray;
let serverProcess;

const IS_DEV = !app.isPackaged;
const PORT = 3001;

// Guaranteed writable log path (use OS temp directory which always exists)
function getLogPath() {
  const tmpDir = require('os').tmpdir();
  return path.join(tmpDir, 'sos-digital-server.log');
}

function logToFile(msg) {
  try {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(getLogPath(), line);
  } catch {}
}

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
    logToFile('Loading client from: ' + clientPath);
    mainWindow.loadFile(clientPath);
  }

  setupMenu();
}

function setupMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        { type: 'separator' },
        { role: 'quit', label: 'Quitter' }
      ]
    },
    { label: 'Factures', click: () => mainWindow.webContents.send('navigate', '/invoices') },
    { label: 'Devis', click: () => mainWindow.webContents.send('navigate', '/quotes') },
    { label: 'Paiements', click: () => mainWindow.webContents.send('navigate', '/payments') },
    { label: 'Clients', click: () => mainWindow.webContents.send('navigate', '/clients') },
    { label: 'Rapports', click: () => mainWindow.webContents.send('navigate', '/reports') },
    { label: 'Tableau de bord', click: () => mainWindow.webContents.send('navigate', '/') },
    {
      label: 'Aide',
      submenu: [
        { label: 'Documentation', click: () => shell.openExternal('https://sosdigital.cm/support') },
        { label: 'Voir les logs', click: () => shell.openPath(getLogPath()) },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function setupTray() {
  tray = new Tray(path.join(__dirname, '../build/icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Ouvrir', click: () => mainWindow.show() },
    { label: 'Nouvelle Facture', click: () => { mainWindow.show(); mainWindow.webContents.send('navigate', '/invoices/new'); }},
    { label: 'Nouveau Devis', click: () => { mainWindow.show(); mainWindow.webContents.send('navigate', '/quotes/new'); }},
    { type: 'separator' },
    { label: 'Quitter', click: () => app.quit() }
  ]);
  tray.setToolTip('SOS DIGITAL Invoicing');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());
}

function startBackend() {
  return new Promise((resolve) => {
    const serverDir = IS_DEV
      ? path.join(__dirname, '../../server')
      : path.join(process.resourcesPath, 'server');

    // Build a proper SQLite URL with forward slashes for Windows compatibility
    const userDataDir = app.getPath('userData');
    const dbPath = path.join(userDataDir, 'database.sqlite');
    // Prisma SQLite needs forward slashes on Windows
    const dbUrl = 'file:' + dbPath.replace(/\\/g, '/');

    logToFile('=== STARTING BACKEND ===');
    logToFile('IS_DEV: ' + IS_DEV);
    logToFile('serverDir: ' + serverDir);
    logToFile('dbPath: ' + dbPath);
    logToFile('dbUrl: ' + dbUrl);
    logToFile('execPath: ' + process.execPath);

    // Copy template database on first run
    if (!fs.existsSync(dbPath)) {
      const templatePath = path.join(serverDir, 'prisma', 'template.db');
      logToFile('Template path: ' + templatePath);
      logToFile('Template exists: ' + fs.existsSync(templatePath));
      if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, dbPath);
        logToFile('Template DB copied successfully');
      } else {
        logToFile('ERROR: template.db not found!');
      }
    }

    // Use start.cjs (CommonJS bootstrap) to load the ESM server
    const serverEntry = path.join(serverDir, 'src', 'start.cjs');
    logToFile('Server entry: ' + serverEntry);
    logToFile('Entry exists: ' + fs.existsSync(serverEntry));

    const serverEnv = {
      ...process.env,
      DATABASE_URL: dbUrl,
      PORT: String(PORT),
      NODE_ENV: IS_DEV ? 'development' : 'production',
      JWT_SECRET: 'local-desktop-secret-sos-digital-2024',
      JWT_EXPIRES_IN: '30d',
      CLIENT_URL: '*',
      ADMIN_EMAIL: 'admin@sosdigital.cm',
      ADMIN_PASSWORD: 'Admin@SOS2024',
      ADMIN_NAME: 'Administrateur SOS',
      ELECTRON_RUN_AS_NODE: '1'
    };

    serverProcess = spawn(process.execPath, [serverEntry], {
      cwd: serverDir,
      env: serverEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    let serverOutput = '';

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      logToFile('[SERVER OUT] ' + msg);
      serverOutput += msg + '\n';
    });

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      logToFile('[SERVER ERR] ' + msg);
      serverOutput += 'ERR: ' + msg + '\n';
    });

    serverProcess.on('error', (err) => {
      logToFile('[SPAWN ERROR] ' + err.message);
      resolve(false);
    });

    serverProcess.on('exit', (code) => {
      logToFile('[SERVER EXIT] code=' + code);
      if (code !== null && code !== 0) {
        // Server crashed - show a dialog so the user can report the issue
        dialog.showMessageBox({
          type: 'error',
          title: 'Erreur serveur SOS DIGITAL',
          message: 'Le serveur interne a échoué au démarrage.',
          detail: 'Log: ' + getLogPath() + '\n\n' + serverOutput.slice(-500),
          buttons: ['OK']
        }).catch(() => {});
      }
    });

    // Poll the health endpoint to check if server is ready
    let attempts = 0;
    const maxAttempts = 30; // 15 seconds max wait
    const checkReady = () => {
      attempts++;
      logToFile('Health check attempt ' + attempts);
      const http = require('http');
      const req = http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          logToFile('Server is READY!');
          resolve(true);
        } else if (attempts < maxAttempts) {
          setTimeout(checkReady, 500);
        } else {
          logToFile('Health check: max attempts reached (non-200)');
          resolve(false);
        }
      });
      req.on('error', (err) => {
        logToFile('Health check error: ' + err.message);
        if (attempts < maxAttempts) {
          setTimeout(checkReady, 500);
        } else {
          logToFile('Health check: max attempts reached (connect error)');
          resolve(false);
        }
      });
      req.setTimeout(2000);
    };
    setTimeout(checkReady, 2000);
  });
}

// Single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  await initStore();

  logToFile('=== SOS DIGITAL APP STARTING ===');
  logToFile('App version: ' + app.getVersion());
  logToFile('Electron: ' + process.versions.electron);
  logToFile('Node: ' + process.versions.node);
  logToFile('userData: ' + app.getPath('userData'));
  logToFile('Log file: ' + getLogPath());

  const backendStarted = await startBackend();
  logToFile('Backend started: ' + backendStarted);

  createWindow();
  try { setupTray(); } catch (e) { logToFile('Tray error: ' + e.message); }

  if (!backendStarted) {
    logToFile('Backend failed - showing error dialog');
    dialog.showMessageBox({
      type: 'warning',
      title: 'SOS DIGITAL',
      message: 'Le serveur interne n\'a pas pu démarrer.',
      detail: 'Consultez le fichier de log:\n' + getLogPath(),
      buttons: ['OK']
    }).catch(() => {});
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (serverProcess) {
    logToFile('Killing server process');
    serverProcess.kill();
  }
});

// === IPC Handlers ===
ipcMain.handle('get-config', (e, key) => store.get(key));
ipcMain.handle('set-config', async (e, key, value) => { store.set(key, value); return true; });
ipcMain.handle('show-notification', (e, title, body) => { new Notification({ title, body }).show(); });

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
  if (url.includes('wa.me')) {
    const phone = url.split('wa.me/')[1];
    shell.openExternal(`whatsapp://send?phone=${phone}`);
  } else {
    shell.openExternal(url);
  }
});
