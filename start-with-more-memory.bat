@echo off
echo Starting TrackXpense with increased memory limit...
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
