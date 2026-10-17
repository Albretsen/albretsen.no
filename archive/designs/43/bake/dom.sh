#!/bin/sh
# Dump a page's DOM after scripts ran. Usage: bake/dom.sh <url>
profile=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --user-data-dir="$profile" --virtual-time-budget=8000 --dump-dom "$1" 2>/dev/null
rm -rf "$profile"
