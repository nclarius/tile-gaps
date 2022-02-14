#!/bin/bash
kpackagetool5 --type=KWin/Script --install . || kpackagetool5 --type=KWin/Script --upgrade .
qdbus org.kde.KWin /KWin reconfigure
