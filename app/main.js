const { app, BrowserWindow, ipcMain, screen } = require('electron');
const os = require ('os');

app.whenReady().then(() => {

  // Get screen dimmensions for positioning
  screen_dimensions = screen.getPrimaryDisplay().workAreaSize;

  // Require argument on which html to use
  config_file_path = app.commandLine.hasSwitch("config") && app.commandLine.getSwitchValue("config") != "" ? app.commandLine.getSwitchValue("config") : false;
  if (! config_file_path) {
    console.log("Usage: " + app.getName() + ' --config=""');
    process.exit(-1);
    //config_file_path = "../examples/example.config.json"
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

      // Quit closes the electron application itself
      case 'quit':
        process.exit(-1)

    }

  });

  // Spawn the app
  createWindow(screen_dimensions, app_config);

  app.on('activate', () => {if (BrowserWindow.getAllWindows().length === 0) {createWindow();}});

});

app.on('window-all-closed', () => {if (process.platform !== 'darwin') {app.quit();}});

const createWindow = (screen_dimensions, app_config) => {

  // Base window dimensions, some of these will be overriden from config
  let browser_window_property_defaults = {
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

  // Set the window dimensions and position if defined
  let browser_window_properties = browser_window_property_defaults;
  if (! app_config.dimensions) {
    console.log("WARNING: 'position' missing in config, assuming defaults..");
  } else {
    browser_window_properties = {...browser_window_property_defaults, ...TranslateScreenDimensions(app_config.dimensions)}
  }

  // Create the window
  const win = new BrowserWindow(browser_window_properties);
  win.setAlwaysOnTop(true, 'screen');

  // Load the defined URL
  win.loadFile(app_config.osd_html);
  win.setBackgroundColor('#00ffffff');
  
  // Handle IPC "changeRegion" to adjust the window size
  // We need to do this to avoid "unclickable" invisible space on the screen
  ipcMain.on('changeRegion', function(event, data) {
    win.setBounds(TranslateScreenDimensions(data.data));
  });

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

const TranslateScreenDimensions = (dimensions) => {
  screen_dimensions  = screen.getPrimaryDisplay().workArea;
  var new_dimensions = {};

  // Some values have extra logic, resolve those and map anything else directly to a new object
  for (const dimension in dimensions) {
    switch (dimension) {

      // X axis
      case 'x':

        // We always want to reference from the primary displays location
        x_offset = screen_dimensions.x;

        // If defined also reference relative to the screen width
        if (dimensions.x.relative) {
          x_offset += screen_dimensions.width;
        }

        // Positioning can either be a % of the offset or an absolute from it
        if (dimensions.x.percent) {
          new_dimensions.x = parseInt(x_offset) * (parseFloat(dimensions.x.percent) / 100);
        } else if (dimensions.x.offset) {
          new_dimensions.x = parseInt(x_offset) + parseInt(dimensions.x.offset);
        } else {
          new_dimensions.x = dimensions.x;
        }

        break;

      // Y axis
      case 'y':

        // We always want to reference from the primary displays location
        y_offset = screen_dimensions.y;

        // If defined also reference relative to the screen height
        if (dimensions.y.relative) {
          y_offset = screen_dimensions.height;
        }

        // Positioning can either be a % of the offset or an absolute from it
        if (dimensions.y.percent) {
          new_dimensions.y = parseInt(y_offset) * (parseFloat(dimensions.y.percent) / 100);
        } else if (dimensions.x.offset) {
          new_dimensions.y = parseInt(y_offset) + parseInt(dimensions.y.offset);
        } else {
          new_dimensions.y = dimensions.y;
        }

        break;


      default:
        // We don't have custom rules for anything else so just set them arbitrarily
        new_dimensions[dimension] = dimensions[dimension];
        break;

    }
  }

  // Send back the new values for use
  return new_dimensions;

}