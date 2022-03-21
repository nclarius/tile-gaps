/*
KWin Script Window Gaps
(C) 2021 Natalie Clarius <natalie_clarius@yahoo.de>
GNU General Public License v3.0
*/


///////////////////////
// configuration
///////////////////////

const gap = {
    // size of gap to screen edges
    left:   readConfig("gapLeft",   12),
    right:  readConfig("gapRight",  12),
    top:    readConfig("gapTop",    12),
    bottom: readConfig("gapBottom", 12),
    // size of gap between windows
    mid:    readConfig("gapMid",    12)
};

const offset = {
    // offset from floating panels
    left:   readConfig("offsetLeft",   0),
    right:  readConfig("offsetRight",  0),
    top:    readConfig("offsetTop",    0),
    bottom: readConfig("offsetBottom", 0)
};

const config = {
    // layouts to apply gaps to
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

const debugMode = readConfig("debugMode", true);
const fullDebugMode = readConfig("fullDebugMode", false);
function debug(...args) {if (debugMode) console.debug("tilegaps:", ...args);}
function fulldebug(...args) {if (fullDebugMode) {console.debug("tilegaps:", ...args);}}
debug("intializing");
debug("sizes (l/r/t/b/m):",
      gap.left, gap.right, gap.top, gap.bottom, gap.mid);
debug("offset (l/r/t/b):",
      offset.left, offset.right, offset.top, offset.bottom, offset.mid);
debug("layout:",
      "maximized:", config.includeMaximized);
debug("applications:",
      "exclude:", config.excludeMode, String(config.excludedApps),
      "include:", config.includeMode, String(config.includedApps));
debug("");


///////////////////////
// set up triggers
///////////////////////

// block reapplying until current iteration is finished
var block = false;

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
    client.moveResizedChanged.connect((client) =>
    	{ debug("move resized changed", caption(client)); applyGaps(client);   });
    client.geometryChanged.connect((client) =>
        { debug("geometry changed", caption(client)); applyGaps(client); });
    client.clientGeometryChanged.connect((client) =>
    	{ debug("client geometry changed", caption(client)); applyGaps(client); });
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
    		{ debug("screen resized"); applyGapsAll(); });
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
    // abort if there is a current iteration of gapping still running,
    // the client is null or irrelevant
    if (block || !client || ignoreClient(client)) return;
    // block applying other gaps as long as current iteration is running
    block = true;
    debug("gaps for", caption(client), geometry(client));
    // make tile gaps to area grid
    applyGapsArea(client);
    // make tile gaps to other windows
    applyGapsWindows(client);
    block = false;
    debug("");
}

function applyGapsArea(client) {
    var area = getArea(client);
    debug("area", geometry(area));
    var grid = getGrid(client);
    var win = client.geometry;

    // for each window edge, if the edge is near some grid anchor of that edge,
    // set it to the gapped coordinate

    // left edge
    var edge = "left";
    for (var i = 0; i < Object.keys(grid[edge]).length; i++) {
        var pos = Object.keys(grid[edge])[i];
        var coords = grid[edge][pos];
        if (nearArea(win[edge], coords, gap[edge])) {
            debug("gap to edge", edge, pos, coords.gapped);
            var diff = coords.gapped - win[edge];
            win.width -= diff;
            win.x += diff;
            debug("new geo", geometry(win));
            break;
        }
    }

   // right edge
   var edge = "right";
   for (var i = 0; i < Object.keys(grid[edge]).length; i++) {
       var pos = Object.keys(grid[edge])[i];
       var coords = grid[edge][pos];
       if (nearArea(win[edge] + 1, coords, gap[edge])) {
        debug("gap to edge", edge, pos, coords.gapped);
        var diff = coords.gapped - (win[edge] + 1);
        win.width += diff;
        debug("new geo", geometry(win));
        break;
       }
   }

    // top edge
    var edge = "top";
    for (var i = 0; i < Object.keys(grid[edge]).length; i++) {
        var pos = Object.keys(grid[edge])[i];
        var coords = grid[edge][pos];
        if (nearArea(win[edge], coords, gap[edge])) {
            debug("gap to edge", edge, pos, coords.gapped);
            var diff = coords.gapped - win[edge];
            win.height -= diff;
            win.y += diff;
            debug("new geo", geometry(win));
            break;
        }
    }

    // bottom edge
    var edge = "bottom";
    for (var i = 0; i < Object.keys(grid[edge]).length; i++) {
        var pos = Object.keys(grid[edge])[i];
        var coords = grid[edge][pos];
        if (nearArea(win[edge] + 1, coords, gap[edge])) {
            debug("gap to edge", edge, pos, coords.gapped);
            var diff = coords.gapped - (win[edge] + 1);
            win.height += diff;
            debug("new geo", geometry(win));
            break;
        }
    }
}

