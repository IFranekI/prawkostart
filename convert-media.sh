#!/bin/bash
# Mac/Linux. media_src = oryginały, media_out = wynik
mkdir -p media_out
while IFS=$'\t' read -r a b; do
  [ -z "$a" ] && continue
  [ ! -f "media_src/$a" ] && { echo "BRAK: $a"; continue; }
  [ -f "media_out/$b" ] && continue
  case "$a" in
    *.wmv|*.WMV) ffmpeg -loglevel error -y -i "media_src/$a" -an -vf "scale='min(640,iw)':-2" -c:v libx264 -crf 30 -preset medium -pix_fmt yuv420p -movflags +faststart "media_out/$b";;
    *) cp "media_src/$a" "media_out/$b";;
  esac
done < media_map.txt
echo Gotowe
