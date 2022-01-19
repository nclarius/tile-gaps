/*
KWin Script Tile Gaps
(C) 2021 Natalie Clarius <natalie_clarius@yahoo.de>
GNU General Public License v3.0
*/


///////////////////////
// configuration
///////////////////////

const config = {
    // size of gap to screen edges
    gapTop:    readConfig("gapTop",    12),
    gapLeft:   readConfig("gapLeft",   12),
    gapRight:  readConfig("gapRight",  12),
    gapBottom: readConfig("gapBottom", 12),
    // size of gap between windows
    gapMid:    readConfig("gapMid",    12),
    // offsets from floating panels
    offsetTop:    readConfig("offsetTop", 0),
    offsetLeft:   readConfig("offsetLeft", 0),
    offsetRight:  readConfig("offsetRight", 0),
    offsetBottom: readConfig("offsetBottom", 0),
    // whether to apply gaps on maximized windows
    includeMaximized: readConfig("includeMaximized", false),
    // divergence margin within which windows are still considered tiled
    tolerance: readConfig("tolerance", 24),
    // list of excluded/included applications
    excludeMode:  readConfig("excludeMode",  true),
    includeMode:  readConfig("includeMode",  false),
    excludedApps: readConfig("excludedApps", "").split(", "),
    includedApps: readConfig("includedApps", "").split(", ")
};


///////////////////////
// initialization
///////////////////////

debugMode = true;
function debug(...args) {if (debugMode) console.debug("Tile Gaps:", ...args);}
debug("intializing");
debug("sizes (t/l/r/b/m):", config.gapTop, config.gapLeft, config.gapRight, config.gapBottom, config.gapMid);
debug("layout:", "maximized:", config.includeMaximized, "tolerance", config.tolerance);
debug("applications:", "exclude:", config.excludeMode, String(config.excludedApps), "include:", config.includeMode, String(config.includedApps));
debug("");


///////////////////////
// set up triggers
///////////////////////

var block = false;

// trigger applying tile gaps when client is initially present, added, moved or resized
workspace.clientList().forEach(client => onAdded(client));
workspace.clientAdded.connect(onAdded);
function onAdded(client) {
    tileGaps(client);
    client.geometryChanged.connect(tileGaps);
    client.clientGeometryChanged.connect(tileGaps);
    client.frameGeometryChanged.connect(tileGaps);
    client.clientFinishUserMovedResized.connect(tileGaps);
    client.moveResizedChanged.connect(tileGaps);
    client.fullScreenChanged.connect(tileGaps);
    client.clientMaximizedStateChanged.connect(tileGaps);
    client.clientUnminimized.connect(tileGaps);
    client.clientMinimized.connect(tileGaps);
    client.screenChanged.connect(tileGaps);
    client.desktopChanged.connect(tileGaps);
}

// trigger reapplying tile gaps for all windows when screen geometry changes
workspace.currentDesktopChanged.connect(tileGapsAll);
workspace.desktopPresenceChanged.connect(tileGapsAll);
workspace.numberDesktopsChanged.connect(tileGapsAll);
workspace.numberScreensChanged.connect(tileGapsAll);
workspace.screenResized.connect(tileGapsAll);
workspace.currentActivityChanged.connect(tileGapsAll);
workspace.activitiesChanged.connect(tileGapsAll);
workspace.virtualScreenSizeChanged.connect(tileGapsAll);
workspace.virtualScreenGeometryChanged.connect(tileGapsAll);
workspace.clientAdded.connect(function(client) {if (client.dock) tileGapsAll();});
function tileGapsAll() {
    workspace.clientList().forEach(client => tileGaps(client));
}


///////////////////////
// make tile gaps
///////////////////////

// make tile gaps for given client
function tileGaps(client) {
    // get client to be gapped
    // if no client is provided, default to active client
    if (client == null) client = workspace.activeClient;
    // abort if client is irrelevant
    if (ignore(client)) return;
    debug("gaps for", client.caption, client.resourceClass);
    // debug("client geometry", client.geometry.left, client.geometry.right, client.geometry.top, client.geometry.bottom);

    // make tile gaps to screen edges
    tileGapsScreen(client);
    // make tile gaps to other windows
    tileGapsWindows(client);

    debug("");
}

function tileGapsScreen(win) {
    if (block) return;
    // get relevant screen area
    var clientArea = workspace.clientArea(KWin.MaximizeArea, win);
    var area = {geometry: {
        left:   clientArea.x + config.offsetLeft,
        right:  clientArea.x + clientArea.width - config.offsetRight,
        top:    clientArea.y + config.offsetTop,
        bottom: clientArea.y + clientArea.height - config.offsetBottom
    }};
    // debug("area geometry", ...Object.values(area.geometry));

    // left screen edge
    if (nearEdge(diff = (win.geometry.left - area.geometry.left), config.gapLeft)) {
        debug("gap to left screen edge");
        win.geometry.x = win.geometry.x - diff + config.gapLeft;
        win.geometry.width = win.width - config.gapLeft;
    }
    // right screen edge
    if (nearEdge(diff = (area.geometry.right - win.geometry.right), config.gapRight)) {
        // debug("gap to right screen edge");
        win.geometry.width = win.geometry.width + diff - config.gapRight;
    }
    // top screen edge
    if (nearEdge(diff = (win.geometry.top - area.geometry.top), config.gapTop)) {
        debug("gap to top screen edge");
        win.geometry.y = win.geometry.y - diff + config.gapTop;
        win.geometry.height = win.geometry.height - config.gapTop;
    }
    // bottom screen edge
    if (nearEdge(diff = (area.geometry.bottom - win.geometry.bottom), config.gapBottom)) {
        debug("gap to bottom screen edge");
        win.geometry.height = win.geometry.height + diff - config.gapBottom;
    }
}

