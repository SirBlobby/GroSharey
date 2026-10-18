#!/usr/bin/env bash
set -m

bun run dev:backend < /dev/null &
backend_process_group=$!

stop_backend() {
  kill -- -"$backend_process_group" 2>/dev/null
}
trap stop_backend EXIT

bun run "$1" "${@:2}"
