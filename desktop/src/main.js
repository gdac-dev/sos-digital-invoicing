const { app, BrowserWindow, Menu, Tray, ipcMain, shell, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
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

const IS_DEV = !app.isPackaged;
const PORT = 3001;

// Log file for debugging server issues
const logFile = path.join(app.getPath('userData'), 'server.log');
function logToFile(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  try { fs.appendFileSync(logFile, line); } catch {}
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
  tray = new Tray(path.join(__dirname, '../build/icon.png'));
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

async function startBackend() {
  const serverDir = IS_DEV 
    ? path.join(__dirname, '../../server') 
    : path.join(process.resourcesPath, 'server');

  // SQLite database in user's app data directory (persists across updates)
  const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
  const dbUrl = `file:${dbPath}`;

  logToFile('Server dir: ' + serverDir);
  logToFile('DB path: ' + dbPath);

  // Copy template database on first run
  if (!fs.existsSync(dbPath)) {
    const templatePath = path.join(serverDir, 'prisma', 'template.db');
    logToFile('Template DB path: ' + templatePath);
    if (fs.existsSync(templatePath)) {
      logToFile('Copying template database...');
      fs.copyFileSync(templatePath, dbPath);
      logToFile('Template database copied successfully.');
    } else {
      logToFile('ERROR: Template database not found at: ' + templatePath);
    }
  } else {
    logToFile('Database already exists at: ' + dbPath);
  }

  // Set ALL environment variables BEFORE importing the server module
  // (dotenv.config() won't override env vars that already exist)
  process.env.DATABASE_URL = dbUrl;
  process.env.PORT = String(PORT);
  process.env.NODE_ENV = IS_DEV ? 'development' : 'production';
  process.env.JWT_SECRET = 'local-desktop-secret-sos-digital-2024';
  process.env.JWT_EXPIRES_IN = '30d';
  process.env.CLIENT_URL = '*';
  process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sosdigital.cm';
  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@SOS2024';
  process.env.ADMIN_NAME = process.env.ADMIN_NAME || 'Administrateur SOS';

  try {
    // Import the ESM server module directly into this process
    const serverEntry = pathToFileURL(path.join(serverDir, 'src', 'index.js')).href;
    logToFile('Importing server module: ' + serverEntry);
    await import(serverEntry);
    logToFile('Backend server started successfully in-process!');
    return true;
  } catch (err) {
    logToFile('FATAL: Failed to start backend: ' + err.message);
    logToFile(err.stack);
    console.error('Failed to start backend:', err);
    return false;
  }
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
  
  logToFile('=== SOS DIGITAL starting ===');
  logToFile('Is dev: ' + IS_DEV);
  logToFile('userData: ' + app.getPath('userData'));
  
  // Start the backend server in-process
  const backendStarted = await startBackend();
  logToFile('Backend started: ' + backendStarted);
  
  createWindow();
  try { setupTray(); } catch(e){ logToFile('Tray setup error: ' + e.message); }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// === IPC Handlers ===

ipcMain.handle('get-config', (e, key) => store.get(key));

ipcMain.handle('set-config', async (e, key, value) => {
  store.set(key, value);
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
  if (url.includes('wa.me')) {
    const phone = url.split('wa.me/')[1];
    shell.openExternal(`whatsapp://send?phone=${phone}`);
  } else {
    shell.openExternal(url);
  }
});
