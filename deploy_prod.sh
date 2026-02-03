#!/bin/bash

# Load shell profile to get PATH (for pnpm, node, etc.)
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/share/pnpm:$HOME/.nvm/versions/node/$(ls -1 $HOME/.nvm/versions/node 2>/dev/null | tail -1)/bin:$PATH"

# Source shell profile if it exists (fallback for other setups)
[ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc" 2>/dev/null || true
[ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc" 2>/dev/null || true

# Load .env file if it exists
if [ -f .env ]; then
    export $(grep -E '^NETLIFY_AUTH_TOKEN=' .env | xargs)
fi

# Build and deploy
VITE_API_URL=https://api.bbchallenge.org/ \
VITE_WIKI_API_URL=https://wiki.bbchallenge.org/w/api.php \
pnpm build && pnpm netlify deploy --dir=build -p