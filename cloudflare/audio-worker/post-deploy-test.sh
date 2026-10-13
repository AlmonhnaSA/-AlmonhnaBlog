#!/usr/bin/env bash
# Usage: bash post-deploy-test.sh https://almonhna-audio.<sub>.workers.dev
# Real R2 test (not /health): range, seek, repeat requests (cache), HEAD, 404, 416, CORS.
B="${1%/}"; F=/episodes/7ce8d098-b839-40df-9d49-91640545b256/1791725865180.mp3
t(){ curl -s -o /dev/null -w "%{http_code} range=%header{content-range} bytes=%{size_download} cache=%header{x-audio-cache} cors=%header{access-control-allow-origin} time=%{time_total}s\n" "$@"; }
O="Origin: https://www.almonhna.sa"
echo "R2 range (expect 206 bytes 0-99/9047302):"; t -H "$O" -H "Range: bytes=0-99" "$B$F"
echo "Seek middle:"; t -H "$O" -H "Range: bytes=4500000-4500099" "$B$F"
echo "Repeat x3 (HIT only on a custom domain; on workers.dev stays MISS):"
for i in 1 2 3; do sleep 1; t -H "$O" -H "Range: bytes=$((i*1000000))-$((i*1000000+99))" "$B$F"; done
echo "HEAD:"; curl -sI "$B$F" | grep -iE "^HTTP|content-length|x-audio-cache"
echo "404:"; t -H "$O" "$B/episodes/none.mp3"
echo "416:"; t -H "$O" -H "Range: bytes=99999999-" "$B$F"
echo "Other site (cors must be empty):"; t -H "Origin: https://evil.example" -H "Range: bytes=0-1" "$B$F"
