# Tile Gaps

Extension for KDE's window manager to add space around windows snapped to a half or quarter of the screen.

The size of the margins is configurable.

![screenshot](screenshot.png)

## Installation

#### Method 1: via GUI

1. Install the script via *Settings* > *Window Management* > *KWin Scripts* > *Get New Scripts …* > search for *Tile Gaps* > *Install*.
2. Activate the script by selecting the checkbox in the *Tile Gaps* entry.

#### Method 2: via command line

```bash
git clone https://github.com/nclarius/tile-gaps.git
plasmapkg2 --type kwinscript -i tile-gaps
kwriteconfig5 --file kwinrc --group Plugins --key tilegapsEnabled true
qdbus org.kde.KWin /KWin reconfigure
```



## Configuration

*Settings* > *Window Management* > *KWin Scripts* > configuration button in the *Tile Gaps* entry.

If the configuration button is missing, try the following:

````bash
mkdir -p ~/.local/share/kservices5
ln -s ~/.local/share/kwin/scripts/tilegaps/metadata.desktop ~/.local/share/kservices5/tilegaps.desktop
````

If that still doesn’t work, you can make the changes in the source code:

1. Download and the code via GitHub (top right green button *Code* > *Download ZIP*) or KDE store (top right purple button *Download*) and unpack.
2. In ` contents/code/main.js`, change the values `12` at the beginning of the file to your preferences.
3. Recompile the script by starting a terminal window in the `tile-gaps` folder and running the command

    ```bash
    plasmapkg2 --type kwinscript -u .
    ```

4. Restart the KWin session by starting a terminal window and running the command

   ````bash
   kwin_x11 --replace &
   ````
