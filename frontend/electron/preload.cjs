const { contextBridge, ipcRenderer } = require("electron");

// Load settings synchronously at preload time so getApiUrl() is immediately
// available when apollo-client.ts initialises (before React even renders).
const _settings = ipcRenderer.sendSync("settings:getSync");

contextBridge.exposeInMainWorld("electronAPI", {
  // Synchronous — safe to call during Apollo Client init
  getApiUrl: () => _settings.apiUrl,

  // Async helpers used by the ElectronSettings page
  getSettings:    ()           => ipcRenderer.invoke("settings:get"),
  saveSettings:   (s)          => ipcRenderer.invoke("settings:save", s),
  testConnection: (url)        => ipcRenderer.invoke("settings:testConnection", url),

  // Main process can push a navigation event (e.g. open Settings from context menu)
  onNavigate: (callback) => {
    ipcRenderer.on("navigate", (_, route) => callback(route));
    return () => ipcRenderer.removeAllListeners("navigate");
  },

  isElectron: true,
});
