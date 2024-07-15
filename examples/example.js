const { ipcRenderer } = require("electron");

// Send events to IPC
function InvokeIPC(element_id, data = '', key = "invokeAction" ) {
    ipcRenderer.send(key, {id: element_id, data: data}); 
}

// Listen to incoming event to show a hidden element
ipcRenderer.on('show_element', function (event, value) {
    document.getElementById(value).classList.toggle("hide");
});

// Toggle hide the panel
function HideOSD() { 
    document.getElementById("osd").classList.toggle("hide_panel"); 
    if (document.getElementById("osd").classList.contains("hide_panel")) {
        document.getElementById("button_hide_icon").classList.remove("fa-angle-double-right");
        document.getElementById("button_hide_icon").classList.add("fa-angle-double-left");  
        document.getElementById("button_hide_label").textContent="Show";  
    } else {
        document.getElementById("button_hide_icon").classList.remove("fa-angle-double-left");  
        document.getElementById("button_hide_icon").classList.add("fa-angle-double-right");
        document.getElementById("button_hide_label").textContent="Hide";
        ToggleOSD();
    }
}

// Slide the OSD in or out
function ToggleOSD(show) {

    // The 'show' parameter forces a single state change in one direction
    // If not specified undefined just toggle
    if (typeof show === 'undefined') {
        if ( document.getElementById("osd").classList.contains("osd_out") ) {
            OSDIn();
        } else {
            OSDOut();
        }

    } else {
        // We need to only trigger the change if its actually required
        if (show && (! document.getElementById("osd").classList.contains("osd_out"))) {
            OSDOut();
        } else if (document.getElementById("osd").classList.contains("osd_out")) {
            OSDIn();
        }
    }

}

// Wrappers to dedup logic of ToggleOSD
function OSDOut() {
    document.getElementById("osd").classList.add("osd_out");
    InvokeIPC("osd", data = {width: 220, x: {"relative": true, "offset": -220}}, key = "changeRegion");
}
function OSDIn() {
    // We dont resize the window here, a listener will do that on transition end
    document.getElementById("osd").classList.remove("osd_out");
}
// When OSD finishes sliding in fire this to resize the window
document.getElementById("osd").addEventListener("transitionend", function TransitionEnd(e) {
    if ((! document.getElementById("osd").classList.contains("osd_out"))  && (! document.getElementById("session_container").classList.contains("session_container_out"))) {
        InvokeIPC("osd", data = {width: 40, x: {"relative": true, "offset": -40}}, key = "changeRegion");
    }
});

// Pop out the add session dialog
function ToggleAddSession(mouseout) {
    // Mouse out event cannot toggle the element on
    if (mouseout) {
        if (document.getElementById("session_container").classList.contains("session_container_out")) {
            AddSessionToggle();
        }
    } else {
        AddSessionToggle();
    }
}

function AddSessionToggle() {
    if  (! document.getElementById("session_container").classList.contains("session_container_out")) {
        InvokeIPC("osd", data = {width: 40 + 258, x: {"relative": true, "offset": -(40 + 258)}}, key = "changeRegion");
    }
    document.getElementById("session_container").classList.toggle("session_container_out");
}
document.getElementById("session_container").addEventListener("transitionend", function TrasitionEnd(e) {
    if ((! document.getElementById("session_container").classList.contains("session_container_out")) && (! document.getElementById("osd").classList.contains("osd_out"))) {
        InvokeIPC("osd", data = {width: 40, x: {"relative": true, "offset": -40}}, key = "changeRegion" );
    }
});