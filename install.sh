#!/bin/bash
name=$(grep -oP '"Id":\s*"[^"]*' ./metadata.json | grep -oP '[^"]*$')
kpackagetool5 --type=KWin/Script --install . || kpackagetool5 --type=KWin/Script --upgrade .
kwriteconfig5 --file kwinrc --group Plugins --key "$name"Enabled true
qdbus org.kde.KWin /KWin reconfigure
