#!/bin/sh

BASE_SHORTCUT_DESCRIPTION="⌃G"
FIREFOX_SHORTCUT_DESCRIPTION="⌃G (macOS) or Control+Q (Linux, Windows)"

sed -i "" "s/$BASE_SHORTCUT_DESCRIPTION/$FIREFOX_SHORTCUT_DESCRIPTION/g" "Shared (Extension)/Resources/_locales/en/messages.json"

web-ext build -s "Shared (Extension)/Resources" -a "Build/Firefox" --overwrite-dest

sed -i "" "s/$FIREFOX_SHORTCUT_DESCRIPTION/$BASE_SHORTCUT_DESCRIPTION/g" "Shared (Extension)/Resources/_locales/en/messages.json"
