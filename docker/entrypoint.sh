#!/bin/bash
set -e

# Ensure node_modules are found
if [ ! -d /src/node_modules ]; then
  echo "Copying node_modules from build directory to src directory..."
  cp /build/package-lock.json /src/
  cp -a /build/node_modules /src
fi

exec "$@"
