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
    // list of excluded/included applications
    excludeMode:  readConfig("excludeMode",  true),
    includeMode:  readConfig("includeMode",  false),
    excludedApps: readConfig("excludedApps", "").split(/,\s|,/),
    includedApps: readConfig("includedApps", "").split(/,\s|,/)
};


///////////////////////
// initialization
///////////////////////

debugMode = true;
function debug(...args) {if (debugMode) console.debug("Window Gaps:", ...args);}
debug("intializing");
debug("sizes (t/l/r/b/m):", config.gapTop, config.gapLeft, config.gapRight, config.gapBottom, config.gapMid);
debug("layout:", "maximized:", config.includeMaximized);
debug("applications:", "exclude:", config.excludeMode, String(config.excludedApps), "include:", config.includeMode, String(config.includedApps));
debug("");


///////////////////////
// set up triggers
///////////////////////

// block reapplying until current iteration is finished
var block = false;

function caption(client) {
    return client.caption || client;
}

// trigger applying tile gaps when client is initially present or added
workspace.clientList().forEach(client => onAdded(client));
workspace.clientAdded.connect(onAdded);
function onAdded(client) {
    debug("added", caption(client));
    applyGaps(client);

    onRegeometrized(client);
}

// trigger applying tile gaps when client is moved or resized
function onRegeometrized(client) {
    // client.moveResizedChanged.connect((client) =>
    // 	{ debug_("move resized changed", caption(client)); applyGaps(client);   });
    // client.geometryChanged.connect((client) =>
        // { debug_("geometry changed", caption(client)); gaps(client); });
    // client.clientGeometryChanged.connect((client) =>
    // // 	{ debug_("client geometry changed", caption(client)); applyGaps(client); });
    client.frameGeometryChanged.connect((client) =>
        { debug("frame geometry changed", caption(client)); applyGaps(client)});
    client.clientFinishUserMovedResized.connect((client) =>
    	{ debug("finish user moved resized", caption(client)); applyGaps(client); });
    client.fullScreenChanged.connect((client) =>
        { debug("fullscreen changed", caption(client)); applyGaps(client); });
    client.clientMaximizedStateChanged.connect((client) =>
        { debug("maximized changed", caption(client)); applyGaps(client); });
    client.clientUnminimized.connect((client) =>
        { debug("unminimized", caption(client)); applyGaps(client); });
    client.screenChanged.connect((client) =>
        { debug("screen changed", caption(client)); applyGaps(client); });
    client.desktopChanged.connect((client) =>
        { debug("desktop changed", caption(client)); applyGaps(client); });
}

// trigger reapplying tile gaps for all windows when screen geometry changes
function applyGapsAll() {
    workspace.clientList().forEach(client => applyGaps(client));
}

onRelayouted();
function onRelayouted() {
    workspace.currentDesktopChanged.connect(() =>
    		{ debug("current desktop changed"); applyGapsAll(); });
    workspace.desktopPresenceChanged.connect(() =>
    		{ debug("desktop presence changed"); applyGapsAll(); });
    workspace.numberDesktopsChanged.connect(() =>
    		{ debug("number desktops changed"); applyGapsAll(); });
    workspace.numberScreensChanged.connect(() =>
    		{ debug("number screens changed"); applyGapsAll(); });
    workspace.screenResized.connect(() =>
    		{ debug("screen reszed"); applyGapsAll(); });
    workspace.currentActivityChanged.connect(() =>
    		{ debug("current activity changed"); applyGapsAll(); });
    workspace.activitiesChanged.connect(() =>
    		{ debug("activities changed"); applyGapsAll(); });
    workspace.virtualScreenSizeChanged.connect(() =>
    		{ debug("virtual screen size changed"); applyGapsAll(); });
    workspace.virtualScreenGeometryChanged.connect(() =>
    		{ debug("virtual screen geometry changed"); applyGapsAll(); });
    workspace.clientAdded.connect((client) => { if (client.dock) {
            debug("dock added"); applyGapsAll(); }});
}


///////////////////////
// apply gaps
///////////////////////

// make tile gaps for given client
function applyGaps(client) {
    // abort if there is a current iteration of gapping still running, the client is null or irrelevant
    if (block || !client || ignoreClient(client)) return;
    block = true;
    debug("gaps for", client.caption, client.geometry);
    // make tile gaps to area grid
    applyGapsArea(client);
    // make tile gaps to other windows
    applyGapsWindows(client);
    block = false;
    debug("");
}

