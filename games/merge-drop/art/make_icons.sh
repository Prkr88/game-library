#!/bin/sh
# Derives app icons from the generated 1024 icon (run from game root after art/generate_art.py).
G=assets/gen/icon-1024.png
magick $G -resize 192x192 assets/icon-192.png
magick $G -resize 512x512 assets/icon-512.png
magick $G -resize 180x180 assets/icon-180.png
magick $G -resize 32x32 assets/favicon-32.png
magick $G -resize 410x410 -background '#7a5be0' -gravity center -extent 512x512 assets/icon-512-maskable.png
mkdir -p resources
cp $G resources/icon.png
magick assets/gen/splash.png -resize x1500 -background '#1b1b3a' -gravity center -extent 2732x2732 resources/splash.png
