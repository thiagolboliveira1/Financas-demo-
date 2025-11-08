#!/usr/bin/env bash
set -e
branch=${1:-main}
git checkout -B "$branch"
git add -A
git commit -m "update: nuBlue v3"
git push -f origin "$branch"
echo "Subido! Agora habilite o GitHub Pages em Settings > Pages (se ainda não habilitou)."
