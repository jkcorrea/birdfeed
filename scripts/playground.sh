#!/usr/bin/env bash
# print current directory of this script
DIR=$(dirname "$0")
PLAYGROUND_PATH="$DIR/playground.ts"
# Check if playground.ts doesn't exist

if [ ! -f $PLAYGROUND_PATH ]; then
  # Create a new playground.ts file
  cat > $PLAYGROUND_PATH << EOF
/* eslint-disable no-console */

/**
 * Use this to test out functions or anything in the codebase.
 *
 * It's gitignored so new changes won't be committed.
 *
 * Usage: `yarn playground`
 */

async function main() {
  console.log('Do something...')
}

main()
EOF
fi

yarn tsx $PLAYGROUND_PATH
