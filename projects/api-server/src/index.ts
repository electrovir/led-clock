import {createWebServer} from './server';
import {networkInterfaces} from 'os';

// const apiPort = Number(process.argv[2]) || 8001;
// const localIps = {eth: networkInterfaces().eth0[0].address, wlan: networkInterfaces().wlan0[0].address};
// console.log('starting clock');
// const clockEmitter = runClock();

// const serverEmitter = createWebServer(apiPort);
// serverEmitter.on('server-started', port => {
//     console.log(`Starting web server
//     Port:       ${port}
//     Local IP:   ${JSON.stringify(localIps)}`);
// });
// serverEmitter.on('color-change', color => {
//     const configUpdate = {
//         foregroundColor: color,
//     };
//     clockEmitter.emit('config-update', configUpdate);
// });

import {createConnection} from 'net';
import {SOCKET_ADDRESS} from '../../clock-socket/clock-socket-address';

const thing = ['hello'];
// const socket = new Socket();
// socket.connect(SOCKET_ADDRESS, () => {});

const client = createConnection(SOCKET_ADDRESS);

client.on('connect', () => {
    console.log('client socket connected');
});

client.on('data', data => {
    console.log('got data', data.toString());
});