function applyGapsArea(client) {
    var grid = getGrid(client);
    var win = client.geometry;

    // for each window edge, if the edge is near a grid anchor, set it to the gapped coordinate

    // left window edge
    for (var i = 0; i < Object.keys(grid.left).length; i++) {
        var pos = Object.keys(grid.left)[i];
        var coords = grid.left[pos];
        if (nearArea(win.left, coords, config.gapLeft)) {
            debug("gap to left tile edge", pos);
            var diff = coords.gapped - win.left;
            win.width -= diff;
            win.x += diff;
            break;
        }
    }

    // right window edge
    for (var i = 0; i < Object.keys(grid.right).length; i++) {
        var pos = Object.keys(grid.right)[i];
        var coords = grid.right[pos];
        if (nearArea(win.right, coords, config.gapRight)) {
            debug("gap to right tile edge", pos);
            var diff = win.right - coords.gapped;
            win.width -= diff;
            break;
        }
    }

    // top window edge
    for (var i = 0; i < Object.keys(grid.top).length; i++) {
        var pos = Object.keys(grid.top)[i];
        var coords = grid.top[pos];
        if (nearArea(win.top, coords, config.gapTop)) {
            debug("gap to top tile edge", pos);
            var diff = coords.gapped - win.top;
            win.height -= diff;
            win.y += diff;
            break;
        }
    }

    // bottom window edge
    for (var i = 0; i < Object.keys(grid.bottom).length; i++) {
        var pos = Object.keys(grid.bottom)[i];
        var coords = grid.bottom[pos];
        if (nearArea(win.bottom, coords, config.gapBottom)) {
            debug("gap to bottom tile edge", pos);
            var diff = win.bottom - coords.gapped;
            win.height -= diff;
            break;
        }
    }
}

