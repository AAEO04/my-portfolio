#!/bin/bash

# 1. Stop tracking .env files in the current checkout (keeps the files on disk)
echo "Removing .env files from git tracking..."
git rm --cached .env 2>/dev/null
git rm --cached backend/.env 2>/dev/null
git rm --cached frontend/.env.local 2>/dev/null

# 2. Commit the change
git commit -m "Stop tracking .env files"

# 3. Remove from history (Nuclear Option)
# WARNING: This rewrites history for all branches and tags.
# It is destructive. Only uncomment if you are sure.

echo "To remove .env from the entire git history (past commits), run this command:"
echo ""
echo "git filter-branch --force --index-filter \\"
echo "  'git rm --cached --ignore-unmatch .env backend/.env frontend/.env.local' \\"
echo "  --prune-empty --tag-name-filter cat -- --all"
echo ""
echo "After running the above, you will need to force push: git push origin --force --all"
