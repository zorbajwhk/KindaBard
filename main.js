const { app, BrowserWindow, session, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

const windowStateFile = path.join(app.getPath("userData"), "window-state.json");
let mainWindow;

function createWindow() {
  // Load the previous window state from the file
  const previousState = loadWindowState();

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: previousState.width || 800,
    height: previousState.height || 600,
    x: previousState.x,
    y: previousState.y,
    minWidth: 800, // Set a minimum width to avoid very small window sizes
    minHeight: 600, // Set a minimum height to avoid very small window sizes
    webPreferences: {
      nodeIntegration: true, // Enable Node.js integration in the renderer process.
      partition: "persist:kinda-bard", // Set a custom partition name to persist session data.
    },
  });

  // Load the Google.com website.
  mainWindow.loadURL("https://bard.google.com/");

  // Save the window state when the window is closed
  mainWindow.on("close", () => {
    saveWindowState(mainWindow);
  });

  // Right-click context menu
  mainWindow.webContents.on("context-menu", (e, props) => {
    const { x, y } = props;

    // Create the context menu template
    const contextMenuTemplate = [
      {
        label: "Back",
        enabled: mainWindow.webContents.canGoBack(),
        click: () => mainWindow.webContents.goBack(),
      },
    ];

    // Show the context menu
    const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
    contextMenu.popup({ window: mainWindow, x, y });
  });
}

// Load the previous window state from the file
function loadWindowState() {
  try {
    const data = fs.readFileSync(windowStateFile, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

// Save the window state to the file
function saveWindowState(mainWindow) {
  const windowState = {
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height,
    x: mainWindow.getBounds().x,
    y: mainWindow.getBounds().y,
  };
  fs.writeFileSync(windowStateFile, JSON.stringify(windowState));
}

// Wait for the app to be ready before creating the window.
app.whenReady().then(() => {
  // Enable cookies by modifying the 'Origin' header.
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["Referer"] = "https://bard.google.com/";
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  createWindow();
});

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
