const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let serverProcess;
const PORT = 8080;
const WEB_PORT = 3001;

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, "server", "index.mjs");
    serverProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        PORT: String(PORT),
        JWT_SECRET: "thb-jwt-secret-2026-production-key-xK9mPz",
        JWT_REFRESH_SECRET: "thb-refresh-secret-2026-production-key-mN7qR",
        NODE_ENV: "production",
      },
      stdio: "pipe",
    });

    serverProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("Server listening")) {
        resolve();
      }
    });

    serverProcess.stderr.on("data", (data) => {
      console.error("Server:", data.toString());
    });

    serverProcess.on("error", reject);
    setTimeout(resolve, 3000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "The Hunger Bite Istanbul",
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: "hiddenInset",
    backgroundColor: "#1A3525",
  });

  mainWindow.loadURL(`http://localhost:${WEB_PORT}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startServer();
  } catch (err) {
    console.error("Failed to start server:", err);
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
