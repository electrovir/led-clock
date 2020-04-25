#!/usr/bin/env bash

# tsconfig-paths is needed here to make ts-node read the tsconfig baseUrl correctly
sudo -E env "PATH=$PATH" ts-node -r tsconfig-paths/register projects/clock/src/clock-server.ts -f &
clockServerPid=$(echo $!)

ts-node -r tsconfig-paths/register projects/api-server/src/api-server.ts &
apiServerPid=$(echo $!)

pids=( $clockServerPid $apiServerPid )
for pid in ${pids[*]}; do
    wait $pid
done