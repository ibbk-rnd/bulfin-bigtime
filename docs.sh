#!/bin/bash

SOURCE_DIR="dist/bulfin-bigtime/browser"
DEST_DIR="docs"

if [ -d "$SOURCE_DIR" ]; then
    if [ -d "$DEST_DIR" ]; then
        rm -rf "$DEST_DIR"
        echo "Removed existing $DEST_DIR directory."
    fi

    cp -r "$SOURCE_DIR" "$DEST_DIR"
    echo "Files copied from $SOURCE_DIR to $DEST_DIR."
else
    echo "Source directory $SOURCE_DIR does not exist."
fi
