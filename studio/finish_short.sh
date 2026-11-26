#!/bin/bash
# usage: finish_short.sh S04 "TITLE TEXT"
s=$1; d=shorts2/$s
printf "file '%s'\n" $(ls $d/0*_*.mp4 | sed "s#^#$(pwd)/#") > $d/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $d/list.txt -c copy $d/joined.mp4
python3 finish.py $d/joined.mp4 shorts2/${s}_voicecta.wav final2/${s}_short_9x16.mp4 shorts2/${s}_caps.json "$2" > /dev/null
ffprobe -v error -show_entries format=duration,size:stream=width,height -of compact final2/${s}_short_9x16.mp4
