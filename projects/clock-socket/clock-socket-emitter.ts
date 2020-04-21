import {EventEmitter} from 'events';

import {ClockMessage} from './clock-message';

export interface ClockSocketEmitter {
    emit(type: 'message', message: ClockMessage): boolean;
    on(type: 'message', listener: (message: ClockMessage) => void): this;
    once(type: 'message', listener: (message: ClockMessage) => void): this;
}

export const ClockSocketEmitter = (function(this: ClockSocketEmitter) {} as any) as {new (): ClockSocketEmitter};
ClockSocketEmitter.prototype = EventEmitter.prototype;
