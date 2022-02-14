#!/bin/bash
kpackagetool5 --type=KWin/Script --install package || kpackagetool5 --type=KWin/Script --upgrade package
qdbus org.kde.KWin /KWin reconfigure
