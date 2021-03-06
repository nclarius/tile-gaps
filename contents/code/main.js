/*
KWin Script Window Gaps
(C) 2021-2022 Natalie Clarius <natalie_clarius@yahoo.de>
GNU General Public License v3.0
*/


///////////////////////
// configuration
///////////////////////
const gap = {
    // size of gap to screen edges
    left: readConfig("gapLeft", 8),
    right: readConfig("gapRight", 8),
    top: readConfig("gapTop", 8),
    bottom: readConfig("gapBottom", 8),
    // size of gap between windows
    mid: readConfig("gapMid", 8)
};

const panel = {
    // presence of panels on screen edges
    left: readConfig("panelLeft", false),
    right: readConfig("panelRight", false),
    top: readConfig("panelTop", false),
    bottom: readConfig("panelBottom", false),
};

const config = {
    // layouts to apply gaps to
    includeMaximized: readConfig("includeMaximized", false),
    // list of excluded/included applications
    excludeMode: readConfig("excludeMode", true),
    includeMode: readConfig("includeMode", false),
    applications: readConfig("applications", "").toLowerCase().split("\n")
};


///////////////////////
// initialization
///////////////////////

const debugMode = readConfig("debugMode", true);
const fullDebugMode = readConfig("fullDebugMode", false);

function debug(...args) {
    if (debugMode) console.debug("tilegaps:", ...args);
}

function fulldebug(...args) {
    if (fullDebugMode) {
        console.debug("tilegaps:", ...args);
    }
}
debug("intializing");
debug("sizes (l/r/t/b/m):",
    gap.left, gap.right, gap.top, gap.bottom, gap.mid);
debug("panels (l/r/t/b):",
    panel.left, panel.right, panel.top, panel.bottom);
debug("layout:",
    "maximized:", config.includeMaximized);
debug("applications:",
    config.excludeMode ? "exclude" : "include", String(config.applications));
debug("");


///////////////////////
// set up triggers
///////////////////////

// block reapplying until current iteration is finished
var block = false;

// trigger debug output when client is activated
workspace.clientActivated.connect(client => {
    if (!client) return;
    // debug(caption(client), geometry(client));
});

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
    client.moveResizedChanged.connect((client) => {
        debug("move resized changed", caption(client));
        applyGaps(client);
    });
    client.clientGeometryChanged.connect((client) => {
        debug("client geometry changed", caption(client));
        applyGaps(client);
    });
    client.frameGeometryChanged.connect((client) => {
        debug("frame geometry changed", caption(client));
        applyGaps(client)
    });
    client.clientFinishUserMovedResized.connect((client) => {
        debug("finish user moved resized", caption(client));
        applyGaps(client);
    });
    client.fullScreenChanged.connect((client) => {
        debug("fullscreen changed", caption(client));
        applyGaps(client);
    });
    client.clientMaximizedStateChanged.connect((client) => {
        debug("maximized changed", caption(client));
        applyGaps(client);
    });
    client.clientUnminimized.connect((client) => {
        debug("unminimized", caption(client));
        applyGaps(client);
    });
    client.screenChanged.connect((client) => {
        debug("screen changed", caption(client));
        applyGaps(client);
    });
    client.desktopChanged.connect((client) => {
        debug("desktop changed", caption(client));
        applyGaps(client);
    });
    client.activitiesChanged.connect((client) => {
        debug("activities changed", caption(client));
        applyGaps(client);
    });
}

// trigger reapplying tile gaps for all windows when screen geometry changes
function applyGapsAll() {
    workspace.clientList().forEach(client => applyGaps(client));
}

onRelayouted();

