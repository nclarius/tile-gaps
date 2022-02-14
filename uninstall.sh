#!/bin/bash
kpackagetool5 --type=KWin/Script --remove package
qdbus org.kde.KWin /KWin reconfigure
