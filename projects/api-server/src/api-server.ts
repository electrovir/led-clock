import {
    createConnection,
    Socket,
} from 'net';
import {writeFileSync} from 'fs';

import {SOCKET_ADDRESS} from '../../clock-socket/clock-socket-address';

import * as cors from 'cors';
import * as express from 'express';
import {addExitCallback} from 'catch-exit';

const SOCKET_CONNECT_ATTEMPT_COUNT = 4;
const SOCKET_CONNECT_ATTEMPT_TIMEOUT = 3000;

async function setupSocketConnection(): Promise<Socket> {
    return new Promise<Socket>((resolve, reject) => {
        const client = createConnection(SOCKET_ADDRESS, () => {
            console.log('client socket connected');
            resolve(client);
        });

        client.on('data', data => {
            console.log('server api socket got data', data.toString());
        });

        client.on('error', error => {
            reject(error);
        });
    });
}

let queue: string[] = [];

function checkQueue() {
    setTimeout(async() => {
        if (queue.length >0) {
            const socket = await tryToSetupSocket();
            queue.forEach(item => {
                socket.write(item);
            });
            queue = [];
        }

        checkQueue();
    }, 100);
}

function insertIntoQueue(data: string) {
    queue.push(data);
}

async function tryToSetupSocket(attempts = SOCKET_CONNECT_ATTEMPT_COUNT): Promise<Socket> {
    return new Promise<Socket>((resolve, reject) => {
        try {
            resolve(setupSocketConnection());
        } catch (error) {
            console.log(`Failed to connect to clock socket from api server. ${attempts ?
                `${attempts} attempts remaining. Trying again...` :
                'No more attempts remaining. Aborting.'}`,
            );
            if (attempts) {
                setTimeout(() => {
                    resolve(tryToSetupSocket(--attempts));
                }, SOCKET_CONNECT_ATTEMPT_TIMEOUT);
            } else {
                reject(error);
            }
        }
    });
}

const app = express();

app.use(cors());

app.get('/data/:json', (req, res) => {
    console.log(`Api server got data from request:\n${req.params.json}`);
    insertIntoQueue(req.params.json);
    res.status(200);
    res.end();
});

app.listen(8001, () => {
    console.log('api started, listening2 on 8001');
});

checkQueue();

addExitCallback(() => {
    writeFileSync(1, 'Ending api server...\n');
});
