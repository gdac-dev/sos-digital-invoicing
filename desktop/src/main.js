const { app, BrowserWindow, Menu, Tray, ipcMain, shell, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');
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
    mainWindow.loadFile(path.join(__dirname, '../../client/dist/index.html'));
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

function runDatabaseMigrations(serverDir, dbUrl) {
  return new Promise((resolve, reject) => {
    console.log('Running Database Migrations...');
    
    const prismaPath = path.join(serverDir, 'node_modules', 'prisma', 'build', 'index.js');
    if (!fs.existsSync(prismaPath)) {
      console.warn('Prisma CLI not found at', prismaPath, 'Skipping migrations.');
      return resolve(true);
    }

    const pushProc = fork(prismaPath, ['db', 'push'], {
      cwd: serverDir,
      env: { ...process.env, DATABASE_URL: dbUrl, ELECTRON_RUN_AS_NODE: '1' }
    });

    pushProc.on('error', (err) => {
      console.error('Migration process error:', err);
      resolve(false); // resolve instead of reject so app doesn't crash if unhandled
    });

    pushProc.on('close', (code) => {
      if (code === 0) {
        console.log('Migrations successful, running seed...');
        
        const seedPath = path.join(serverDir, 'prisma', 'seed.js');
        if (fs.existsSync(seedPath)) {
          const seedProc = fork(seedPath, [], {
            cwd: serverDir,
            env: { ...process.env, DATABASE_URL: dbUrl, ELECTRON_RUN_AS_NODE: '1' }
          });
          
          seedProc.on('error', (err) => {
            console.error('Seed process error:', err);
            resolve(true); // Still resolve
          });
          
          seedProc.on('close', () => {
            console.log('Seeding completed');
            resolve(true);
          });
        } else {
          resolve(true);
        }
      } else {
        console.error(`Migrations failed with code ${code}`);
        resolve(false);
      }
    });
  });
}

function startBackend() {
  return new Promise(async (resolve, reject) => {
    const dbUrl = store.get('dbUrl');
    if (!dbUrl) {
      return resolve(false); // Backend needs DB config
    }

    const serverDir = IS_DEV 
      ? path.join(__dirname, '../../../server') 
      : path.join(process.resourcesPath, 'server');
      
    try {
      await runDatabaseMigrations(serverDir, dbUrl);
    } catch (e) {
      console.error(e);
      // We still try to start the backend even if migrations fail
    }

    const serverEntry = path.join(serverDir, 'src', 'index.js');
    
    serverProcess = fork(serverEntry, [], {
      cwd: serverDir,
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
        PORT: PORT,
        NODE_ENV: IS_DEV ? 'development' : 'production',
        JWT_SECRET: 'local-desktop-secret-sos-digital',
        CLIENT_URL: `http://localhost:5173,file://`,
        ELECTRON_RUN_AS_NODE: '1'
      },
      stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
      console.error('Backend process error:', err);
    });

    setTimeout(() => resolve(true), 2500);
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
