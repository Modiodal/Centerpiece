// Modules to control application life and create native browser window
const {app, BrowserWindow, session, shell} = require('electron');
const path = require('path');
const server = require('./server.js');
const exec = require('child_process').execFile;
var execePath = "C:\\Program Files\\Chatterino\\chatterino.exe";
const { ipcMain } = require('electron');
require('@treverix/remote/main').initialize();
require('dotenv').config();

process.env.NODE_ENV = 'production';
let mainWindow;

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 983,
        height: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        }
    });

    // Load Chatterino from users C-drive
    ipcMain.once('onTwitchPageLoad', function () {
        exec(execePath);
    });

    // Load express.
    mainWindow.loadURL('http://127.0.0.1:3000/');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();


    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    })
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

// This function removes border from top of app
app.on("browser-window-created", function(e, window) {
    window.setMenu(null);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});
