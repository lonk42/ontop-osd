const { app, BrowserWindow } = require('electron');

const createWindow = (screen_dimmensions) => {
  const win = new BrowserWindow({
    width: 80,
    height: 80,
    y: screen_dimmensions.height * 0.9,
    x: screen_dimmensions.width - 80,
    transparent: true,
    frame: false
  });
  win.setAlwaysOnTop(true, 'screen');

  win.loadFile('index.html');
};

app.whenReady().then(() => {

    // Get screen dimmensions for positioning
    const { screen } = require('electron')
    const screen_dimmensions  = screen.getPrimaryDisplay().workAreaSize

    createWindow(screen_dimmensions);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});