function onRelayouted() {
    workspace.currentDesktopChanged.connect(() => {
        debug("current desktop changed");
        applyGapsAll();
    });
    workspace.desktopPresenceChanged.connect(() => {
        debug("desktop presence changed");
        applyGapsAll();
    });
    workspace.numberDesktopsChanged.connect(() => {
        debug("number desktops changed");
        applyGapsAll();
    });
    workspace.numberScreensChanged.connect(() => {
        debug("number screens changed");
        applyGapsAll();
    });
    workspace.screenResized.connect(() => {
        debug("screen resized");
        applyGapsAll();
    });
    workspace.currentActivityChanged.connect(() => {
        debug("current activity changed");
        applyGapsAll();
    });
    workspace.activitiesChanged.connect(() => {
        debug("activities changed");
        applyGapsAll();
    });
    workspace.virtualScreenSizeChanged.connect(() => {
        debug("virtual screen size changed");
        applyGapsAll();
    });
    workspace.virtualScreenGeometryChanged.connect(() => {
        debug("virtual screen geometry changed");
        applyGapsAll();
    });
    workspace.clientAdded.connect((client) => {
        if (client.dock) {
            debug("dock added");
            applyGapsAll();
        }
    });
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
    let area = getArea(client);
    debug("area", geometry(area));
    let grid = getGrid(client);
    let win = client.geometry;
    let edge = "";
    let unmaximized = !maximized(client);

    // for each window edge, if the edge is near some grid anchor of that edge,
    // set it to the gapped coordinate

    // left edge
    edge = "left";
    for (let i = 0; i < Object.keys(grid[edge]).length; i++) {
        let pos = Object.keys(grid[edge])[i];
        let coords = grid[edge][pos];
        if (nearArea(win[edge], coords.closed, coords.gapped, gap[edge])) {
            debug("gap to edge", edge, pos, coords.gapped);
            let diff = coords.gapped - win[edge];
            win.width -= diff;
            win.x += diff;
            debug("new geo", geometry(win));
            break;
        }
    }

    // right edge
    edge = "right";
    for (let i = 0; i < Object.keys(grid[edge]).length; i++) {
        let pos = Object.keys(grid[edge])[i];
        let coords = grid[edge][pos];
        if (nearArea(win[edge], coords.closed, coords.gapped, gap[edge])) {
            debug("gap to edge", edge, pos, coords.gapped);
            let diff = coords.gapped - (win[edge] + 1);
            win.width += diff;
            debug("new geo", geometry(win));
            break;
        }
    }


    // top edge
    edge = "top";
    for (let i = 0; i < Object.keys(grid[edge]).length; i++) {
        let pos = Object.keys(grid[edge])[i];
        let coords = grid[edge][pos];
        if (nearArea(win[edge], coords.closed, coords.gapped, gap[edge])) {
            debug("gap to edge", edge, pos, coords.gapped);
            let diff = coords.gapped - win[edge];
            win.height -= diff;
            win.y += diff;
            debug("new geo", geometry(win));
            break;
        }
    }


    // bottom edge
    edge = "bottom";
    for (let i = 0; i < Object.keys(grid[edge]).length; i++) {
        let pos = Object.keys(grid[edge])[i];
        let coords = grid[edge][pos];
        if (nearArea(win[edge], coords.closed, coords.gapped, gap[edge])) {
            debug("gap to edge", edge, pos, coords.gapped);
            let diff = coords.gapped - (win[edge] + 1);
            win.height += diff;
            debug("new geo", geometry(win));
            break;
        }
    }
}

