/*
KWin Script Tile Gaps
(C) 2021 Natalie Clarius <natalie_clarius@yahoo.de>
GNU General Public License v3.0
*/

///////////////////////
// debug mode
///////////////////////
debugMode = true;
function debug(...args) {if (debugMode) {console.debug(...args);}}


///////////////////////
// configuration
///////////////////////

const config = {
    // desired size of the gap between a window and the top/left/right/bottom screen edge
    gapScreen: readConfig("gapScreen", 12),

    // desired size of the gap between two adjacent windows
    gapWindow: readConfig("gapWindow", 12)
};
debug("tile gaps", "sizes", config.gapScreen, config.gapWindow);


///////////////////////
// get area geometry
///////////////////////

const clients = workspace.clientList();

// set geometry for all screens initially and whenever screen setup changes
const areas = {};
const grids = {};
const tiless = {};
updateGeometry();
workspace.numberScreensChanged.connect(updateGeometry);
workspace.screenResized.connect(updateGeometry);
function updateGeometry() {
    // find desktop background for each screen
    for (var i = 0; i < clients.length; i++) {
        client = clients[i];
        if (client.desktopWindow) {
            screenNr = client.screen;
            // update area, grid and tiles for screen
            areas[screenNr] = getArea(client);
            grids[screenNr] = getGrid(client);
            tiless[screenNr] = getTiles(client);
        }
    }
}

// get client area
function getArea(client) {
    return workspace.clientArea(client, client.screen, client.desktop);
}

// grid coordinates without and with gaps
function getGrid(client) {
    const area = areas[client.screen];
    return {
        // x
        left: {
            closed: area.x,
            gapped: area.x + config.gapScreen
        },
        midH: {
            closed: area.x + area.width/4,
            gapped: area.x + (config.gapScreen - config.gapWindow/2)/2
        },
        right: {
            closed: area.x + area.width/2,
            gapped: area.x + area.width/2 + config.gapWindow/2
        },
        // y
        top: {
            closed: area.y,
            gapped: area.y + config.gapScreen
        },
        midV: {
            closed: area.y + area.height/4,
            gapped: area.y + (config.gapScreen - config.gapWindow/2)/2
        },
        bottom: {
            closed: area.y + area.height/2,
            gapped: area.y + area.height/2 + config.gapWindow/2
        },
        // width
        fullWidth: {
            closed: area.width,
            gapped: area.width - config.gapScreen*2
        },
        halfWidth: {
            closed: area.width/2,
            gapped: area.width/2 - config.gapScreen - config.gapWindow/2
        },
        // height
        fullHeight: {
            closed: area.height,
            gapped: area.height - config.gapScreen*2
        },
        halfHeight: {
            closed: area.height/2,
            gapped: area.height/2 - config.gapScreen - config.gapWindow/2
        }
    }
}

