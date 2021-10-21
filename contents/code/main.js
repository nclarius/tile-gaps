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
    debug("area", area.x, area.y, area.width, area.height);

    // get tile coordinates without gaps
    gridF = {
        // x
        left: area.x,
        halfHor: area.x + area.width/4,
        right: area.x + area.width/2,
        // y
        top: area.y,
        halfVert: area.y + area.height/4,
        bottom: area.y + area.height/2,
        // width
        fullWidth: area.width,
        halfWidth: area.width/2,
        // height
        fullHeight: area.height,
        halfHeight: area.height/2
    };

    // get tile coordinates with gaps
    gridG = {
        // x
        left: gridF.left + config.gapScreen,
        halfHor: gridF.halfHor - (config.gapScreen - config.gapWindow/2)/2,
        right: gridF.right + config.gapWindow/2,
        // y
        top: gridF.top + config.gapScreen,
        halfVert: gridF.halfVert - (config.gapScreen - config.gapWindow/2)/2,
        bottom: gridF.bottom + config.gapWindow/2,
        // width
        fullWidth: gridF.fullWidth - config.gapScreen*2,
        halfWidth: gridF.halfWidth - config.gapScreen - config.gapWindow/2,
        // height
        fullHeight: gridF.fullHeight - config.gapScreen*2,
        halfHeight: gridF.halfHeight - config.gapScreen - config.gapWindow/2
    };

    // check if window already has the right geometry in order to prevent infinite reshaping
    if ((win.x == gridG.left || win.x == gridG.halfHor || win.x == gridG.right)
     && (win.y == gridG.top || win.y == gridG.halfVert || win.y == gridG.bottom)
     && (win.width == gridG.fullWidth || win.width == gridG.halfWidth)
     && (win.height == gridG.fullHeight || win.height == gridG.halfHeight)) {
         debug("gapped");
         return;
     }

   // for each possible tile, check whether the window is currently approximately tiled there and if yes, adapt

   // left half
   if (near(win.x, gridF.left)
    && near(win.y, gridF.top)
    && near(win.width, gridF.halfWidth)
    && near(win.height, gridF.fullHeight)) {
        debug("gap left");
        win.geometry = {
            x: gridG.left,
            y: gridG.top,
            width: gridG.halfWidth,
            height: gridG.fullHeight
        };
        return;
    }

    // horizontal center half
    if (near(win.x, gridF.halfHor)
     && near(win.y, gridF.top)
     && near(win.width, gridF.halfWidth)
     && near(win.height, gridF.fullHeight)) {
         debug("gap center horizontal");
         win.geometry = {
             x: gridG.halfHor,
             y: gridG.top,
             width: gridG.halfWidth,
             height: gridG.fullHeight
         };
         return;
     }

    // right half
    if (near(win.x, gridF.right)
     && near(win.y, gridF.top)
     && near(win.width, gridF.halfWidth)
     && near(win.height, gridF.fullHeight)) {
         debug("gap right");
         win.geometry = {
             x: gridG.right,
             y: gridG.top,
             width: gridG.halfWidth,
             height: gridG.fullHeight
         };
         return;
     }

     // top half
     if (near(win.x, gridF.left)
      && near(win.y, gridF.top)
      && near(win.width, gridF.fullWidth)
      && near(win.height, gridF.halfHeight)) {
          debug("gap top");
          win.geometry = {
              x: gridG.left,
              y: gridG.top,
              width: gridG.fullWidth,
              height: gridG.halfHeight
          };
          return;
      }

      // vertical center half
      if (near(win.x, gridF.left)
       && near(win.y, gridF.halfVert)
       && near(win.width, gridF.fullWidth)
       && near(win.height, gridF.halfHeight)) {
           debug("gap center vertical");
           win.geometry = {
               x: gridG.left,
               y: gridG.halfVert,
               width: gridG.fullWidth,
               height: gridG.halfHeight
           };
           return;
       }

       // bottom half
       if (near(win.x, gridF.left)
        && near(win.y, gridF.bottom)
        && near(win.width, gridF.fullWidth)
        && near(win.height, gridF.halfHeight)) {
            debug("gap bottom");
            win.geometry = {
                x: gridG.left,
                y: gridG.bottom,
                width: gridG.fullWidth,
                height: gridG.halfHeight
            };
            return;
        }

     // top left quarter
     if (near(win.x, gridF.left)
      && near(win.y, gridF.top)
      && near(win.width, gridF.halfWidth)
      && near(win.height, gridF.halfHeight)) {
          debug("gap top left");
          win.geometry = {
              x: gridG.left,
              y: gridG.top,
              width: gridG.halfWidth,
              height: gridG.halfHeight
          };
          return;
      }

      // top right quarter
      if (near(win.x, gridF.right)
       && near(win.y, gridF.top)
       && near(win.width, gridF.halfWidth)
       && near(win.height, gridF.halfHeight)) {
           debug("gap top right");
           win.geometry = {
               x: gridG.right,
               y: gridG.top,
               width: gridG.halfWidth,
               height: gridG.halfHeight
           };
           return;
       }

       // center quarter
       if (near(win.x, gridF.halfHor)
        && near(win.y, gridF.halfVert)
        && near(win.width, gridF.halfWidth)
        && near(win.height, gridF.halfHeight)) {
            debug("gap center quarter");
            win.geometry = {
                x: gridG.halfHor,
                y: gridG.halfVert,
                width: gridG.halfWidth,
                height: area.halfHeight
            };
            return;
        }

       // bottom left quarter
       if (near(win.x, gridF.left)
        && near(win.y, gridF.bottom)
        && near(win.width, gridF.halfWidth)
        && near(win.height, gridF.halfHeight)) {
            debug("gap bottom left");
            win.geometry = {
                x: gridG.left,
                y: gridG.bottom,
                width: gridG.halfWidth,
                height: gridG.halfHeight
            };
            return;
        }

        // bottom right quarter
        if (near(win.x, gridF.right)
         && near(win.y, gridF.bottom)
         && near(win.width, gridF.halfWidth)
         && near(win.height, gridF.halfHeight)) {
             debug("gap bottom right");
             win.geometry = {
                 x: gridG.right,
                 y: gridG.bottom,
                 width: gridG.halfWidth,
                 height: gridG.halfHeight
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
