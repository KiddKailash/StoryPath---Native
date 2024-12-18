#!/bin/bash

# Prompt the user for a commit message
read -p "Enter commit message: " commit_message

# Check if the commit message is empty
if [ -z "$commit_message" ]; then
  echo "Commit message cannot be empty. Aborting."
  exit 1
fi

# Stage all changes (tracked and untracked)
git add .

# Commit the changes with the provided message
git commit -m "$commit_message"

# Check if the current branch has an upstream branch
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
  echo "No upstream branch found. Setting upstream to origin/main..."
  git push --set-upstream origin main
else
  # Push the changes to the origin repository
  echo "Pushing changes to origin..."
  git push origin
fi

# Pull the latest changes from the origin repository
echo "Pulling the latest changes to ensure everything is up-to-date..."
git pull origin

# Confirm success
echo "Changes committed, pushed, and repository updated successfully!"