function applyGapsWindows(client1) {

    // for each other window, if they share an edge,
    // clip or extend both evenly to make the distance the size of the gap

    for (var i = 0; i < workspace.clientList().length; i++) {
        var client2 = workspace.clientList()[i];
        if (!client2) continue;
        if (ignoreOther(client1, client2)) continue;

        var win1 = client1.geometry;
        var win2 = client2.geometry;

        // left window
        var edge = "left";
        if (nearWindow(win1.left, win2.right + 1, gap.mid) &&
            overlapVer(win1, win2)) {
            debug("gap to window", edge, caption(client2), geometry(client2));
            var diff = win1.left - win2.right;
            // crop right window left edge half gap
            win1.x = win1.x - halfDiffL(diff) + halfGapU();
            win1.width = win1.width + halfDiffL(diff) - halfGapU();
            // crop left window right edge half gap
            win2.width = win2.width + halfDiffU(diff) - halfGapL();
            debug("new geo win1", geometry(win1));
            debug("new geo win2", geometry(win2));
        }

        // right window
        var edge = "right";
        if (nearWindow(win2.left, win1.right + 1, gap.mid) &&
            overlapVer(win1, win2)) {
            debug("gap to window", edge, caption(client2), geometry(client2));
            var diff = win2.left - (win1.right + 1);
            // crop left window right edge half gap
            win1.width = win1.width + halfDiffU(diff) - halfGapL();
            // crop right window left edge half gap
            win2.x = win2.x - halfDiffL(diff) + halfGapU();
            win2.width = win2.width + halfDiffL(diff) - halfGapU();
            debug("new geo win1", geometry(win1));
            debug("new geo win2", geometry(win2));
        }

        // top window
        var edge = "top";
        if (nearWindow(win1.top, win2.bottom + 1, gap.mid) &&
            overlapHor(win1, win2)) {
            debug("gap to window", edge, caption(client2), geometry(client2));
             var diff = win1.top - win2.bottom;
            // crop bottom window top edge half gap
            win1.y = win1.y - halfDiffL(diff) + halfGapU();
            win1.height = win1.height + halfDiffL(diff) - halfGapU();
            // crop top window bottom edge half gap
            win2.height = win2.height + halfDiffU(diff) - halfGapL();
            debug("new geo win1", geometry(win1));
            debug("new geo win2", geometry(win2));
        }

        // bottom window
        var edge = "bottom";
        if (nearWindow(win2.top, win1.bottom + 1, gap.mid) &&
            overlapHor(win1, win2)) {
            debug("gap to window", edge, caption(client2), geometry(client2));
            var diff = win2.top - (win1.bottom + 1);
            // crop top window bottom edge half gap
            win1.height = win1.height + halfDiffU(diff) - halfGapL();
            // crop bottom window top edge half gap
            win2.y = win2.y - halfDiffL(diff) + halfGapU();
            win2.height = win2.height + halfDiffL(diff) - halfGapU();
            debug("new geo win1", geometry(win1));
            debug("new geo win2", geometry(win2));
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
        x: clientArea.x + offset.left,
        y: clientArea.y + offset.top,
        width: clientArea.width - offset.left - offset.right,
        height: clientArea.height - offset.top - offset.bottom,
        left: clientArea.x + offset.left,
        right: clientArea.x + clientArea.width - offset.right - 1,
        top: clientArea.y + offset.top,
        bottom: clientArea.y + clientArea.height - offset.bottom - 1,
    };
}

// anchor coordinates without and with gaps
function getGrid(client) {
    var area = getArea(client);
    return {
        left: {
            fullLeft: {
                closed: Math.round(area.left),
                gapped: Math.round(area.left + gap.left)
            },
            quarterLeft: {
                closed: Math.round(area.left + 1 * (area.width / 4)),
                gapped: Math.round(area.left + 1 * (area.width + gap.left - gap.right + gap.mid) / 4)
            },
            halfHorizontal: {
                closed: Math.round(area.left + area.width / 2),
                gapped: Math.round(area.left + (area.width + gap.left - gap.right + gap.mid) / 2)
            },
            quarterRight: {
                closed: Math.round(area.left + 3 * (area.width / 4)),
                gapped: Math.round(area.left + 3 * (area.width + gap.left - gap.right + gap.mid) / 4)
            }
        },
        right: {
                quarterLeft: {
                    closed: Math.round(area.right + 1 - 3 * (area.width / 4)),
                    gapped: Math.round(area.right + 1 - 3 * (area.width + gap.left - gap.right + gap.mid) / 4)
                },
                halfHorizontal: {
                    closed: Math.round(area.right + 1 - area.width / 2),
                    gapped: Math.round(area.right + 1 - (area.width + gap.left - gap.right + gap.mid) / 2)
                },
                quarterRight: {
                    closed: Math.round(area.right + 1 - 1 * (area.width / 4)),
                    gapped: Math.round(area.right + 1 - 1 * (area.width + gap.left - gap.right + gap.mid) / 4)
                },
                fullRight: {
                    closed: Math.round(area.right + 1),
                    gapped: Math.round(area.right + 1 - gap.right)
                }
        },
        top: {
            fullTop: {
                closed: Math.round(area.top),
                gapped: Math.round(area.top + gap.top)
            },
            quarterTop: {
                closed: Math.round(area.top + 1 * (area.height / 4)),
                gapped: Math.round(area.top + 1 * (area.height + gap.top - gap.bottom + gap.mid) / 4)
            },
            halfVertical: {
                closed: Math.round(area.top + area.height / 2),
                gapped: Math.round(area.top + (area.height + gap.top - gap.bottom + gap.mid) / 2)
            },
            quarterBottom: {
                closed: Math.round(area.top + 3 * (area.height / 4)),
                gapped: Math.round(area.top + 3 * (area.height + gap.top - gap.bottom + gap.mid) / 4)
            }
        },
        bottom: {
            quarterTop: {
                closed: Math.round(area.bottom + 1 - 3 * (area.height / 4)),
                gapped: Math.round(area.bottom + 1 - 3 * (area.height + gap.top - gap.bottom + gap.mid) / 4)
            },
            halfVertical: {
                closed: Math.round(area.bottom + 1 - area.height / 2),
                gapped: Math.round(area.bottom + 1 - (area.height + gap.top - gap.bottom + gap.mid) / 2)
            },
            quarterBottom: {
                closed: Math.round(area.bottom + 1 - 1 * (area.height / 4)),
                gapped: Math.round(area.bottom + 1 - 1 * (area.height + gap.top - gap.bottom + gap.mid) / 4)
            },
            fullBottom: {
                closed: Math.round(area.bottom + 1),
                gapped: Math.round(area.bottom + 1 - gap.bottom)
            }
        }
    };
}

///////////////////////
// geometry computation
///////////////////////

// a coordinate is close to another iff
// the difference is within the tolerance margin but non-zero
function nearArea(actual, expected, gap) {
    var tolerance = 2 * gap;
    return (Math.abs(actual - expected.closed) <= tolerance
         || Math.abs(actual - expected.gapped) <= tolerance)
        && actual != expected.gapped;
}

function nearWindow(win1, win2, gap) {
    var tolerance = 2 * gap;
    return Math.abs(win1 - win2) <= tolerance
        && win1 - win2 != gap;
}

// horizontal/vertical overlap

function overlapHor(win1, win2) {
    var tolerance = 2 * gap.mid;
    return (win1.left <= win2.left + tolerance
            && win1.right > win2.left + tolerance)
        || (win2.left <= win1.left + tolerance
            && win2.right + tolerance > win1.left);
}

function overlapVer(win1, win2) {
    var tolerance = 2 * gap.mid;
    return (win1.top <= win2.top + tolerance
            && win1.bottom > win2.top + tolerance)
        || (win2.top <= win1.top + tolerance
            && win2.bottom + tolerance > win1.top);
}

// floored/ceiled half difference between edges

function halfDiffL(diff) {
    return Math.floor(diff / 2);
}

function halfDiffU(diff) {
    return Math.ceil(diff / 2);
}

// floored/ceiled half gap mid size

function halfGapL() {
    return Math.floor(gap.mid / 2);
}

function halfGapU() {
    return Math.ceil(gap.mid / 2);
}


///////////////////////
// ignored clients
///////////////////////

// filter out irrelevant clients
function ignoreClient(client) {
    return !client // null
        || !client.normalWindow // non-normal window
        || !client.resizeable // not resizeable
        || client.move || client.resize // still undergoing geometry change
        || client.fullScreen // fullscreen
        || (!config.includeMaximized // maximized
            && client.geometry ==
               workspace.clientArea(KWin.MaximizeArea, client))
        || (config.excludeMode // excluded application
            && config.excludedApps.includes(String(client.resourceClass)))
        || (config.includeMode // non-included application
            && !(config.includedApps.includes(String(client.resourceClass))));
}

function ignoreOther(client1, client2) {
    return ignoreClient(client2) // excluded
        || client2 == client1 // identical
        || !(client2.desktop == client1.desktop // same desktop
            || client2.onAllDesktops || client1.onAllDesktops)
        || !(client2.screen == client1.screen) // different screen
        || client2.minimized; // minimized
}


///////////////////////
// helpers
///////////////////////

// stringify client object
function properties(client) {
    return JSON.stringify(client, undefined, 2);
}

// stringify client caption
function caption(client) {
    return client ? client.caption : client;
}

// stringify client geometry
function geometry(client) {
    return ["x", client.x, client.width, client.x + client.width,
            "y", client.y, client.height, client.y + client.height].
           join(" ");
}
