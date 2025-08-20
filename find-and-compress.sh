#!/bin/bash

echo "Finding all image files in server/public/uploads/products/"
echo "==============================================="

DEST_DIR="server/public/uploads/products/compressed"
SRC_DIR="server/public/uploads/products"
MAX_SIZE_KB=100  
MAX_WIDTH=1024   
MAX_HEIGHT=1024  

mkdir -p "$DEST_DIR"
echo "Created directory: $DEST_DIR"

echo "Searching for images..."
find "$SRC_DIR" -type f -not -path "*/compressed/*" | while read -r file; do
  echo "Found: $file"
done

find "$SRC_DIR" -type f -not -path "*/compressed/*" | while read -r img; do
  filename=$(basename "$img")
  name="${filename%.*}"
  output="$DEST_DIR/${name}.webp"
  echo "Processing $img -> $output"
  
  dimensions=$(identify -format "%wx%h" "$img" 2>/dev/null)
  width=$(echo $dimensions | cut -d'x' -f1)
  height=$(echo $dimensions | cut -d'x' -f2)
  
  echo " Original size: ${width}x${height}"
  
  temp_resized="/tmp/${name}_resized.png"
  
  if [ $width -gt $MAX_WIDTH ] || [ $height -gt $MAX_HEIGHT ]; then
    echo " Resizing to max ${MAX_WIDTH}x${MAX_HEIGHT} (preserving aspect ratio)"
    convert "$img" -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" -quality 95 "$temp_resized" 2>/dev/null
  else
    echo " No resizing needed, dimensions within limits"
    convert "$img" -quality 95 "$temp_resized" 2>/dev/null
  fi
  
  quality=90
  method=4  
  
  size=999999
  attempts=0
  while [ $size -gt $(($MAX_SIZE_KB * 1024)) ] && [ $quality -ge 70 ] && [ $attempts -lt 5 ]; do
    echo " Trying quality: $quality"
    
    cwebp -q $quality -m $method -sharp_yuv -af -noalpha "$temp_resized" -o "$output" 2>/dev/null
    
    if [ $? -ne 0 ]; then
      echo " cwebp failed at quality $quality"
      break
    fi
    
    size=$(stat -c%s "$output" 2>/dev/null)
    echo " Quality $quality -> $(($size/1024))KB"
    
    quality=$((quality - 3))
    attempts=$((attempts + 1))
  done
  
  if [ $size -gt $(($MAX_SIZE_KB * 1024)) ] && [ $quality -lt 70 ]; then
    echo " Still too large, trying with alternative compression parameters"
    cwebp -q 75 -m 6 -size $(($MAX_SIZE_KB * 1024)) -sharp_yuv -af "$temp_resized" -o "$output" 2>/dev/null
    size=$(stat -c%s "$output" 2>/dev/null)
    echo " Target size mode -> $(($size/1024))KB"
  fi
  
  rm -f "$temp_resized"
  
  if [ -f "$output" ]; then
    orig_size=$(stat -c%s "$img" 2>/dev/null)
    compression_ratio=$(echo "scale=2; $orig_size / $size" | bc)
    echo " Done processing $filename (${width}x${height} to $(identify -format "%wx%h" "$output" 2>/dev/null), compression ratio: ${compression_ratio}x)"
  else
    echo " Failed to create $output"
  fi
done

echo "==============================================="
echo "Compression complete. Results:"
ls -lh "$DEST_DIR"