function applyGapsWindows(client1) {

    // for each other window, if they share an edge,
    // clip or extend both evenly to make the distance the size of the gap

    for (let i = 0; i < workspace.clientList().length; i++) {
        let client2 = workspace.clientList()[i];
        if (!client2) continue;
        if (ignoreOther(client1, client2)) continue;

        let win1 = client1.geometry;
        let win2 = client2.geometry;
        let edge = "";

        // left window
        edge = "left";
        if (nearWindow(win1.left, win2.right + 1, gap.mid) &&
            overlapVer(win1, win2)) {
            debug("gap to window", edge, caption(client2), geometry(client2));
            let diff = win1.left - win2.right;
            // crop right window left edge half gap
            win1.x = win1.x - halfDiffL(diff) + halfGapU();
            win1.width = win1.width + halfDiffL(diff) - halfGapU();
            // crop left window right edge half gap
            win2.width = win2.width + halfDiffU(diff) - halfGapL();
            debug("new geo win1", geometry(win1));
            debug("new geo win2", geometry(win2));
        }

        // right window
        edge = "right";
        if (nearWindow(win2.left, win1.right + 1, gap.mid) &&
            overlapVer(win1, win2)) {
            debug("gap to window", edge, caption(client2), geometry(client2));
            let diff = win2.left - (win1.right + 1);
            // crop left window right edge half gap
            win1.width = win1.width + halfDiffU(diff) - halfGapL();
            // crop right window left edge half gap
            win2.x = win2.x - halfDiffL(diff) + halfGapU();
            win2.width = win2.width + halfDiffL(diff) - halfGapU();
            debug("new geo win1", geometry(win1));
            debug("new geo win2", geometry(win2));
        }

        // top window
        edge = "top";
        if (nearWindow(win1.top, win2.bottom + 1, gap.mid) &&
            overlapHor(win1, win2)) {
            debug("gap to window", edge, caption(client2), geometry(client2));
            let diff = win1.top - win2.bottom;
            // crop bottom window top edge half gap
            win1.y = win1.y - halfDiffL(diff) + halfGapU();
            win1.height = win1.height + halfDiffL(diff) - halfGapU();
            // crop top window bottom edge half gap
            win2.height = win2.height + halfDiffU(diff) - halfGapL();
            debug("new geo win1", geometry(win1));
            debug("new geo win2", geometry(win2));
        }

        // bottom window
        edge = "bottom";
        if (nearWindow(win2.top, win1.bottom + 1, gap.mid) &&
            overlapHor(win1, win2)) {
            debug("gap to window", edge, caption(client2), geometry(client2));
            let diff = win2.top - (win1.bottom + 1);
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
    return workspace.clientArea(KWin.MaximizeArea, client);
}

// anchor coordinates without and with gaps
function getGrid(client) {
    let area = getArea(client);
    let unmaximized = !maximized(client);
    return {
        left: {
            fullLeft: {
                closed: Math.round(area.left),
                gapped: Math.round(area.left + gap.left - (panel.left && unmaximized ? gap.left : 0))
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
                gapped: Math.round(area.right + 1 - gap.right + (panel.right && unmaximized ? gap.right : 0))
            }
        },
        top: {
            fullTop: {
                closed: Math.round(area.top),
                gapped: Math.round(area.top + gap.top - (panel.top && unmaximized ? gap.top : 0))
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
                gapped: Math.round(area.bottom + 1 - gap.bottom + (panel.bottom && unmaximized ? gap.bottom : 0))
            }
        }
    };
}

///////////////////////
// geometry computation
///////////////////////

// a client is maximized iff its geometry is equal to the maximize area
function maximized(client) {
    return client.geometry == workspace.clientArea(KWin.MaximizeArea, client);
}

// a coordinate is close to another iff
// the difference is within the tolerance margin but non-zero

function nearArea(actual, expected_closed, expected_gapped, gap) {
    let tolerance = 2 * gap;
    return (Math.abs(actual - expected_closed) <= tolerance
         || Math.abs(actual - expected_gapped) <= tolerance)
        && actual != expected_gapped;
}

function nearWindow(win1, win2, gap) {
    let tolerance = 2 * gap;
    return win1 - win2 <= tolerance
        && win1 - win2 > 0
        && win1 - win2 != gap;
}

// horizontal/vertical overlap

function overlapHor(win1, win2) {
    let tolerance = 2 * gap.mid;
    return (win1.left <= win2.left + tolerance
         && win1.right > win2.left + tolerance)
        || (win2.left <= win1.left + tolerance
        &&  win2.right + tolerance > win1.left);
}

function overlapVer(win1, win2) {
    let tolerance = 2 * gap.mid;
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
        || !client.normalWindow // not normal
        || !client.resizeable // not resizeable
        || client.fullScreen // fullscreen
        || (!config.includeMaximized && maximized(client)) // maximized
        || (config.excludeMode // excluded application
            && config.applications.includes(String(client.resourceClass)))
        || (config.includeMode // non-included application
            && !(config.applications.includes(String(client.resourceClass))));
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
            "y", client.y, client.height, client.y + client.height
    ].join(" ");
}
