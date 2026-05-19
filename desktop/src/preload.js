const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  savePdf: (defaultPath, buffer) => ipcRenderer.invoke('save-pdf', defaultPath, buffer),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onNavigate: (callback) => ipcRenderer.on('navigate', (_event, path) => callback(path))
});