// tile coordinates
function getTiles(screenNr) {
    const area = areas[client.screen];
    const grid = grids[client.screen];
    return {
        halfLeft: {
            x: grid.left,
            y: grid.top,
            width: grid.halfWidth,
            height: grid.fullHeight
        },
        halfHCenter: {
            x: grid.midH,
            y: grid.top,
            width: grid.halfWidth,
            height: grid.fullHeight
        },
        halfRight: {
            x: grid.right,
            y: grid.top,
            width: grid.halfWidth,
            height: grid.fullHeight
        },
        halfTop: {
            x: grid.left,
            y: grid.top,
            width: grid.fullWidth,
            height: grid.halfHeight
        },
        halfVCenter: {
            x: grid.left,
            y: grid.midV,
            width: grid.fullWidth,
            height: grid.halfHeight
        },
        halfBottom: {
            x: grid.left,
            y: grid.bottom,
            width: grid.fullWidth,
            height: grid.halfHeight
        },
        quarterLeftTop: {
            x: grid.left,
            y: grid.top,
            width: grid.halfWidth,
            height: grid.halfHeight
        },
        quarterCenterTop: {
            x: grid.midH,
            y: grid.top,
            width: grid.halfWidth,
            height: grid.halfHeight
        },
        quarterRightTop: {
            x: grid.right,
            y: grid.top,
            width: grid.halfWidth,
            height: grid.halfHeight
        },
        quarterLeftCenter: {
            x: grid.left,
            y: grid.midV,
            width: grid.halfWidth,
            height: grid.halfHeight
        },
        quarterCenterCenter: {
            x: grid.midH,
            y: grid.midV,
            width: grid.halfWidth,
            height: grid.halfHeight
        },
        quarterRightCenter: {
            x: grid.right,
            y: grid.midV,
            width: grid.halfWidth,
            height: grid.halfHeight
        },
        quarterLeftBottom: {
            x: grid.left,
            y: grid.bottom,
            width: grid.halfWidth,
            height: grid.halfHeight
        },
        quarterCenterBottom: {
            x: grid.midH,
            y: grid.bottom,
            width: grid.halfWidth,
            height: grid.halfHeight
        },
        quarterRightBottom: {
            x: grid.right,
            y: grid.bottom,
            width: grid.halfWidth,
            height: grid.halfHeight
        }
    }
}

///////////////////////
// triggers
///////////////////////

// add to watchlist when client is initially present or added
for (var i = 0; i < clients.length; i++) {
    onAdded(clients[i]);
}
workspace.clientAdded.connect(onAdded);

// trigger tile gap when client is added, moved or resized
function onAdded(client) {
    workspace.clientAdded.connect(tileGaps);
    client.geometryChanged.connect(tileGaps);
    client.clientGeometryChanged.connect(tileGaps);
    client.frameGeometryChanged.connect(tileGaps);
    client.clientFinishUserMovedResized.connect(tileGaps);
    client.moveResizedChanged(tileGaps);
}

///////////////////////
// create tile gaps
///////////////////////

function tileGaps(win) {
    // if no window is provided, default to active window
    if (win == null) {
        win = workspace.activeClient;
    }
    // don't act on non-normal windows, fullscreen windows or windows that are still undergoing geometry change
    if (win == undefined || win == null || !win.normalWindow || win.fullscreen || win.move || win.resize) {
        return;
    }
    debug("gap for", win.caption, win.x, win.y, win.width, win.height);

    // iterate possible tiles
    tiles = tiless[win.screen];
    for (var i = 0; i < Object.keys(tiles).length; i++) {
        // get coordinates for current possible tile
        tile = Object.keys(tiles)[i];
        coords = tiles[tile];
        const closedGeometry = {x: coords.x.closed, y: coords.y.closed, width: coords.width.closed, height: coords.height.closed};
        const gappedGeometry = {x: coords.x.gapped, y: coords.y.gapped, width: coords.width.gapped, height: coords.height.gapped};
        // check whether the window is approximately tiled there
        if (near(win.geometry, closedGeometry)) {
            debug(win.geometry, JSON.stringify(closedGeometry));
            // if the window already has the right geometry, abort in order to prevent infinite reshaping
            if (win.geometry == gappedGeometry) {
                debug("gapped", tile, win.caption);
                return;
            }
            // else: apply gapped geometry
            else {
                debug("gapping", tile, win.caption);
                win.geometry = gappedGeometry;
                return;
            }
        }
    }
    debug("");
 }

///////////////////////
// helper functions
///////////////////////

// divergence margin within which to consider windows tiled
const tolerance = 2 * Math.max(config.gapScreen, config.gapWindow);
// actual geometry is near expected geometry iff for all coordinates, the difference between actual and expected is within tolerance
function near(actualGeometry, expectedGeometry) {
    for (var i = 0; i < Object.keys(expectedGeometry).length; i++) {
        coord = Object.keys(expectedGeometry)[i];
        actual = actualGeometry[coord];
        expected = expectedGeometry[coord];
        if (!(actual - expected <= tolerance
           && actual - expected >= -tolerance)) {
            return false;
        };
    }
    return true;
}
