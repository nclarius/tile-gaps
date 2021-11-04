# Tile Gaps

Extension for KDE's window manager to add space around windows snapped to a whole, half or quarter of the screen.

The size of the gap and the layouts to be gapped are configurable.

Please note that this script has the purpose of reshaping windows that have been manually moved to a screen corner with the default KWin window management system, and does not do any automatic tiling.

![screenshot](img/screenshot.png)

![config](img/config_.png)

[view in KDE Store](https://www.pling.com/p/1619642/)


## Installation

### Dependencies

`kwin` version ≥ 5.21.

### Method 1: via graphical interface

1. Install the script via *System Settings* > *Window Management* > *KWin Scripts* > *Get New Scripts …* > search for *Tile Gaps* > *Install*.
2. Activate the script by selecting the checkbox in the *Tile Gaps* entry.

### Method 2: via command line

```bash
git clone https://github.com/nclarius/tile-gaps.git
plasmapkg2 --type kwinscript -i tile-gaps
kwriteconfig5 --file kwinrc --group Plugins --key tilegapsEnabled true
qdbus org.kde.KWin /KWin reconfigure
```

## Configuration

*System Settings* > *Window Management* > *KWin Scripts* > configuration button in the *Tile Gaps* entry.

You may have to disable the script, apply, reenable, and reapply in order for the changes to take effect.

If the configuration button is missing (this is due to a central limitation with the KWin script installation component), try the following:

````bash
mkdir -p ~/.local/share/kservices5
ln -sf ~/.local/share/kwin/scripts/tilegaps/metadata.desktop ~/.local/share/kservices5/tilegaps.desktop
````

## Usage

### Compatibility

- For compatibility with [sticky window snapping](https://store.kde.org/p/1112552/) you can use [my fork](https://github.com/nclarius/sticky-window-snapping), which adds an option in the configuration to set the tile gap size between windows, and will properly retain the gap when resizing adjacent windows.  
- I have not tried out combinations of the gaps script with tiling scripts (such as [Bismuth](https://store.kde.org/p/1603469/) or [KWin Tiling](https://store.kde.org/p/1112554/)); if you have experiences, please let me know.

### Issues

- If gaps are not applied in all cases, try increasing the tolerance in order to implement a more liberal tiling detection. Conversely, if gaps are inserted when they shouldn’t, try decreasing the tolerance so as to enforce a stricter tile measurement. It is recommended to have tolerance set to twice the largest gap size.

## Small Print

© 2021 Natalie Clarius \<natalie_clarius@yahoo.de\>

This work is licensed under the GNU General Public License v3.0.  
This program comes with absolutely no warranty.  
This is free software, and you are welcome to redistribute and/or modify it under certain conditions.  

If you would like to thank me, you can always make me happy with [a review](https://store.kde.org/p/1619642/) or [a cup of tea](https://www.buymeacoffee.com/nclarius).

