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
debug("gap size", config.gapScreen, config.gapWindow);


///////////////////////
// setup
///////////////////////

// add to watchlist when client is initially present or added
const clients = workspace.clientList();
for (var i = 0; i < clients.length; i++) {
    onAdded(clients[i]);
}
workspace.clientAdded.connect(onAdded);

// trigger tile gaps when client is added, moved or resized
function onAdded(client) {
    workspace.clientAdded.connect(tileGaps);
    client.geometryChanged.connect(tileGaps);
    client.clientGeometryChanged.connect(tileGaps);
    client.frameGeometryChanged.connect(tileGaps);
    client.clientFinishUserMovedResized.connect(tileGaps);
    client.moveResizedChanged(tileGaps);
}

///////////////////////
// tile gaps
///////////////////////

// make tile gaps
function tileGaps(win) {
    // if no window is provided, default to active window
    if (win == null) {
        win = workspace.activeClient;
    }
    // don't act on non-normal windows, fullscreen windows or windows that are still undergoing geometry change
    if (win == undefined || win == null || !win.normalWindow || win.fullscreen || win.move || win.resize) {
        return;
    }
    debug("gap", win.caption, win.x, win.y, win.width, win.height);

    // get client area for current window
    const area = workspace.clientArea(win, win.screen, win.desktop);
    debug("area", win.caption, win.x, win.y, win.width, win.height);

    // check if window already has the right geometry in order to prevent infinite reshaping
    if ((  win.x == area.x + config.gapScreen // left edge is left
        || win.x == area.x + 0.5 * area.width + 0.5 * config.gapWindow // left edge is half
        || win.x + 0.5 * win.width == area.x + 0.5 * area.width) // center is center
     && (  win.y == area.y + config.gapScreen // top edge is top
        || win.y == area.y + 0.5 * area.height + 0.5 * config.gapWindow) // top edge is half
     && (   win.width == 0.5 * area.width - config.gapScreen - 0.5 * config.gapWindow // width is half
         || win.width == 0.5 * area.width) // width is half without gaps
     && (  win.height == area.height - 2 * config.gapScreen // height is full
        || win.height == 0.5 * area.height - config.gapScreen - 0.5 * config.gapWindow) // height is half
       ) {
           debug("gapped");
       return;
   }

   // for each possible tile, check whether the window is currently approximately tiled there and if yes, adapt

   // left half
   if (near(win.x, area.x)
    && near(win.y, area.y)
    && near(win.width, 0.5 * area.width)
    && near(win.height, area.height)) {
        win.geometry = {
            x: area.x + config.gapScreen,
            y: area.y + config.gapScreen,
            width: 0.5 * area.width - config.gapScreen - 0.5 * config.gapWindow,
            height: area.height - 2 * config.gapScreen
        };
        return;
    }

    // center half
    if (near(win.x + 0.5 * win.width, area.x + 0.5 * area.width)
     && near(win.y, area.y)
     && near(win.width, 0.5 * area.width)
     && near(win.height, area.height)) {
         win.geometry = {
             x: area.x + 0.25 * area.width,
             y: area.y + config.gapScreen,
             width: 0.5 * area.width,
             height: area.height - 2 * config.gapScreen
         };
         return;
     }

    // right half
    if (near(win.x, area.x + 0.5 * area.width)
     && near(win.y, area.y)
     && near(win.width, 0.5 * area.width)
     && near(win.height, area.height)) {
         win.geometry = {
             x: area.x + 0.5 * area.width + 0.5 * config.gapWindow,
             y: area.y + config.gapScreen,
             width: 0.5 * area.width - config.gapScreen - 0.5 * config.gapWindow,
             height: area.height - 2 * config.gapScreen
         };
         return;
     }

     // top left quarter
     if (near(win.x, area.x)
      && near(win.y, area.y)
      && near(win.width, 0.5 * area.width)
      && near(win.height, 0.5 * area.height)) {
          win.geometry = {
              x: area.x + config.gapScreen,
              y: area.y + config.gapScreen,
              width: 0.5 * area.width - config.gapScreen -0.5 * config.gapWindow,
              height: 0.5 * area.height - config.gapScreen - 0.5 * config.gapWindow
          };
          return;
      }

      // top right quarter
      if (near(win.x, area.x + 0.5 * area.width)
       && near(win.y, area.y)
       && near(win.width, 0.5 * area.width)
       && near(win.height, 0.5 * area.height)) {
           win.geometry = {
               x: area.x + 0.5 * area.width + 0.5 * config.gapWindow,
               y: area.y + config.gapScreen,
               width: 0.5 * area.width - config.gapScreen - 0.5 * config.gapWindow,
               height: 0.5 * area.height - config.gapScreen - 0.5 * config.gapWindow
           };
           return;
       }

       // center quarter
       if (near(win.x + 0.5 * win.width, area.x + 0.5 * area.width)
        && near(win.y + 0.5 * win.height, area.y + 0.5 * area.height)
        && near(win.width, 0.5 * area.width)
        && near(win.height, area.height)) {
            win.geometry = {
                x: area.x + 0.25 * area.width,
                y: area.y + 0.25 * area.height,
                width: 0.5 * area.width,
                height: area.height
            };
            return;
        }

       // bottom left quarter
       if (near(win.x, area.x)
        && near(win.y, area.y + 0.5 * area.height)
        && near(win.width, 0.5 * area.width)
        && near(win.height, 0.5 * area.height)) {
            win.geometry = {
                x: area.x + config.gapScreen,
                y: area.y + 0.5 * area.height + 0.5 * config.gapWindow,
                width: 0.5 * area.width - config.gapScreen - 0.5 * config.gapWindow,
                height: 0.5 * area.height - config.gapScreen - 0.5 * config.gapWindow
            };
            return;
        }

        // bottom right quarter
        if (near(win.x, area.x + 0.5 * area.width)
         && near(win.y, area.y + 0.5 * area.height)
         && near(win.width, 0.5 * area.width)
         && near(win.height, 0.5 * area.height)) {
             win.geometry = {
                 x: area.x + 0.5 * area.width + 0.5 * config.gapWindow,
                 y: area.y + 0.5 * area.height + 0.5 * config.gapWindow,
                 width: 0.5 * area.width - config.gapScreen - 0.5 * config.gapWindow,
                 height: 0.5 * area.height - config.gapScreen - 0.5 * config.gapWindow
             };
             return;
         }
}

///////////////////////
// helper functions
///////////////////////

// divergence margin within which to consider windows tiled
const tolerance = 2 * Math.max(config.gapScreen, config.gapWindow);

function near(actual, expected) {
    return actual - expected <= tolerance && actual - expected >= - tolerance;
}
