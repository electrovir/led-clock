import {randomBytes} from 'crypto';
import {EventEmitter} from 'events';
import {getEnumTypedValues, isValueInEnum} from 'util/object';
import {LedColor} from 'ws2812draw';

export interface ClockSocketEmitter {
    emit(type: 'message', message: ClockMessage): boolean;
    on(type: 'message', listener: (message: ClockMessage) => void): this;
    once(type: 'message', listener: (message: ClockMessage) => void): this;
}

export const ClockSocketEmitter = (function (this: ClockSocketEmitter) {} as any) as {new (): ClockSocketEmitter};
ClockSocketEmitter.prototype = EventEmitter.prototype;

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
    CUSTOM_TEXT = 'custom-text',
    SOLID_COLOR = 'solid-color',
    SPECIALTY_DISPLAY = 'specialty-display',
    PING = 'ping',
    CLOCK_UPDATED = 'clock-updated',
    CLOCK_ERROR = 'clock-error',
}

export interface PingMessage extends BaseClockMessage {
    type: ClockMessageType.PING;
}

export interface ClockError extends BaseClockMessage {
    type: ClockMessageType.CLOCK_ERROR;
}

export interface ClockUpdatedMessage extends BaseClockMessage {
    type: ClockMessageType.CLOCK_UPDATED;
    timestamp: Number;
}

export interface ChangeColorMessage extends BaseClockMessage {
    type: ClockMessageType.CHANGE_COLOR;
    color: LedColor;
}

export interface SolidColorMessage extends BaseClockMessage {
    type: ClockMessageType.SOLID_COLOR;
    color: LedColor;
}

export interface CustomTextMessage extends BaseClockMessage {
    type: ClockMessageType.CUSTOM_TEXT;
    submitterName: string;
    text: string;
    color: LedColor;
}

export interface SpecialtyDisplayMessage extends BaseClockMessage {
    type: ClockMessageType.SPECIALTY_DISPLAY;
    specialDisplayType: any;
}

function checkTypeProperty(message: any): message is ClockMessage {
    return isValueInEnum(ClockMessageType, message.type);
}

export function validateClockMessage(message: any): message is ClockMessage {
    if (checkTypeProperty(message)) {
        switch (message.type) {
            case ClockMessageType.CUSTOM_TEXT:
                return (
                    getEnumTypedValues(LedColor).includes(message.color) &&
                    typeof message.submitterName === 'string' &&
                    typeof message.text === 'string'
                );
            case ClockMessageType.SOLID_COLOR:
            case ClockMessageType.CHANGE_COLOR:
                return getEnumTypedValues(LedColor).includes(message.color);
            case ClockMessageType.PING:
                return true;
            case ClockMessageType.SPECIALTY_DISPLAY:
                return false;
            case ClockMessageType.CLOCK_ERROR:
                return true;
            case ClockMessageType.CLOCK_UPDATED:
                if (typeof message.timestamp === 'number') {
                    return true;
                } else {
                    return false;
                }
        }
    } else {
        return false;
    }
}