function applyGapsWindows(client1) {
    // get relevant other windows
    for (var i = 0; i < workspace.clientList().length; i++) {
        var client2 = workspace.clientList()[i];
        if (!client2) continue;
        if (ignoreOther(client1, client2)) continue;

        var win1 = client1.geometry;
        var win2 = client2.geometry;

        // left window
        if (nearWindow(diff = (win1.left - win2.right), config.gapMid) &&
            overlapVer(win1, win2)) {
            debug("gap to left window", client2.caption);
            win1.x = win1.x - halfDiffL(diff) + halfGapU();
            win1.width = win1.width + halfDiffL(diff) - halfGapU();
            win2.width = win2.width + halfDiffU(diff) - halfGapL();
        }

        // right window
        if (nearWindow(diff = (win2.left - win1.right), config.gapMid) &&
            overlapVer(win1, win2)) {
            debug("gap to right window", client2.caption);
            win1.width = win1.width + halfDiffU(diff) - halfGapL();
            win2.x = win2.x - halfDiffL(diff) + halfGapU();
            win2.width = win2.width + halfDiffL(diff) - halfGapU();
        }

        // top window
        if (nearWindow(diff = (win1.top - win2.bottom), config.gapMid) &&
            overlapHor(win1, win2)) {
            debug("gap to top window", client2.caption);
            win1.y = win1.y - halfDiffL(diff) + halfGapU();
            win1.height = win1.height + halfDiffL(diff) - halfGapU();
            win2.height = win2.height + halfDiffU(diff) - halfGapL();
        }

        // bottom window
        if (nearWindow(diff = (win2.top - win1.bottom), config.gapMid) &&
            overlapHor(win1, win2)) {
            debug("gap to bottom window", client2.caption);
            win1.height = win1.height + halfDiffU(diff) - halfGapL();
            win2.y = win2.y - halfDiffL(diff) + halfGapU();
            win2.height = win2.height + halfDiffL(diff) - halfGapU();
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
        right: clientArea.x + clientArea.width - config.offsetRight - 1,
        top: clientArea.y + config.offsetTop,
        bottom: clientArea.y + clientArea.height - config.offsetBottom - 1,
    };
}

// anchor coordinates without and with gaps
function getGrid(client) {
    var area = getArea(client);
    return {
        left: {
            fullLeft: {
                closed: Math.round(area.left),
                gapped: Math.round(area.left + config.gapLeft)
            },
            quarterLeft: {
                closed: Math.round(area.left + 1 * (area.width/4)),
                gapped: Math.round(area.left + 1 * (area.width + config.gapLeft - config.gapRight + config.gapMid)/4)
            },
            halfHorizontal: {
                closed: Math.round(area.left + area.width/2),
                gapped: Math.round(area.left + (area.width + config.gapLeft - config.gapRight + config.gapMid)/2)
            },
            quarterRight: {
                closed: Math.round(area.left + 3 * (area.width/4)),
                gapped: Math.round(area.left + 3 * (area.width + config.gapLeft - config.gapRight + config.gapMid)/4)
            }
        },
        right: {
                quarterLeft: {
                    closed: Math.round(area.right - 3 * (area.width/4)),
                    gapped: Math.round(area.right - 3 * (area.width + config.gapLeft - config.gapRight + config.gapMid)/4)
                },
                halfHorizontal: {
                    closed: Math.round(area.right - area.width/2),
                    gapped: Math.round(area.right - (area.width + config.gapLeft - config.gapRight + config.gapMid)/2)
                },
                quarterRight: {
                    closed: Math.round(area.right - 1 * (area.width/4)),
                    gapped: Math.round(area.right - 1 * (area.width + config.gapLeft - config.gapRight + config.gapMid)/4)
                },
                fullRight: {
                    closed: Math.round(area.right),
                    gapped: Math.round(area.right - config.gapRight)
                }
        },
        top: {
            fullTop: {
                closed: Math.round(area.top),
                gapped: Math.round(area.top + config.gapTop)
            },
            quarterTop: {
                closed: Math.round(area.top + 1 * (area.height/4)),
                gapped: Math.round(area.top + 1 * (area.height + config.gapTop - config.gapBottom + config.gapMid)/4)
            },
            halfVertical: {
                closed: Math.round(area.top + area.height/2),
                gapped: Math.round(area.top + (area.height + config.gapTop - config.gapBottom + config.gapMid)/2)
            },
            quarterBottom: {
                closed: Math.round(area.top + 3 * (area.height/4)),
                gapped: Math.round(area.top + 3 * (area.height + config.gapTop - config.gapBottom + config.gapMid)/4)
            }
        },
        bottom: {
            quarterTop: {
                closed: Math.round(area.bottom - 3 * (area.height/4)),
                gapped: Math.round(area.bottom - 3 * (area.height + config.gapTop - config.gapBottom + config.gapMid)/4)
            },
            halfVertical: {
                closed: Math.round(area.bottom - area.height/2),
                gapped: Math.round(area.bottom - (area.height + config.gapTop - config.gapBottom + config.gapMid)/2)
            },
            quarterBottom: {
                closed: Math.round(area.bottom - 1 * (area.height/4)),
                gapped: Math.round(area.bottom - 1 * (area.height + config.gapTop - config.gapBottom + config.gapMid)/4)
            },
            fullBottom: {
                closed: Math.round(area.bottom),
                gapped: Math.round(area.bottom - config.gapBottom)
            }
        }
    };
}


///////////////////////
// geometry helpers
///////////////////////

// a coordinate is close to another iff the difference is within the tolerance margin but not exactly the desired geometry
function nearArea(actual, expected, gap) {
    return (Math.abs(actual - expected.closed) <= 2 * gap
         || Math.abs(actual - expected.gapped) <= 2 * gap)
        && actual != expected.gapped;
}

function nearWindow(diff, gap) {
    return Math.abs(diff) <= 2 * gap
        && diff != gap;
}

// horizontal/vertical overlap

function overlapHor(win1, win2) {
    const toleranceMid = 2 * config.gapMid;
    return (win1.left <= win2.left + toleranceMid
            && win1.right > win2.left + toleranceMid)
        || (win2.left <= win1.left + toleranceMid
            && win2.right + toleranceMid > win1.left);
}

function overlapVer(win1, win2) {
    const toleranceMid = 2 * config.gapMid;
    return (win1.top <= win2.top + toleranceMid
            && win1.bottom > win2.top + toleranceMid)
        || (win2.top <= win1.top + toleranceMid
            && win2.bottom + toleranceMid > win1.top);
}

// floored/ceiled half difference between edges
function halfDiffL(diff) {
    return Math.floor(diff/2);
}

function halfDiffU(diff) {
    return Math.ceil(diff/2);
}

// floored/ceiled half gap mid size
function halfGapL() {
    return Math.floor(config.gapMid/2);
}

function halfGapU() {
    return Math.ceil(config.gapMid/2);
}

///////////////////////
// ignored clients
///////////////////////

// filter out irrelevant clients
function ignoreClient(client) {
    return !client // null
        || !client.normalWindow // non-normal window
        || ["plasmashell", "krunner"].includes(String(client.resourceClass)) // non-normal application
        || client.move || client.resize // still undergoing geometry change
        || client.fullScreen // fullscreen
        || (!config.includeMaximized
            && client.width == workspace.clientArea(KWin.MaximizeArea, client).width
            && client.height == workspace.clientArea(KWin.MaximizeArea, client).height) // maximized
        || (config.excludeMode
            && config.excludedApps.includes(String(client.resourceClass))) // excluded appliation
        || (config.includeMode
            && !(config.includedApps.includes(String(client.resourceClass)))); // not included application
}

function ignoreOther(client1, client2) {
    return ignoreClient(client2) // excluded
        || client2 == client1 // identical
        || !(client2.desktop == client1.desktop
            || client2.onAllDesktops || client1.onAllDesktops) // same desktop
        || !(client2.screen == client1.screen) // different screen
        || client2.minimized; // minimized
}
