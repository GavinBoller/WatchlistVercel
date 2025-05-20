#!/bin/bash
cd ~/watchlist/server
npx tsc || { echo "TypeScript errors"; exit 1; }
cd ~/watchlist/client
npx tsc || { echo "Client TypeScript errors"; exit 1; }
echo "No TypeScript errors"
