const { app, BrowserWindow, ipcMain } = require('electron');
const os = require ('os');

app.whenReady().then(() => {

  // Get screen dimmensions for positioning
  const { screen } = require('electron')
  const screen_dimmensions  = screen.getPrimaryDisplay().workAreaSize

  // Require argument on which html to use
  config_file_path = app.commandLine.hasSwitch("config") && app.commandLine.getSwitchValue("config") != "" ? app.commandLine.getSwitchValue("config") : false
  if (! config_file_path) {
    console.log("Usage: " + app.getName() + ' --config=""');
    process.exit(-1);
    //config_file_path = "config.json"
  }

  // Read the config file
  const nodeFs = require('fs');
  const app_config = JSON.parse(nodeFs.readFileSync(config_file_path, 'utf-8'));

  // Handle IPC "InvokeAction" which comes from the BrowserView javascript
  ipcMain.on('invokeAction', function(event, data) {

    // Check to see if the data is a valid key
    if (! (data.id in app_config.functions)) {
      console.log("WARNING: Undefined IPC invocation for '" + data + '"');
      return false;
    }
    current_function = app_config.functions[data.id];

    // Performance the action as defined by the function
    switch (current_function.method) {

      // write_file method... writes a file :)
      case 'write_file':
        
        const fs = require('fs');
        try {
          fs.writeFileSync(app_config.write_file.path + '/' + current_function.filename, data.data, 'utf-8');
        } catch(e) {
          alert(e);
        }

        break;

    }

  });

  // Spawn the app
  createWindow(screen_dimmensions, app_config);

  app.on('activate', () => {if (BrowserWindow.getAllWindows().length === 0) {createWindow();}});

});

app.on('window-all-closed', () => {if (process.platform !== 'darwin') {app.quit();}});

const createWindow = (screen_dimmensions, app_config) => {

  // Base window dimmensions, some of these will be overriden from config
  browser_window_properties = {
    width: 500,
    height: 500,
    y: 0,
    x: 0,
    resizable: false,
    focusable: false,
    transparent: true,
    frame: false,
    kiosk: true,
    webPreferences: {
      nodeIntegration: true,
      devTools: false,
      plugins: false,
      contextIsolation: false
    }
  }

  // Adjust any values if specified
  if (! app_config.position) {
    console.log("WARNING: 'position' missing in config, using defaults..");

  // Calculate dimmensions
  } else {

    // X axis
    if (app_config.position.x) {
      x_offset = 0;

      // Relative reference off the screen width
      if (app_config.position.x.relative) {
        x_offset = screen_dimmensions.width;
      }

      // Positioning can either be a % of the offset or an absolute from it
      if (app_config.position.x.percent) {
        // We will subtract the width of the window to have it relative to the left
        browser_window_properties.x = (parseInt(x_offset) * (parseFloat(app_config.position.x.percent) / 100)) - parseFloat(app_config.width);
      } else if (app_config.position.x.offset) {
        browser_window_properties.x = parseInt(x_offset) + parseInt(app_config.position.x.offset);
      }

    }

    // Y axis
    if (app_config.position.y) {
      y_offset = 0;

      // Relative reference off the screen height
      if (app_config.position.y.relative) {
        y_offset = screen_dimmensions.height;
      }

      // Positioning can either be a % of the offset or an absolute from it
      if (app_config.position.y.percent) {
        browser_window_properties.y = parseInt(y_offset) * (parseFloat(app_config.position.y.percent) / 100);
      } else if (app_config.position.y.offset) {
        browser_window_properties.y = parseInt(y_offset) + parseInt(app_config.position.y.offset);
      }

    }

  }

  // Set the size
  browser_window_properties.width = app_config.width ? app_config.width : browser_window_properties.width
  browser_window_properties.height = app_config.height ? app_config.height : browser_window_properties.height

  // Create the window
  const win = new BrowserWindow(browser_window_properties);
  win.setAlwaysOnTop(true, 'screen');

  // Load the defined URL
  win.loadFile(app_config.osd_html);
  win.setBackgroundColor('#00ffffff');

  win.webContents.once('did-finish-load', () => {

    // Run any startup functions as described in the config
    startup_function_loop: for (startup_function in app_config.startup_functions) {
      current_function = app_config.startup_functions[startup_function];

      // Check against the functions condition, this will exit the function if failed
      switch (current_function.condition) {

        // check_current_user method compares against current running user
        case 'check_current_user':
          if (os.userInfo().username != current_function.user) {
            continue startup_function_loop;
          }
          break;

        default:
          continue startup_function_loop;

      }

      // We must have passed the check, run the functions action
      switch (current_function.action) {

        // sendIPC action triggers an IPC call to main window
        case 'sendIPC':
          win.webContents.send(current_function.ipc_data.event, current_function.ipc_data.data);
          break;

      }
    
    }

  });

};