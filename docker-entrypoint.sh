#!/bin/sh
set -e

# Runtime env var injection: replace the build-time API URL placeholder
# with the runtime VITE_API_URL if provided
if [ -n "$VITE_API_URL" ]; then
  find /usr/share/nginx/html/assets -name '*.js' -exec \
    sed -i "s|https://olas.vasudev.xyz|${VITE_API_URL}|g" {} +
fi

exec "$@"
