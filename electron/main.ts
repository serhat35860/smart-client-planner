import { app, BrowserWindow, Menu, dialog, shell } from "electron";
import log from "electron-log/main";
import { autoUpdater } from "electron-updater";
import path from "node:path";
import { fork, ChildProcess } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import { setTimeout as wait } from "node:timers/promises";

const isDev = !app.isPackaged;
if (!isDev) {
  process.env.DESKTOP_APP = "1";
}
const serverPort = Number(process.env.DESKTOP_PORT ?? "4120");
const devNextPort = Number(process.env.DEV_NEXT_PORT ?? "3022");
const serverUrl = process.env.DESKTOP_SERVER_URL ?? `http://127.0.0.1:${serverPort}`;
const serverBootTimeoutMs = 30_000;
let nextServerProcess: ChildProcess | null = null;
let mainWindowRef: BrowserWindow | null = null;

log.initialize();
log.transports.file.level = "info";

function getPreloadPath() {
  return isDev
    ? path.join(process.cwd(), "dist-electron", "preload.js")
    : path.join(process.resourcesPath, "app.asar", "dist-electron", "preload.js");
}

function getStandaloneServerPath() {
  return isDev
    ? path.join(process.cwd(), ".next", "standalone", "server.js")
    : path.join(process.resourcesPath, "app.asar.unpacked", ".next", "standalone", "server.js");
}

function getTemplateDbPath() {
  return isDev ? path.join(process.cwd(), "desktop-template.db") : path.join(process.resourcesPath, "app.asar", "desktop-template.db");
}

function configureDesktopDatabase() {
  const dbPath = path.join(app.getPath("userData"), "desktop.db");
  if (!fs.existsSync(dbPath)) {
    const templateDbPath = getTemplateDbPath();
    if (fs.existsSync(templateDbPath)) {
      fs.copyFileSync(templateDbPath, dbPath);
      log.info("Created runtime desktop database from template:", dbPath);
    } else {
      log.warn("Desktop template database not found, Prisma may fail until DB is initialized.");
    }
  }
  process.env.DATABASE_URL = `file:${dbPath.replaceAll("\\", "/")}`;
}

async function waitForServerReady(timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(serverUrl, { method: "GET" });
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still booting.
    }
    await wait(300);
  }
  throw new Error(`Server startup timed out after ${timeoutMs}ms`);
}

async function isServerReady(timeoutMs: number) {
  try {
    await waitForServerReady(timeoutMs);
    return true;
  } catch {
    return false;
  }
}

function isPortInUse(port: number, host: string) {
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({ port, host });
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => {
      resolve(false);
    });
  });
}

async function startNextServerIfNeeded() {
  if (isDev) {
    return;
  }
  if (await isServerReady(1_000)) {
    log.info(`Server already reachable at ${serverUrl}, reusing running instance.`);
    return;
  }
  if (await isPortInUse(serverPort, "127.0.0.1")) {
    log.info(`Server port ${serverPort} is already in use, reusing existing server.`);
    await waitForServerReady(serverBootTimeoutMs);
    return;
  }
  const serverEntrypoint = getStandaloneServerPath();
  log.info("Starting local Next server:", serverEntrypoint);
  nextServerProcess = fork(serverEntrypoint, [], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      DESKTOP_APP: "1",
      HOSTNAME: "127.0.0.1",
      PORT: String(serverPort)
    },
    stdio: "pipe"
  });
  nextServerProcess.stdout?.on("data", (chunk) => log.info(`[next] ${String(chunk).trim()}`));
  nextServerProcess.stderr?.on("data", (chunk) => log.error(`[next] ${String(chunk).trim()}`));
  nextServerProcess.on("exit", (code, signal) => {
    log.error(`Next server exited code=${code ?? "null"} signal=${signal ?? "null"}`);
  });
  try {
    await waitForServerReady(serverBootTimeoutMs);
  } catch (error) {
    // Handle startup race: another app instance may have started the server first.
    if (await isServerReady(2_000)) {
      log.info("Server became reachable after startup race; continuing.");
      return;
    }
    throw error;
  }
}

function stopNextServer() {
  if (!nextServerProcess) {
    return;
  }
  nextServerProcess.kill();
  nextServerProcess = null;
}

function setupErrorHandling() {
  process.on("uncaughtException", (error) => {
    log.error("Uncaught exception:", error);
    dialog.showErrorBox("Unexpected Error", error.message);
  });
  process.on("unhandledRejection", (reason) => {
    log.error("Unhandled rejection:", reason);
  });
}

function setupAppMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "Support",
      submenu: [
        {
          label: "Open Log Folder",
          click: () => {
            const logPath = log.transports.file.getFile().path;
            void shell.openPath(path.dirname(logPath));
          }
        },
        { role: "reload" },
        { role: "toggleDevTools" },
        { role: "quit" }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

function setupAutoUpdate() {
  if (isDev) {
    return;
  }
  /** Güncelleme: `build.publish` doluysa build `app-update.yml` gömer. Publish boşsa yalnızca DESKTOP_UPDATE_OWNER / DESKTOP_UPDATE_REPO ile setFeedURL kullanılır; ikisi de yoksa güncelleme kontrolü sessizce hata loglar. */
  const overrideOwner = process.env.DESKTOP_UPDATE_OWNER;
  const overrideRepo = process.env.DESKTOP_UPDATE_REPO;
  if (overrideOwner && overrideRepo) {
    autoUpdater.setFeedURL({
      provider: "github",
      owner: overrideOwner,
      repo: overrideRepo
    });
  }
  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.on("update-available", (info) => {
    log.info(`Update available: ${info.version}`);
  });
  autoUpdater.on("update-downloaded", async () => {
    const result = await dialog.showMessageBox({
      type: "info",
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      message: "A new version is ready.",
      detail: "Restart the app to apply the update."
    });
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
  autoUpdater.on("error", (error) => {
    log.error("Auto-update error:", error);
  });
  void autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    log.error("Auto-update check failed:", error);
  });
}

async function createWindow() {
  await startNextServerIfNeeded();
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    center: true,
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const startUrl = isDev ? `http://127.0.0.1:${devNextPort}` : serverUrl;
  mainWindow.webContents.on("did-fail-load", (_event, code, description, url) => {
    log.error(`Window failed to load url=${url} code=${code} description=${description}`);
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    log.error(`Renderer process gone reason=${details.reason} exitCode=${details.exitCode}`);
  });
  await mainWindow.loadURL(startUrl);
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });
  // Fallback: force show in case ready-to-show is delayed.
  setTimeout(() => {
    if (!mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
      log.info("Fallback show executed for main window.");
    }
  }, 2500);
  mainWindowRef = mainWindow;
  mainWindow.on("closed", () => {
    mainWindowRef = null;
  });
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

app.on("second-instance", () => {
  if (mainWindowRef) {
    if (mainWindowRef.isMinimized()) {
      mainWindowRef.restore();
    }
    mainWindowRef.focus();
  }
});

app.whenReady().then(async () => {
  configureDesktopDatabase();
  setupErrorHandling();
  setupAppMenu();
  setupAutoUpdate();
  await createWindow();
});

app.on("window-all-closed", () => {
  stopNextServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopNextServer();
});
