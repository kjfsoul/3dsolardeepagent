#!/bin/bash

PORTS=(3030 3031 3032 3033 3034 3035)

for PORT in "${PORTS[@]}"; do
  if ! lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Starting dev server on port $PORT..."
    exec next dev -p $PORT
    exit 0
  else
    echo "Port $PORT is in use, trying next port..."
  fi
done

echo "Error: All ports (${PORTS[*]}) are in use. Please free up a port or add more fallback ports."
exit 1
