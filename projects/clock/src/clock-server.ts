import {createServer} from 'net';
import {SOCKET_ADDRESS} from 'clock-socket/clock-socket-address';
import {unlinkSync} from 'fs';
import {addExitCallback} from 'catch-exit';
import {ClockMessage, validateClockMessage} from 'clock-socket/clock-socket-emitter';

function main() {
    const unixSocketServer = createServer();
    unixSocketServer.listen(SOCKET_ADDRESS, () => {
        console.log(`Unix socket server listening at ${SOCKET_ADDRESS}`);
    });

    unixSocketServer.on('connection', socket => {
        console.log('connection started...', socket);
        socket.write('socket connection started');
        setTimeout(() => {
            socket.write('EAT MOAR DATA YEAH BABY');
        }, 5000);

        socket.on('data', data => {
            const action = readSocketData(data);
        });
    });
}

if (!module.parent) {
    main();
}

addExitCallback(() => {
    unlinkSync(SOCKET_ADDRESS);
});

function readSocketData(data: Buffer): ClockMessage {
    const json: any = JSON.parse(data.toString());
    if (validateClockMessage(json)) {
        return json;
    } else {
        throw new Error(`Invalid socket data`);
    }
}
