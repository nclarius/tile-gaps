/*
KWin Script Window Gaps
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
function debug(...args) {if (debugMode) console.debug("Window Gaps:", ...args);}
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
    caption = client != undefined ? client.caption : client;
    debug("client added", caption);
    gaps(client);
    client.geometryChanged.connect((client) =>
		{ debug("geometry changed", caption); gaps(client); });
    client.clientGeometryChanged.connect((client) =>
		{ debug("client geometry changed", caption); gaps(client); });
    client.frameGeometryChanged.connect((client) =>
		{ debug("frame geometry changed", caption); gaps(client); });
    client.clientFinishUserMovedResized.connect((client) =>
		{ debug("finish user moved resized", caption); gaps(client); });
    client.moveResizedChanged.connect((client) =>
		{ debug("move resized changed", caption); gaps(client); });
    client.fullScreenChanged.connect((client) =>
		{ debug("fullscreen changed", caption); gaps(client); });
    client.clientMaximizedStateChanged.connect((client) =>
		{ debug("maximized changed", caption); gaps(client); });
    client.clientUnminimized.connect((client) =>
		{ debug("unminimized", caption); gaps(client); });
    client.screenChanged.connect((client) =>
		{ debug("screen changed", caption); gaps(client); });
    client.desktopChanged.connect((client) =>
		{ debug("desktop changed", caption); gaps(client); });
}

// trigger reapplying tile gaps for all windows when screen geometry changes
workspace.currentDesktopChanged.connect(() =>
		{ debug("current desktop changed"); gapsAll(); });
workspace.desktopPresenceChanged.connect(() =>
		{ debug("desktop presence changed"); gapsAll(); });
workspace.numberDesktopsChanged.connect(() =>
		{ debug("number desktops changed"); gapsAll(); });
workspace.numberScreensChanged.connect(() =>
		{ debug("number screens changed"); gapsAll(); });
workspace.screenResized.connect(() =>
		{ debug("screen reszed"); gapsAll(); });
workspace.currentActivityChanged.connect(() =>
		{ debug("current activity changed"); gapsAll(); });
workspace.activitiesChanged.connect(() =>
		{ debug("activities changed"); gapsAll(); });
workspace.virtualScreenSizeChanged.connect(() =>
		{ debug("virtual screen size changed"); gapsAll(); });
workspace.virtualScreenGeometryChanged.connect(() =>
		{ debug("virtual screen geometry changed"); gapsAll(); });
workspace.clientAdded.connect((client) => { if (client.dock) {
        debug("dock added"); gapsAll(); }});
function gapsAll() {
    workspace.clientList().forEach(client => gaps(client));
}


///////////////////////
// make gaps
///////////////////////

// make tile gaps for given client
function gaps(client) {
    // get client to be gapped
    if (block || client == null || client == undefined) return;
    // abort if client is irrelevant
    if (ignore(client)) return;
    debug("gaps for", caption, client.geometry);
    // make tile gaps to area grid
    gapsArea(client);
    // make tile gaps to other windows
    gapsWindows(client);
    debug("");
}

function gapsArea(win_) {
    var grid = getGrid(win_);
    var win = win_.geometry;

    // for each window edge, if the edge is near a grid anchor, set it to the gapped coordinate

    // left window edge
    for (var i = 0; i < Object.keys(grid.left).length; i++) {
        var pos = Object.keys(grid.left)[i];
        var coords = grid.left[pos];
        if (nearArea(win.left, coords)) {
            debug("gap to left tile edge", pos);
            win.x = coords.gapped;
            break;
        }
    }

    // right window edge
    for (var i = 0; i < Object.keys(grid.right).length; i++) {
        var pos = Object.keys(grid.right)[i];
        var coords = grid.right[pos];
        if (nearArea(win.right, coords)) {
            debug("gap to right tile edge", pos);
            win.width = coords.gapped - win.x;
            break;
        }
    }

    // top window edge
    for (var i = 0; i < Object.keys(grid.top).length; i++) {
        var pos = Object.keys(grid.top)[i];
        var coords = grid.top[pos];
        if (nearArea(win.top, coords)) {
            debug("gap to top tile edge", pos);
            win.y = coords.gapped;
            break;
        }
    }

    // bottom window edge
    for (var i = 0; i < Object.keys(grid.bottom).length; i++) {
        var pos = Object.keys(grid.bottom)[i];
        var coords = grid.bottom[pos];
        if (nearArea(win.bottom, coords)) {
            debug("gap to bottom tile edge", pos);
            win.height = coords.gapped - win.y;
            break;
        }
    }
}

function gapsWindows(win1_) {
    // get relevant other windows
    var clientList = workspace.clientList().filter(win2_ =>
        !ignore(win2_) // not excluded
        && win2_ != win1_ // not identical
        && (win2_.desktop == win1_.desktop
            || win2_.onAllDesktops || win1_.onAllDesktops) // same desktop
        && win2_.screen == win1_.screen // same screen
        && !win2_.minimized); // unminimized
    for (var i = 0; i < clientList.length; i++) {
        var win2_ = clientList[i];
        // debug("other window", win2_.caption, ...Object.values(win2.geometry));

        var win1 = win1_.geometry;
        var win2 = win2_.geometry;

        // left window
        if (nearWindow(diff = (win1.left - win2.right), config.gapMid)
            && ((win1.top <= win2.top
                && win1.bottom > win2.top)
             || (win2.top <= win1.top
                 && win2.bottom > win1.top))) {
            debug("gap to left window", win2_.caption);
            halfDiffL = Math.floor(diff/2);
            halfDiffU = Math.ceil(diff/2);
            halfGapL = Math.floor(config.gapMid/2);
            halfGapU = Math.ceil(config.gapMid/2);
            block = true;
            win1.x = win1.x - halfDiffL + halfGapU;
            win1.width = win1.width + halfDiffL - halfGapU;
            win2.width = win2.width + halfDiffU - halfGapL;
            block = false;
        }

        // right window
        if (nearWindow(diff = (win2.left - win1.right), config.gapMid)
            && ((win1.top <= win2.top
                && win1.bottom > win2.top)
             || (win2.top <= win1.top
                 && win2.bottom > win1.top))) {
            debug("gap to right window", win2_.caption);
            halfDiffL = Math.floor(diff/2);
            halfDiffU = Math.ceil(diff/2);
            halfGapL = Math.floor(config.gapMid/2);
            halfGapU = Math.ceil(config.gapMid/2);
            block = true;
            win1.width = win1.width + halfDiffU - halfGapL;
            win2.x = win2.x - halfDiffL + halfGapU;
            win2.width = win2.width + halfDiffL - halfGapU;
            block = false;
        }

        // top window
        if (nearWindow(diff = (win1.top - win2.bottom), config.gapMid)
            && ((win1.left <= win2.left
                && win1.right > win2.left)
             || (win2.left <= win1.left
                 && win2.right > win1.left))) {
            debug("gap to top window", win2_.caption);
            halfDiffL = Math.floor(diff/2);
            halfDiffU = Math.ceil(diff/2);
            halfGapL = Math.floor(config.gapMid/2);
            halfGapU = Math.ceil(config.gapMid/2);
            block = true;
            win1.y = win1.y - halfDiffL + halfGapU;
            win1.height = win1.height + halfDiffL - halfGapU;
            win2.height = win2.height + halfDiffU - halfGapL;
            block = false;
        }

        // bottom window
        if (nearWindow(diff = (win2.top - win1.bottom), config.gapMid)
            && ((win1.left <= win2.left
                && win1.right > win2.left)
             || (win2.left <= win1.left
                 && win2.right > win1.left))) {
            debug("gap to bottom window", win2_.caption);
            halfDiffL = Math.floor(diff/2);
            halfDiffU = Math.ceil(diff/2);
            halfGapL = Math.floor(config.gapMid/2);
            halfGapU = Math.ceil(config.gapMid/2);
            block = true;
            win1.height = win1.height + halfDiffU - halfGapL;
            win2.y = win2.y - halfDiffL + halfGapU;
            win2.height = win2.height + halfDiffL - halfGapU;
            block = false;
        }
    }
}


///////////////////////
// get geometry
///////////////////////

// available screen area
function getArea(client) {
    var clientArea = workspace.clientArea(KWin.MaximizeArea, client);
    return {
        x: clientArea.x + config.offsetLeft,
        y: clientArea.y + config.offsetTop,
        width: clientArea.width - config.offsetLeft - config.offsetRight,
        height: clientArea.height - config.offsetTop - config.offsetBottom,
        left: clientArea.x + config.offsetLeft,
        right: clientArea.x + clientArea.width - config.offsetRight,
        top: clientArea.y + config.offsetTop,
        bottom: clientArea.y + clientArea.height - config.offsetBottom,
    };
}

// anchor coordinates without and with gaps
function getGrid(client) {
    var area = getArea(client);
    return {
        left: {
            left: {
                closed: Math.round(area.left),
                gapped: Math.round(area.left + config.gapLeft)
            },
            centerLeft: {
                closed: Math.round(area.left + 1 * (area.width/4)),
                gapped: Math.round(area.left + 1 * (area.width + config.gapLeft - config.gapRight + config.gapMid)/4)
            },
            halfHor: {
                closed: Math.round(area.left + area.width/2),
                gapped: Math.round(area.left + (area.width + config.gapLeft - config.gapRight + config.gapMid)/2)
            },
            centerRight: {
                closed: Math.round(area.left + 3 * (area.width/4)),
                gapped: Math.round(area.left + 3 * (area.width + config.gapLeft - config.gapRight + config.gapMid)/4)
            }
        },
        right: {
                centerLeft: {
                    closed: Math.round(area.right - 3 * (area.width/4)),
                    gapped: Math.round(area.right - 3 * (area.width + config.gapLeft - config.gapRight + config.gapMid)/4)
                },
                halfHor: {
                    closed: Math.round(area.right - area.width/2),
                    gapped: Math.round(area.right - (area.width + config.gapLeft - config.gapRight + config.gapMid)/2)
                },
                centerRight: {
                    closed: Math.round(area.right - 1 * (area.width/4)),
                    gapped: Math.round(area.right - 1 * (area.width + config.gapLeft - config.gapRight + config.gapMid)/4)
                },
                right: {
                    closed: Math.round(area.right),
                    gapped: Math.round(area.right - config.gapRight)
                }
        },
        top: {
            top: {
                closed: Math.round(area.top),
                gapped: Math.round(area.top + config.gapTop)
            },
            centerTop: {
                closed: Math.round(area.top + 1 * (area.height/4)),
                gapped: Math.round(area.top + 1 * (area.height + config.gapTop - config.gapBottom + config.gapMid)/4)
            },
            halfVer: {
                closed: Math.round(area.top + area.height/2),
                gapped: Math.round(area.top + (area.height + config.gapTop - config.gapBottom + config.gapMid)/2)
            },
            centerBottom: {
                closed: Math.round(area.top + 3 * (area.height/4)),
                gapped: Math.round(area.top + 3 * (area.height + config.gapTop - config.gapBottom + config.gapMid)/4)
            }
        },
        bottom: {
            centerTop: {
                closed: Math.round(area.bottom - 3 * (area.height/4)),
                gapped: Math.round(area.bottom - 3 * (area.height + config.gapTop - config.gapBottom + config.gapMid)/4)
            },
            halfVer: {
                closed: Math.round(area.bottom - area.height/2),
                gapped: Math.round(area.bottom - (area.height + config.gapTop - config.gapBottom + config.gapMid)/2)
            },
            centerBottom: {
                closed: Math.round(area.bottom - 1 * (area.height/4)),
                gapped: Math.round(area.bottom - 1 * (area.height + config.gapTop - config.gapBottom + config.gapMid)/4)
            },
            bottom: {
                closed: Math.round(area.bottom),
                gapped: Math.round(area.bottom - config.gapBottom)
            }
        }
    };
}

// a coordinate is close to another iff the difference is within the tolerance margin but not exactly the desired geometry
function nearArea(actual, expected) {
    return Math.abs(actual - expected.closed) <= config.tolerance
        && actual != expected.gapped
}

function nearWindow(diff, match) {
    return Math.abs(diff) <= config.tolerance
        && diff != match;
}

// filter out irrelevant clients
function ignore(client) {
    return client == null || client == undefined // undefined
        || !client.normalWindow  // non-normal window
        || ["krunner", "kruler"].includes(String(client.resourceClass)) // non-normal application
        || client.move || client.resize // still undergoing geometry change
        || client.fullScreen // fullscreen
        || (config.excludeMaximized
            && client.width == workspace.clientArea(KWin.MaximizeArea, client).width
            && client.height == workspace.clientArea(KWin.MaximizeArea, client).height) // maximized
        || (config.excludeMode
            && config.excludedApps.includes(String(client.resourceClass))) // excluded appliation
        || (config.includeMode
            && !(config.includedApps.includes(String(client.resourceClass)))) // not included application
}
