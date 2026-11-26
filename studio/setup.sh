#!/bin/bash
# Recreate the Dead Pixel workshop in a fresh session: bash studio/setup.sh
set -e
W=/home/claude/dp; mkdir -p $W /home/claude/tts
cp -r "$(dirname "$0")"/* $W/
cd $W && npm install --silent three@0.170.0
pip install --break-system-packages -q kokoro-onnx soundfile playwright pillow numpy
cd /home/claude/tts && cp $W/tts.py . && for f in kokoro-v1.0.onnx voices-v1.0.bin; do [ -f $f ] || curl -sSL -o $f https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f; done
which google-chrome ffmpeg >/dev/null && echo READY
