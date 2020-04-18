import {LedColor, drawText, MatrixPaddingOption} from 'ws2812draw';
import {EventEmitter} from 'events';
import {overrideDefinedProperties} from '../../util/object';

type ClockConfig = {
    timeFormat: 24 | 12;
    checkIntervalMs: number;
    displayWidth: number;
    foregroundColor: LedColor;
    backgroundColor: LedColor;
    running: boolean;
};

export type TextConfig = {
    text: string;
};

const defaultConfig: ClockConfig = {
    timeFormat: 24,
    checkIntervalMs: 500,
    displayWidth: 32,
    foregroundColor: LedColor.CYAN,
    backgroundColor: LedColor.BLACK,
    running: true,
};

export interface ClockEmitter extends EventEmitter {
    emit(type: 'clock-updated', date: Date): boolean;
    on(type: 'clock-updated', listener: (date: Date) => void): this;
    once(type: 'clock-updated', listener: (date: Date) => void): this;

    emit(type: 'config-update', config: Partial<ClockConfig>): boolean;
    on(type: 'config-update', listener: (config: Partial<ClockConfig>) => void): this;
    once(type: 'config-update', listener: (config: Partial<ClockConfig>) => void): this;

    emit(type: 'print-text', config: Partial<ClockConfig>): boolean;
    on(type: 'print-text', listener: (config: Partial<ClockConfig>) => void): this;
    once(type: 'print-text', listener: (config: Partial<ClockConfig>) => void): this;

    emit(type: 'stop-clock'): boolean;
    on(type: 'stop-clock', listener: () => void): this;
    once(type: 'stop-clock', listener: () => void): this;

    emit(type: 'start-clock'): boolean;
    on(type: 'start-clock', listener: () => void): this;
    once(type: 'start-clock', listener: () => void): this;
}

function getFormattedTimeString(now: Date, config: ClockConfig) {
    let hours = now.getHours();
    const minutes = now.getMinutes();

    if (config.timeFormat === 12 && hours > 12) {
        hours = hours - 12;
    }
    const formattedString = `${String(hours).length < 2 ? ' ' : ''}${hours}:${
        String(minutes).length < 2 ? '0' : ''
    }${minutes}`;
    return formattedString;
}

export function startClock(inputConfig: Partial<ClockConfig> = {}) {
    let config = overrideDefinedProperties(defaultConfig, inputConfig);

    let lastTime = '';
    const emitter = new EventEmitter() as ClockEmitter;
    emitter.on('', () => {});
    // emitter.on('config-update', newConfig => {
    //     config = overrideDefinedProperties(config, newConfig);
    // });

    // emitter.on('stop-clock', () => {
    //     config.running = false;
    // });

    // emitter.on('start-clock', () => {
    //     config.running = true;
    //     checkClock();
    // });

    function checkClock() {
        const now = new Date();
        const timeString = getFormattedTimeString(now, config);

        const textOptions = [
            {foregroundColor: config.foregroundColor, backgroundColor: config.backgroundColor, monospace: true},
            {foregroundColor: config.foregroundColor, backgroundColor: config.backgroundColor, monospace: false},
        ];

        if (lastTime !== timeString) {
            lastTime = timeString;
            drawText(50, timeString, textOptions, {padding: MatrixPaddingOption.BOTH, width: config.displayWidth});
            // emitter.emit('clock-updated', now);
        }
        if (config.running) {
            setTimeout(() => checkClock(), config.checkIntervalMs);
        }
    }

    checkClock();

    // return emitter;
}
