#!/bin/sh

BACKEND_BASE_URL=${BACKEND_BASE_URL:-"https://habits.jntn.de/api"}
UI_BASE_URL=${UI_BASE_URL:-"https://habits.jntn.de"}

envsubst '${BACKEND_BASE_URL} ${UI_BASE_URL}' < /config.js.template > /usr/share/nginx/html/config.js

nginx -g "daemon off;"
