#!/bin/sh
# Dump a page's DOM after scripts ran. Usage: dump.sh <url> <out.txt> [wait-ms]
profile=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --user-data-dir="$profile" --virtual-time-budget="${3:-15000}" --dump-dom "$1" 2>/dev/null > "$2"
rm -rf "$profile"
wc -c "$2"
