import {createServer} from 'net';
import {
    unlinkSync,
    writeFileSync,
    existsSync,
} from 'fs';

import {SOCKET_ADDRESS} from 'clock-socket/clock-socket-address';
import {addExitCallback} from 'catch-exit';
import {
    startClock,
    ClockEmitter,
} from './clock-draw';
import {
    ClockMessage,

    ClockMessageType,
    assertValidClockMessage,
} from 'clock-socket/clock-message';

function main() {
    const unixSocketServer = createServer();
    const clockEmitter = startClock();

    unixSocketServer.listen({
        path: SOCKET_ADDRESS,
        readableAll: true,
        writableAll: true,
    }, () => {
        console.log(`Unix socket server listening at ${SOCKET_ADDRESS}`);
    });

    unixSocketServer.on('connection', socket => {
        console.log('connection started...');
        socket.write('socket connection started');
        setTimeout(() => {
            socket.write('EAT MOAR DATA YEAH BABY');
        }, 5000);

        socket.on('data', data => {
            console.log('clock server got data', 'data');
            try {
                const action = readSocketData(data);
                performClockAction(action, clockEmitter);
            } catch (error) {
                console.error(`Error reading socket data: ${error.message}`);
            }
        });
    });
}

function readSocketData(data: Buffer): ClockMessage {
    try {
        const json: any = JSON.parse(data.toString());
        assertValidClockMessage(json);
        return json;
    } catch (error) {
        throw new Error(`Invalid socket data.\nerror:\t${error.message}\ninput:\t${data.toString()}`);
    }
}

function performClockAction(action: ClockMessage, clockEmitter: ClockEmitter) {
    switch (action.type) {
        case ClockMessageType.CUSTOM_TEXT:
            clockEmitter.emit('print-text', {text: action.text});
            break;
        case ClockMessageType.PING:

            break;

    }
}

if (!module.parent) {

    addExitCallback(() => {
        writeFileSync(1, 'Ending clock server...\n');
        if (existsSync(SOCKET_ADDRESS)) {
            unlinkSync(SOCKET_ADDRESS);
        }
    });

    writeFileSync(1, 'Starting clock server...\n');
    main();
}
