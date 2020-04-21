import {randomBytes} from 'crypto';
import {
    isValueInEnum,

    getEnumTypedKeys,
} from 'util/object';

import {LedColor} from 'ws2812draw';

export type ClockMessage =
| ChangeColorMessage
| CustomTextMessage
| SpecialtyDisplayMessage
| SolidColorMessage
| ClockUpdatedMessage
| ClockError
| PingMessage;

/**
* used in the socket IO calls to identify what responses and requests go together.
*/
export type IdClockMessage = ClockMessage & {
    messageId: string;
};

export function createIdMessage(message: ClockMessage): IdClockMessage {
    const messageId = randomBytes(20).toString('hex');
    return {
        ...message,
        messageId,
    };
}

/**
* Anything that extends this base type MUST only have primitve properties because the only serialization that occurs
* is JSON.parse()
*/
type BaseClockMessage = {
    type: ClockMessageType;
};

export enum ClockMessageType {
    CHANGE_COLOR = 'change-color',
    CLOCK_ERROR = 'clock-error',
    CLOCK_UPDATED = 'clock-updated',
    CUSTOM_TEXT = 'custom-text',
    PING = 'ping',
    SOLID_COLOR = 'solid-color',
    SPECIALTY_DISPLAY = 'specialty-display'
}

export interface PingMessage extends BaseClockMessage {
    type: ClockMessageType.PING;
}

export interface ClockError extends BaseClockMessage {
    type: ClockMessageType.CLOCK_ERROR;
}

export interface ClockUpdatedMessage extends BaseClockMessage {
    timestamp: Number;
    type: ClockMessageType.CLOCK_UPDATED;
}

export interface ChangeColorMessage extends BaseClockMessage {
    color: keyof typeof LedColor;
    type: ClockMessageType.CHANGE_COLOR;
}

export interface SolidColorMessage extends BaseClockMessage {
    color: keyof typeof LedColor;
    type: ClockMessageType.SOLID_COLOR;
}

export interface CustomTextMessage extends BaseClockMessage {
    color: keyof typeof LedColor;
    submitterName: string;
    text: string;
    type: ClockMessageType.CUSTOM_TEXT;
}

export interface SpecialtyDisplayMessage extends BaseClockMessage {
    specialDisplayType: any;
    type: ClockMessageType.SPECIALTY_DISPLAY;
}

function checkTypeProperty(message: any): message is ClockMessage {
    return isValueInEnum(ClockMessageType, message.type);
}

export function assertValidClockMessage(message: any): asserts message is ClockMessage {
    if (checkTypeProperty(message)) {
        switch (message.type) {
            case ClockMessageType.CUSTOM_TEXT:
                if (!getEnumTypedKeys(LedColor).includes(message.color)) {
                    throw new Error('invalid color');
                } else if(typeof message.submitterName !== 'string') {
                    throw new Error('submitterName not of type string');
                } else if(typeof message.text !== 'string') {
                    throw new Error('text not of type string');
                }
                break;
            case ClockMessageType.SOLID_COLOR:
            case ClockMessageType.CHANGE_COLOR:
                if (!getEnumTypedKeys(LedColor).includes(message.color)) {
                    throw new Error('invalid color');
                }
                break;
            case ClockMessageType.PING:
            case ClockMessageType.SPECIALTY_DISPLAY:
            case ClockMessageType.CLOCK_ERROR:
                break;
            case ClockMessageType.CLOCK_UPDATED:
                if (typeof message.timestamp !== 'number') {
                    throw new Error('invalid timestamp');
                }
                break;
        }
    } else {
        throw new Error('Invalid message property type');
    }
}
