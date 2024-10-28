#!/usr/bin/env bash

CONFIG_FILE="config.js"

#
# Deploy Web App to S3 Bucket
#
# Usage: s3.sh
#
# The following environment variables are REQUIRED:
#
#    * ENVIRONMENT - Environment to deploy
#    * SERVICE_NAME - This is usually set in the Dockerfile
#
# The following should be set by the vars.sh file
#
#    * WEBAPP_BUCKET_NAME - S3 webapp bucket
#    * WEBAPP_BUCKET_REGION - S3 webapp bucket region
#    * WEBAPP_BUCKET_PATH - S3 webapp path for deployment
#

KEY=$(echo $ENVIRONMENT | tr '[:upper:]' '[:lower:]')

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

loginfo "Fetching configuration for ${SERVICE_NAME} deployment"
aws --region us-west-2 s3 cp \
    s3://invicara-secret-us-west-2/config/${KEY}/${SERVICE_NAME}/vars.sh \
    /vars.sh
[ $? -gt 0 ] && logfatal "Could not fetch configuration"

loginfo "Loading vars for deployment"
. /vars.sh

WEBAPP_LOCAL_PATH="/app"
WEBAPP_URL_PATH=$(basename ${WEBAPP_BUCKET_PATH})

loginfo "Fetching configuration for ${SERVICE_NAME} webapp"
aws --region us-west-2 s3 cp \
    s3://invicara-secret-us-west-2/config/${KEY}/${SERVICE_NAME}/${CONFIG_FILE} \
    ${WEBAPP_LOCAL_PATH}/${CONFIG_FILE}
[ $? -gt 0 ] && logfatal "Could not fetch configuration"

loginfo "Deploying ${WEBAPP_LOCAL_PATH}/ to s3://${WEBAPP_BUCKET_NAME}/${WEBAPP_BUCKET_PATH}/"
aws --region ${WEBAPP_BUCKET_REGION} s3 sync --delete \
    ${WEBAPP_LOCAL_PATH}/ \
    s3://${WEBAPP_BUCKET_NAME}/${WEBAPP_BUCKET_PATH}/
[ $? -gt 0 ] && logfatal "Could not deploy"

# this is a hack to handle the fact that CloudFront doesn't handle custom redirects
echo "<http><head><script type=\"text/javascript\">document.location.replace(\"/${WEBAPP_URL_PATH}/\");</script></head></http>" > redirect.html
loginfo "Copying ${WEBAPP_LOCAL_PATH}/redirect.html to key: ${WEBAPP_BUCKET_PATH}"
aws --region ${WEBAPP_BUCKET_REGION} s3api put-object \
    --bucket ${WEBAPP_BUCKET_NAME} \
    --key ${WEBAPP_BUCKET_PATH} \
    --body redirect.html \
    --content-type "text/html"
[ $? -gt 0 ] && logfatal "Could not copy file"

# this is a hack to handle the fact that CloudFront doesn't handle index documents in sub-directories
loginfo "Copying ${WEBAPP_LOCAL_PATH}/index.html to key: ${WEBAPP_BUCKET_PATH}/"
aws --region ${WEBAPP_BUCKET_REGION} s3api put-object \
    --bucket ${WEBAPP_BUCKET_NAME} \
    --key ${WEBAPP_BUCKET_PATH}/ \
    --body ${WEBAPP_LOCAL_PATH}/index.html \
    --content-type "text/html"
[ $? -gt 0 ] && logfatal "Could not copy file"

exit 0
