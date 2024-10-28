#!/usr/bin/env bash

CONFIG_FILE="config.js"

#
# Deploy Web App to Local Directory
#
# Usage: s3.sh
#
# The following environment variables are REQUIRED:
#
#    * ENVIRONMENT - Environment to deploy
#
# This will:
#    * copy from /app to /target. Use a bind mount /target to the
#      directory of your choice
#    * copy the file /config/${CONFIG_FILE} to /target/${CONFIG_FILE}. Use a bind
#      mount /config to the directory of your choice.
#

SCRIPT_PATH=$(readlink -f $0)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
BASE_DIR=$(readlink -f ${SCRIPT_DIR}/..)

loginfo() {
  MSG=$1
  echo $(date -u -Iseconds) "INFO deploy $MSG"
}

logfatal() {
  MSG=$1
  (>&2 echo $(date -u -Iseconds) "FATAL deploy $MSG")
  exit 1
}

loginfo "Processing newrelic agent"
/docker-entrypoint.d/01-newrelic-agent.sh

loginfo "Syncing files from /app to /target"
rsync -avh /app/ /target/ --delete
[ $? -gt 0 ] && logfatal "Could not sync files"

loginfo "Copying configuration file from /config/${CONFIG_FILE} to /target/${CONFIG_FILE}"
[ ! -f /config/${CONFIG_FILE} ] && logfatal "Could not find /config/${CONFIG_FILE} file to copy"
cp /config/${CONFIG_FILE} /target/${CONFIG_FILE}
[ $? -gt 0 ] && logfatal "Could not copy config file"

exit 0