function tileGapsWindows(win1) {
    // get relevant other windows
    var clientList = workspace.clientList().filter(win2 =>
           !ignore(win2) // not excluded
        && win2 != win1 // not identical
        && (win2.desktop == win1.desktop
            || win2.onAllDesktops || win1.onAllDesktops) // same desktop
        && win2.screen == win1.screen // same screen
        && !win2.minimized // unminimized
        );
    for (var i = 0; i < clientList.length; i++) {
        var win2 = clientList[i];
        // debug("other window", win2.caption, ...Object.values(win2.geometry));

        // left window
        if (nearWindow(diff = (win1.geometry.left - win2.geometry.right), config.gapMid)
            && ((win1.geometry.top <= win2.geometry.top
                && win1.geometry.bottom > win2.geometry.top)
             || (win2.geometry.top <= win1.geometry.top
                 && win2.geometry.bottom > win1.geometry.top))) {
            debug("gap to left window", win2.caption);
            halfDiffL = Math.floor(diff/2);
            halfDiffU = Math.ceil(diff/2);
            halfGapL = Math.floor(config.gapMid/2);
            halfGapU = Math.ceil(config.gapMid/2);
            block = true;
            win1.geometry.x = win1.geometry.x - halfDiffL + halfGapU;
            win1.geometry.width = win1.geometry.width + halfDiffL - halfGapU;
            win2.geometry.width = win2.geometry.width + halfDiffU - halfGapL;
            block = false;
        }

        // right window
        if (nearWindow(diff = (win2.geometry.left - win1.geometry.right), config.gapMid)
            && ((win1.geometry.top <= win2.geometry.top
                && win1.geometry.bottom > win2.geometry.top)
             || (win2.geometry.top <= win1.geometry.top
                 && win2.geometry.bottom > win1.geometry.top))) {
            debug("gap to right window", win2.caption);
            halfDiffL = Math.floor(diff/2);
            halfDiffU = Math.ceil(diff/2);
            halfGapL = Math.floor(config.gapMid/2);
            halfGapU = Math.ceil(config.gapMid/2);
            block = true;
            win1.geometry.width = win1.geometry.width + halfDiffU - halfGapL;
            win2.geometry.x = win2.geometry.x - halfDiffL + halfGapU;
            win2.geometry.width = win2.geometry.width + halfDiffL - halfGapU;
            block = false;
        }

        // top window
        if (nearWindow(diff = (win1.geometry.top - win2.geometry.bottom), config.gapMid)
            && ((win1.geometry.left <= win2.geometry.left
                && win1.geometry.right > win2.geometry.left)
             || (win2.geometry.left <= win1.geometry.left
                 && win2.geometry.right > win1.geometry.left))) {
            debug("gap to top window", win2.caption);
            halfDiffL = Math.floor(diff/2);
            halfDiffU = Math.ceil(diff/2);
            halfGapL = Math.floor(config.gapMid/2);
            halfGapU = Math.ceil(config.gapMid/2);
            block = true;
            win1.geometry.y = win1.geometry.y - halfDiffL + halfGapU;
            win1.geometry.height = win1.geometry.height + halfDiffL - halfGapU;
            win2.geometry.height = win2.geometry.height + halfDiffU - halfGapL;
            block = false;
        }

        // bottom window
        if (nearWindow(diff = (win2.geometry.top - win1.geometry.bottom), config.gapMid)
            && ((win1.geometry.left <= win2.geometry.left
                && win1.geometry.right > win2.geometry.left)
             || (win2.geometry.left <= win1.geometry.left
                 && win2.geometry.right > win1.geometry.left))) {
            debug("gap to bottom window", win2.caption);
            halfDiffL = Math.floor(diff/2);
            halfDiffU = Math.ceil(diff/2);
            halfGapL = Math.floor(config.gapMid/2);
            halfGapU = Math.ceil(config.gapMid/2);
            block = true;
            win1.geometry.height = win1.geometry.height + halfDiffU - halfGapL;
            win2.geometry.y = win2.geometry.y - halfDiffL + halfGapU;
            win2.geometry.height = win2.geometry.height + halfDiffL - halfGapU;
            block = false;
        }
    }
}

// a geometry is close to another iff the difference is within the tolerance margin but not exactly the desired geometry
function nearEdge(diff, match) {
    return Math.abs(diff) <= 2 * match && diff != match;
}

function nearWindow(diff, match) {
    return Math.abs(diff) <= 2 * match && diff != match;
}

// filter out irrelevant clients
function ignore(client) {
    return client == undefined || client == null // undefined
        || !client.normalWindow || ["krunner", "kruler"].includes(String(client.resourceClass)) // non-normal window
        || client.move || client.resize // still undergoing geometry change
        || client.fullScreen || (config.excludeMaximized && client.width == workspace.clientArea(KWin.MaximizeArea, client).width && client.height == workspace.clientArea(KWin.MaximizeArea, client).height) // fullscreened or maximized
        || (config.excludeMode && config.excludedApps.includes(String(client.resourceClass))) || (config.includeMode && !(config.includedApps.includes(String(client.resourceClass)))) // exclduded or not included
}
