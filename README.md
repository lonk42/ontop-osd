# OnTop OSD

An Electron based overlay for Linux desktops aimed to be modular and used in kiosk contexts.

## Usage

OnTop OSD is designed to be used with your own HTML/CSS/Javascript stack, basic examples exploring currently implemented options can be found in `examples/`.

### Config File

The config file is provided as JSON and exposes the following arguments:

* `osd_html`: Path to html for the OSD
* `position`: Where to position the window
  * `x` ,`y`:
    * `relative`: If true relative will reference the x and y co-ordinates from your screen width and height
		* `offset`: A real value to add to `x` or `y`, usefull when used in conjunction with `relative`
    * `percent`: An integer to divide your `x` or `y` value, can be used with relative to pick a position on screen
* `width`, `height`: Dimmensions of your element
* `functions`: Functions define basic [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc) methods to communicate between javascript and node
  * `method`: What kind of action to take when triggered
    * `write_file`: Create a file, see `write_file_path` for scoping destination
    * `filename`: Name of the file to create with `write_file` method
* `write_file_path`: Directory to be used when invoking `write_file` IPC function
* `startup_functions`: IPC to run from node to the OS when its started
  * `condition`: Only run the function if your condition matches
  * `check_current_user`: Returns true is the OSD is run by specified `user`
  * `user`: username for `check_current_user`
  * `action`: What to do on invocation
    * `sendIPC`: Run a basic IPC send
  * `ipc_data`: JSON array to send when using `sendIPC` action, uses format `{"event": "", "data": ""}`

### CLI arguments

* `--config-file`: Path to your JSON config as defined above


## Building the app as a deb

1. [Install NPM LTS.](https://nodejs.org/en/download/package-manager/)
2. Install requisite Node components:
```bash
npm install
```
3. Ensure packging dependencies are installed (each OS will have different requirements here):
```bash
dnf install jq fakeroot
apt-get install build-essential jq dpkg-dev
npm install -g electron-packager electron-installer-debian
```
4. Build the package:
```bash
electron-packager . --platform linux --arch x64 --out dist/
electron-installer-debian --src dist/ontop-osd-linux-x64/ --dest dist/installers/ --arch amd64
```
