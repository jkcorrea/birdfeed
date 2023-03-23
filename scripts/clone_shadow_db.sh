#!/bin/sh

# This script clones a supabase database without the data & owned by the current user
# Usage: clone_shadow_db.sh <new_db_name> [supabase_db_port]
#
# NOTE: [supabase_db_port] is optional and defaults to '54322'
# NOTE: You may seem some errors in the console. most of the time they are harmless for the purposes of running a test/shadow db.
#       As long as you get a new DB with the same schema, you should be good to go.

# create a temp file to store the dump
TMP_DIR=$(mktemp -d)
if [ $? -ne 0 ]; then
  echo "$0: Can't create temp dir. Is \"mktemp\" installed?"
  exit 1
fi
DUMP_FILE="${TMP_DIR}"/db.dump

# dump schema only from supabase's db
pg_dump --schema-only  --no-acl postgresql://postgres:postgres@localhost:${2:-54322}/postgres > ${DUMP_FILE}

# (re)create the database
dropdb "birdfeed_shadow"
createdb "birdfeed_shadow"

# restore the schema
# pg_restore --create --clean --if-exists --no-owner -d "birdfeed_shadow"
psql birdfeed_shadow < ${DUMP_FILE}
