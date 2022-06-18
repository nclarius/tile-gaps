# Window Gaps

Extension for KDE's window manager to add space around windows touching a screen edge or other window.

The size of the gap and the layouts and applications to be gapped are configurable.

Please note that this script does not do any automatic tiling. Its purpose is to reshape windows that have been manually positioned with the default KWin window management system.

![screenshot](.img/screenshot.png)

<img src=".img/config.png" alt="config" height="554"/>

## Installation

### Dependencies

`kwin` version ≥ 5.21.

### Installation via graphical interface

**Please make sure to select the most recent version (v7.0)** in the installation process.

A [bug](https://bugs.kde.org/show_bug.cgi?id=453521) in Discover causes a wrong version to be installed, so using the installation module in System Settings instead is recommended.

1. Install the script via *System Settings* > *Window Management* > *KWin Scripts* > *Get New Scripts …* > search for *Window Gaps* > *Install*.
2. Enable the script by activating its checkbox, and apply the settings.

### Installation via command line

```bash
git clone https://github.com/nclarius/tile-gaps.git
cd tile-gaps
./install.sh
```

## Configuration

*System Settings* > *Window Management* > *KWin Scripts* > configuration button in the *Window Gaps* entry.

You may need to uncheck the checkbox for the script, apply the settings, recheck, and reapply in order for the changes to take effect.

In Plasma versions < 5.24, a bug in the KWin scripting system [[1]](https://bugs.kde.org/show_bug.cgi?id=411430) [[2]](https://bugs.kde.org/show_bug.cgi?id=444378) may cause the configuration not to be found. To fix this, please execute the following commands in a terminal:

```bash
sed -i 's/ConfigModule/Library/g' ~/.local/share/kwin/scripts/tilegaps/metadata.desktop
mkdir -p ~/.local/share/kservices5/
ln -sf ~/.local/share/kwin/scripts/tilegaps/metadata.desktop ~/.local/share/kservices5/tilegaps.desktop
qdbus org.kde.KWin /KWin reconfigure
```

To find the window class name of an application: Right-click on the titlebar of a window of the application > *More Actions* > *Configure Special Application Settings...* > the pre-filled entry in *Window class (application)* (if it consists of two words, only the second part) is the window class to put in the script configuration.

## Usage

### Compatibility

For [Sticky Window Snapping](https://store.kde.org/p/1112552/), make sure you have the threshold in the SWS configuration set to at least the largest gap size.

## Small Print

© 2021-2022 Natalie Clarius \<natalie_clarius@yahoo.de\>

This work is licensed under the GNU General Public License v3.0.  
This program comes with absolutely no warranty.  
This is free software, and you are welcome to redistribute and/or modify it under certain conditions.  

If you would like to thank me, you can always make me happy with a review or a cup of coffee:  
<a href="https://store.kde.org/p/1619642/"><img src="https://raw.githubusercontent.com/nclarius/Plasma-window-decorations/main/.img/kdestore.png" height="25"/></a>
<a href="https://www.paypal.com/donate/?hosted_button_id=7LUUJD83BWRM4"><img src="https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif" height="25"/></a>&nbsp;&nbsp;<a href="https://www.buymeacoffee.com/nclarius"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" height="25"/></a>
