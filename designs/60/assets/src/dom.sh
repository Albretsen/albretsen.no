#!/bin/sh
# Debug helper: dump DOM + console of a page in headless Chrome.
profile=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --user-data-dir="$profile" --window-size=800,500 --virtual-time-budget=20000 --enable-logging=stderr --v=0 \
  --dump-dom "$1" 2>&1 | grep -E "CONSOLE" | head -30
rm -rf "$profile"
