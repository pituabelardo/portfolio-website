#!/bin/bash
# builds cv/jorge-antolin-cv-{en,es}.pdf from cv-src/cv.{en,es}.html
# with headless chrome (macOS path; override with CHROME=...). fonts are local
# (cv-src/fonts, ofl). after building: pdftotext each pdf and read it — that is
# what an ats sees. (not under /assets: that path is cached immutable for a
# year, and the cv changes — /cv/ gets vercel's default revalidation.)
set -e
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p ../cv
for L in ${LANGS:-en es}; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=8000 --run-all-compositor-stages-before-draw \
    --print-to-pdf="$PWD/../cv/jorge-antolin-cv-$L.pdf" \
    "file://$PWD/cv.$L.html" 2>/dev/null
  echo "built cv/jorge-antolin-cv-$L.pdf"
done
# plain one-column versions for job portals (workday, greenhouse…)
for L in ${LANGS:-en es}; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=4000 \
    --print-to-pdf="$PWD/../cv/jorge-antolin-cv-$L-plain.pdf" \
    "file://$PWD/ats.$L.html" 2>/dev/null
  echo "built cv/jorge-antolin-cv-$L-plain.pdf"
done
