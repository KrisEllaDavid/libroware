const { app, BrowserWindow, Menu, ipcMain, protocol, shell } = require("electron");
const path = require("path");
const fs = require("fs");

// Register privileged scheme BEFORE app.whenReady()
protocol.registerSchemesAsPrivileged([{
  scheme: "libroware",
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}]);

Menu.setApplicationMenu(null);

const MIME = {
  ".html":        "text/html",
  ".js":          "application/javascript",
  ".mjs":         "application/javascript",
  ".cjs":         "application/javascript",
  ".css":         "text/css",
  ".svg":         "image/svg+xml",
  ".png":         "image/png",
  ".jpg":         "image/jpeg",
  ".jpeg":        "image/jpeg",
  ".gif":         "image/gif",
  ".ico":         "image/x-icon",
  ".json":        "application/json",
  ".webmanifest": "application/manifest+json",
  ".woff":        "font/woff",
  ".woff2":       "font/woff2",
  ".ttf":         "font/ttf",
  ".txt":         "text/plain",
  ".wasm":        "application/wasm",
};

// ── Settings (persisted to userData/settings.json) ───────────────────────────
const SETTINGS_PATH = path.join(app.getPath("userData"), "settings.json");

const DEFAULT_SETTINGS = {
  apiUrl: "http://185.217.125.37:3030/api/graphql",
  // To switch to your domain later, change the line above to your domain URL
};

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8")) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

// ── IPC handlers ─────────────────────────────────────────────────────────────
// Synchronous handler — used by preload at startup to read URL before React boots
ipcMain.on("settings:getSync", (event) => {
  event.returnValue = loadSettings();
});

ipcMain.handle("settings:get", () => loadSettings());
ipcMain.handle("settings:save", (_, settings) => {
  saveSettings(settings);
  return true;
});
ipcMain.handle("settings:getApiUrl", () => loadSettings().apiUrl);

// Test connectivity to a given URL
ipcMain.handle("settings:testConnection", async (_, url) => {
  try {
    const { net } = require("electron");
    const request = net.fetch(url, { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    const res = await request;
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── Window ────────────────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:    1280,
    height:   800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
    icon:  path.join(__dirname, "icon.png"),
    title: "Libroware",
    backgroundColor: "#F9FAFB",
    show: false,
  });

  const distPath = path.join(__dirname, "../dist");

  protocol.handle("libroware", (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);

    if (!path.extname(pathname) || pathname === "/") {
      pathname = "/index.html";
    }

    const filePath = path.join(distPath, pathname);

    try {
      const data = fs.readFileSync(filePath);
      const ext  = path.extname(filePath).toLowerCase();
      return new Response(data, { headers: { "Content-Type": MIME[ext] || "application/octet-stream" } });
    } catch {
      try {
        const index = fs.readFileSync(path.join(distPath, "index.html"));
        return new Response(index, { headers: { "Content-Type": "text/html" } });
      } catch {
        return new Response("Not Found", { status: 404 });
      }
    }
  });

  // Context menu: Settings
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Settings",
      click: () => mainWindow?.webContents.send("navigate", "/electron-settings"),
    },
    { type: "separator" },
    {
      label: "Reload",
      click: () => mainWindow?.reload(),
    },
    {
      label: "Open DevTools",
      click: () => mainWindow?.webContents.openDevTools({ mode: "detach" }),
      visible: !app.isPackaged,
    },
    { type: "separator" },
    { label: "Quit Libroware", click: () => app.quit() },
  ]);

  mainWindow.webContents.on("context-menu", () => contextMenu.popup());

  // Open external links in default browser, not inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.loadURL("libroware://localhost/index.html");

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
