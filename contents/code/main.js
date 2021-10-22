/*
KWin Script Tile Gaps
(C) 2021 Natalie Clarius <natalie_clarius@yahoo.de>
GNU General Public License v3.0
*/


///////////////////////
// configuration
///////////////////////

const config = {
    // desired size of the gap between a window and the top/left/right/bottom screen edge
    gapScreen: readConfig("gapScreen", 12),

    // desired size of the gap between two adjacent windows
    gapWindow: readConfig("gapWindow", 12)
};


///////////////////////
// initialization
///////////////////////

debugMode = true;
function debug(...args) {if (debugMode) {console.debug(...args);}}
debug("intializing tile gaps");
debug("tile gap settings:", "gap size screen:", config.gapScreen, "gap size window:", config.gapWindow);


///////////////////////
// set up triggers
///////////////////////

// add to watchlist when client is initially present or added
const clients = workspace.clientList();
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
    client.moveResizedChanged.connect(tileGaps);
}


///////////////////////
// get area geometry
///////////////////////

// client area
function getArea(client) {
    return workspace.clientArea(client, client.screen, client.desktop);
}

// anchor coordinates with gaps
function getGrid(client) {
    var area = getArea(client);
    return {
        // x
        left: area.x + config.gapScreen,
        midH: area.x + area.width/4 + (config.gapScreen + config.gapWindow/2)/2,
        right: area.x + area.width/2 + config.gapWindow/2,
        // y
        top: area.y + config.gapScreen,
        midV: area.y + area.height/4 + (config.gapScreen + config.gapWindow/2)/2,
        bottom: area.y + area.height/2 + config.gapWindow/2,
        // width
        fullWidth: area.width - config.gapScreen - config.gapScreen,
        halfWidth: area.width/2 - config.gapScreen - config.gapWindow/2,
        // height
        fullHeight: area.height - config.gapScreen - config.gapScreen,
        halfHeight: area.height/2 - config.gapScreen - config.gapWindow/2
    };
}

// coordinates for each tile
function getTiles(client) {
    var grid = getGrid(client);
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
    };
}

// window is considered tiled iff the difference on all coordinates between actual and expected geometry is within the tolerated divergence margin
const tolerance = 2 * Math.max(config.gapScreen, config.gapWindow);
function near(actual, expected) {
    return Object.keys(expected).every(coord =>
        actual[coord] - expected[coord] >= -tolerance
     && actual[coord] - expected[coord] <=  tolerance);
}


///////////////////////
// make tile gaps
///////////////////////

// make tile gaps for given window
function tileGaps(win) {
    // get window to be gapped
    // if no window is provided, default to active window
    if (win == null) {
        win = workspace.activeClient;
    }
    // don't act on non-normal windows, fullscreen windows or windows that are still undergoing geometry change
    if (win == undefined || win == null || !win.normalWindow || win.fullscreen || win.move || win.resize) {
        return;
    }
    debug("gaps for", win.caption);
    debug("window geometry", ...Object.values(win.geometry));

    // iterate possible tile positions
    var tiles = getTiles(win);
    for (var i = 0; i < Object.keys(tiles).length; i++) {
        var tile = {label: Object.keys(tiles)[i]}; // position label
        tile.geometry = tiles[tile.label]; // geometry (with gaps)

        // check if the window is approximately tiled there
        if (near(win.geometry, tile.geometry)) {
            // window is tiled: apply gapped geometry
            debug("gapping", tile.label, ...Object.values(tile.geometry), "\n");
            win.geometry = tile.geometry;
            return;
        }
    }
    // window's geometry doesn't approximately match any possible tile: don't gap
    debug("not tiled\n");
 }
