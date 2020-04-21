#!/usr/bin/env bash

sudo -E env "PATH=$PATH" ts-node -r tsconfig-paths/register projects/clock/src/clock-server.ts &
clockServerPid=$(echo $!)

ts-node -r tsconfig-paths/register projects/api-server/src/api-server.ts &
apiServerPid=$(echo $!)

pids=( $clockServerPid $apiServerPid )
for pid in ${pids[*]}; do
    wait $pid
done