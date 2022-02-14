#!/bin/bash
kpackagetool5 --type=KWin/Script --remove .
qdbus org.kde.KWin /KWin reconfigure
