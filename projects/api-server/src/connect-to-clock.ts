import {
    Socket,
    createConnection,
} from 'net';

import {SOCKET_ADDRESS} from 'clock-socket/clock-socket-address';
import {ClockSocketEmitter} from 'clock-socket/clock-socket-emitter';
import {
    IdClockMessage,
    createIdMessage,
} from 'clock-socket/clock-message';

const client = createConnection(SOCKET_ADDRESS);

client.on('connect', () => {
    console.log('client socket connected');
});

client.on('data', data => {
    console.log('got data', data.toString());
});

function sendMessageFromSocketClient(socket: Socket, message: IdClockMessage) {
    socket.write(JSON.stringify(message));
}

export async function createClientClockSocket(): Promise<ClockSocketEmitter> {
    return new Promise<ClockSocketEmitter>((resolve, reject) => {
        const clientSocket = createConnection(SOCKET_ADDRESS);
        const socketEmitter = new ClockSocketEmitter();

        socketEmitter.on('message', message => {
            const idMessage = createIdMessage(message);
            sendMessageFromSocketClient(clientSocket, idMessage);
        });

        clientSocket.on('connect', () => {
            resolve(socketEmitter);
        });
    });
}

function startClock() {

}
