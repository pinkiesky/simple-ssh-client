#!/bin/bash

ACP_API_VERSION="ssc-v1"
ACP_DELIMITER=" ; "

function join_by {
  local d=$1
  shift; echo -n "$1"; shift; printf "%s" "${@/#/$d}"
}

sendAcpData() {
  echo -ne '\x1B\x9F' # ESC ACP
  echo -ne `join_by "$ACP_DELIMITER" "$ACP_API_VERSION" $*`
  echo -ne '\x9C\r\x1B[K' # ST \r ESC EL
}