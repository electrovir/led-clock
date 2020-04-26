#!/usr/bin/env bash

fixCli() {
    echo ""
    echo ""
    echo "Killing script. If your terminal goes all screwy run 'stty sane'"
    echo ""
}

trap fixCli SIGINT SIGTERM TERM

# tsconfig-paths is needed here to make ts-node read the tsconfig baseUrl correctly
if [[ "$*" =~ "clock" ]] || [[ "$*" =~ "all" ]]; then
    sudo -E env "PATH=$PATH" ts-node -r tsconfig-paths/register projects/clock/src/clock-server.ts -f &
    clockServerPid=$(echo $!)
    echo "clock: $clockServerPid"
fi

if [[ "$*" =~ "api" ]] || [[ "$*" =~ "all" ]]; then
    ts-node -r tsconfig-paths/register projects/api-server/src/api-server.ts &
    apiServerPid=$(echo $!)
    echo "api: $apiServerPid"
fi

echo "startup script: $$"
echo "kill with: sudo pkill -P $$"
pids=( $clockServerPid $apiServerPid )
for pid in ${pids[*]}; do
    wait $pid
done