#!/usr/bin/env bash

set -x

#
# Multi-step process at deploy-time to insert New Relic JavaScript snippet
# into <head/> tag of index.html
#
# Usage: newrelic.sh
#
# The following environment variables are REQUIRED:
#
#    * ENVIRONMENT - Environment to fetch s3 vars from
#    * SERVICE_NAME - This is usually set in the Dockerfile
#
# The following should be set by the vars.sh file
#
#    * NEWRELIC_ENABLED - To process New Relic snippet or not
#    * NEWRELIC_ENDPOINT - Endpoint for data used by New Relic agent
#    * NEWRELIC_BROWSER_LICENSE - License used by New Relic agent
#    * NEWRELIC_ACCOUNT_ID - New Relic Account id
#    * NEWRELIC_APP_ID - Environment specific New Relic application id
#    * NEWRELIC_ALLOWED_ORIGIN - Allow tracing headers to be sent to this url
#

SCRIPT_PATH=$(readlink -f $0)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
BASE_DIR=$(readlink -f ${SCRIPT_DIR}/..)

CONFIG_FILE="/config/newrelic-vars.sh"
INSERT_FILE="/newrelic-script-tag.html"
INDEX_FILE="/app/index.html"

loginfo() {
  MSG=$1
  echo $(date -u -Iseconds) "INFO deploy $MSG"
}

logfatal() {
  MSG=$1
  (>&2 echo $(date -u -Iseconds) "FATAL deploy $MSG")
  exit 1
}

if [ ! -f ${CONFIG_FILE} ]; then
  mkdir -p $(dirname ${CONFIG_FILE})
  KEY=$(echo $ENVIRONMENT | tr '[:upper:]' '[:lower:]')
  loginfo "Fetching newrelic configuration for ${SERVICE_NAME}"
  aws --region us-west-2 s3 cp \
      s3://invicara-secret-us-west-2/config/${KEY}/${SERVICE_NAME}/$(basename ${CONFIG_FILE}) \
      ${CONFIG_FILE}
  [ $? -gt 0 ] && loginfo "Could not fetch configuration, will check environment variables"
fi

[ -f "${CONFIG_FILE}" ] && . ${CONFIG_FILE}

if [ \
    -n "$NEWRELIC_ENABLED" -a \
    -n "$NEWRELIC_ENDPOINT" -a \
    -n "$NEWRELIC_BROWSER_LICENSE" -a \
    -n "$NEWRELIC_ACCOUNT_ID" -a \
    -n "$NEWRELIC_APP_ID" -a \
    -n "$NEWRELIC_ALLOWED_ORIGIN" \
   ]; then
  echo "All variables found"
else
  loginfo "No New Relic environment variables found, giving up"
  exit 0
fi
[ "$NEWRELIC_ENABLED" != "true" ] && echo "New Relic not enabled, skipping" && exit 0

export NEWRELIC_ENDPOINT NEWRELIC_ENDPOINT NEWRELIC_BROWSER_LICENSE NEWRELIC_ACCOUNT_ID NEWRELIC_APP_ID NEWRELIC_ALLOWED_ORIGIN

sed -e '/^\s*<\!-- @@CONDITIONAL_NEWRELIC_SCRIPT_INJECTION@@ -->\s*/{r /newrelic-script.html' -e 'd}' ${INDEX_FILE} > ${INDEX_FILE}.tmp
[ $? -gt 0 ] && logfatal "Could not replace script"

envsubst '${NEWRELIC_ENDPOINT} ${NEWRELIC_ENDPOINT} ${NEWRELIC_BROWSER_LICENSE} ${NEWRELIC_ACCOUNT_ID} ${NEWRELIC_APP_ID} ${NEWRELIC_ALLOWED_ORIGIN}' < ${INDEX_FILE}.tmp > ${INDEX_FILE}
rm -f ${INDEX_FILE}.tmp

loginfo "replacement complete"
