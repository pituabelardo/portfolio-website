#!/usr/bin/env bash
# ping indexnow (bing, yandex, seznam, naver…) after a deploy that changes
# page text. usage: tools/indexnow.sh [url ...]   (default: every <loc> in sitemap.xml)
# the key file /<key>.txt at the site root proves ownership — never delete it.
set -euo pipefail
cd "$(dirname "$0")/.."
KEY=$(basename "$(ls [0-9a-f]*.txt | head -1)" .txt)
if [ $# -gt 0 ]; then URLS=("$@"); else
  URLS=($(grep -o '<loc>[^<]*' sitemap.xml | sed 's/<loc>//')); fi
LIST=$(printf '"%s",' "${URLS[@]}"); LIST="[${LIST%,}]"
curl -sS -o /dev/null -w "indexnow → HTTP %{http_code}\n" \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d "{\"host\":\"jorge.eus\",\"key\":\"$KEY\",\"keyLocation\":\"https://jorge.eus/$KEY.txt\",\"urlList\":$LIST}" \
  https://api.indexnow.org/indexnow
