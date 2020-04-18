import * as express from 'express';
import * as cors from 'cors';
import {EventEmitter} from 'events';
import {CorsOptions} from 'cors';
import {isKeyInEnum} from '../../util/object';
import {LedColor} from 'ws2812draw';
import {NextFunction, Request, Response} from 'express';

const originWhitelist = ['http://localhost'];

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        console.log('request origin', origin);
        if (origin && originWhitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};

export interface ServerEmitter extends EventEmitter {
    emit(type: 'color-change', color: LedColor): boolean;
    on(type: 'color-change', listener: (color: LedColor) => void): this;
    once(type: 'color-change', listener: (color: LedColor) => void): this;

    emit(type: 'custom-string', custom: string): boolean;
    on(type: 'custom-string', listener: (custom: string) => void): this;
    once(type: 'custom-string', listener: (custom: string) => void): this;

    emit(type: 'server-started', port: number): boolean;
    on(type: 'server-started', listener: (port: number) => void): this;
    once(type: 'server-started', listener: (port: number) => void): this;

    emit(type: 'stop-server'): boolean;
    on(type: 'stop-server', listener: () => void): this;
    once(type: 'stop-server', listener: () => void): this;

    emit(type: 'start-server', port: number): boolean;
    on(type: 'start-server', listener: (port: number) => void): this;
    once(type: 'start-server', listener: (port: number) => void): this;
}

export function createWebServer(port: number): ServerEmitter {
    const emitter = new EventEmitter() as ServerEmitter;

    const app = express();

    function startServer(newPort: number) {
        return app.listen(newPort, () => {
            emitter.emit('server-started', port);
        });
    }

    app.use((req, res, next) => {
        console.log(`${req.ip} made request to ${req.url}`);

        next();
    });

    app.use(cors(corsOptions));

    app.get('change-clock-color/:colorString', (req, res) => {
        const colorKey = req.params.colorString.toUpperCase();

        if (isKeyInEnum(LedColor, colorKey)) {
            const color: LedColor = LedColor[colorKey];

            emitter.emit('color-change', color);
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    });

    app.get('custom-string/:inputString', (req, res) => {
        emitter.emit('custom-string', req.params.inputString);
        res.sendStatus(200);
    });

    app.get('*', (req, res) => {
        res.setHeader('content-type', 'text/plain');
        res.status(404).send('Error');
    });

    app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(error.message);
        res.setHeader('content-type', 'text/plain');
        res.status(500).send('Error');
    });

    let server = startServer(port);

    emitter.on('stop-server', () => {
        server.close();
    });

    emitter.on('start-server', eventPort => {
        server = startServer(eventPort);
    });

    return emitter;
}
