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

# Confirm success
echo "Changes committed successfully!"
