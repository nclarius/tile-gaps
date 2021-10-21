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

    // get coordinates for area without gaps
    dimU = {
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

    // get coordinates for area with gaps
    dimG = {
        // x
        left: dimU.left + config.gapScreen,
        halfHor: dimU.halfHor,
        right: dimU.right + config.gapWindow/2,
        // y
        top: dimU.top + config.gapScreen,
        halfVert: dimU.halfVert,
        bottom: dimU.bottom + config.gapWindow/2,
        // width
        fullWidth: dimU.fullWidth - config.gapScreen*2,
        halfWidth: dimU.halfWidth,
        // height
        fullHeight: dimU.fullHeight - config.gapScreen*2,
        halfHeight: dimU.halfHeight
    };

    // check if window already has the right geometry in order to prevent infinite reshaping
    if ((  win.x == area.x + config.gapScreen // left edge is left
        || win.x == area.x + area.width/2 + config.gapWindow/2 // left edge is half
        || win.x == area.x + area.width/4) // left edge is quarter
     && (  win.y == area.y + config.gapScreen // top edge is top
        || win.y == area.y + area.height/2 + config.gapWindow/2 // top edge is half
        || win.y == area.y + area.height/4) // top edge is quarter
     && (  win.width == area.width - config.gapScreen*2 // width is full
         || win.width == area.width/2 - config.gapScreen - config.gapWindow/2 // width is half
         || win.width == area.width/2) // width is half w/o gaps
     && (  win.height == area.height - config.gapScreen*2 // height is full
        || win.height == area.height/2 - config.gapScreen - config.gapWindow/2 // height is half
        || win.height == area.height/2) // height is half w/o gaps
       ) {
           debug("gapped");
       return;
   }

   // for each possible tile, check whether the window is currently approximately tiled there and if yes, adapt

   // left half
   if (near(win.x, area.x)
    && near(win.y, area.y)
    && near(win.width, area.width/2)
    && near(win.height, area.height)) {
        debug("gap left");
        win.geometry = {
            x: area.x + config.gapScreen,
            y: area.y + config.gapScreen,
            width: area.width/2 - config.gapScreen - config.gapWindow/2,
            height: area.height - config.gapScreen*2
        };
        return;
    }

    // horizontal center half
    if (near(win.x, area.y + area.width/4)
     && near(win.y, area.y)
     && near(win.width, area.width/2)
     && near(win.height, area.height)) {
         debug("gap center horizontal");
         win.geometry = {
             x: area.x + area.width/4,
             y: area.y + config.gapScreen,
             width: area.width/2,
             height: area.height - config.gapScreen*2
         };
         return;
     }

    // right half
    if (near(win.x, area.x + area.width/2)
     && near(win.y, area.y)
     && near(win.width, area.width/2)
     && near(win.height, area.height)) {
         debug("gap right");
         win.geometry = {
             x: area.x + area.width/2 + config.gapWindow/2,
             y: area.y + config.gapScreen,
             width: area.width/2 - config.gapScreen - config.gapWindow/2,
             height: area.height - config.gapScreen*2
         };
         return;
     }

     // top half
     if (near(win.x, area.x)
      && near(win.y, area.y)
      && near(win.width, area.width)
      && near(win.height, area.height/2)) {
          debug("gap top");
          win.geometry = {
              x: area.x + config.gapScreen,
              y: area.y + config.gapScreen,
              width: area.width - config.gapScreen*2,
              height: area.height/2 - config.gapScreen - config.gapWindow/2
          };
          return;
      }

      // vertical center half
      if (near(win.x, area.x)
       && near(win.y, area.y)
       && near(win.width, area.width)
       && near(win.height, area.height/2)) {
           debug("gap center vertical");
           win.geometry = {
               x: area.x + config.gapScreen,
               y: area.y + area.height/4,
               width: area.width - config.gapScreen*2,
               height: area.height/2
           };
           return;
       }

       // bottom half
       if (near(win.x, area.x)
        && near(win.y, area.y + area.height/2)
        && near(win.width, area.width)
        && near(win.height, area.height/2)) {
            debug("gap bottom");
            win.geometry = {
                x: area.x + config.gapScreen,
                y: area.y + area.height/2 + config.gapWindow/2,
                width: area.width - config.gapScreen*2,
                height: area.height/2 - config.gapScreen - config.gapWindow/2
            };
            return;
        }

     // top left quarter
     if (near(win.x, area.x)
      && near(win.y, area.y)
      && near(win.width, area.width/2)
      && near(win.height, area.height/2)) {
          debug("gap top left");
          win.geometry = {
              x: area.x + config.gapScreen,
              y: area.y + config.gapScreen,
              width: area.width/2 - config.gapScreen -config.gapWindow/2,
              height: area.height/2 - config.gapScreen - config.gapWindow/2
          };
          return;
      }

      // top right quarter
      if (near(win.x, area.x + area.width/2)
       && near(win.y, area.y)
       && near(win.width, area.width/2)
       && near(win.height, area.height/2)) {
           debug("gap top right");
           win.geometry = {
               x: area.x + area.width/2 + config.gapWindow/2,
               y: area.y + config.gapScreen,
               width: area.width/2 - config.gapScreen - config.gapWindow/2,
               height: area.height/2 - config.gapScreen - config.gapWindow/2
           };
           return;
       }

       // center quarter
       if (near(win.x + 0.5 * win.width, area.x + area.width/2)
        && near(win.y + 0.5 * win.height, area.y + area.height/2)
        && near(win.width, area.width/2)
        && near(win.height, area.height)) {
            debug("gap center quarter");
            win.geometry = {
                x: area.x + area.width/4,
                y: area.y + area.height/4,
                width: area.width/2,
                height: area.height
            };
            return;
        }

       // bottom left quarter
       if (near(win.x, area.x)
        && near(win.y, area.y + area.height/2)
        && near(win.width, area.width/2)
        && near(win.height, area.height/2)) {
            debug("gap bottom left");
            win.geometry = {
                x: area.x + config.gapScreen,
                y: area.y + area.height/2 + config.gapWindow/2,
                width: area.width/2 - config.gapScreen - config.gapWindow/2,
                height: area.height/2 - config.gapScreen - config.gapWindow/2
            };
            return;
        }

        // bottom right quarter
        if (near(win.x, area.x + area.width/2)
         && near(win.y, area.y + area.height/2)
         && near(win.width, area.width/2)
         && near(win.height, area.height/2)) {
             debug("gap bottom right");
             win.geometry = {
                 x: area.x + area.width/2 + config.gapWindow/2,
                 y: area.y + area.height/2 + config.gapWindow/2,
                 width: area.width/2 - config.gapScreen - config.gapWindow/2,
                 height: area.height/2 - config.gapScreen - config.gapWindow/2
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
