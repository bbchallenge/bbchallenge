#!/bin/bash

# Load .env file if it exists
if [ -f .env ]; then
    export $(grep -E '^NETLIFY_AUTH_TOKEN=' .env | xargs)
fi

# Build and deploy
VITE_API_URL=https://api.bbchallenge.org/ \
VITE_WIKI_API_URL=https://wiki.bbchallenge.org/w/api.php \
pnpm build && pnpm netlify deploy --dir=build -p