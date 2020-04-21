import {EventEmitter} from 'events';

import {overrideDefinedProperties} from '../../util/object';

import {
    LedColor,
    MatrixPaddingOption,
    drawText,
    drawScrollingText,
} from 'ws2812draw';
import {addExitCallback} from 'catch-exit';

type ClockConfig = {
    backgroundColor: LedColor;
    brightness: number;
    checkIntervalMs: number;
    displayWidth: number;
    foregroundColor: LedColor;
    running: boolean;
    timeFormat: 24 | 12;
};

const defaultConfig: ClockConfig = {
    backgroundColor: LedColor.BLACK,
    brightness: 50,
    checkIntervalMs: 500,
    displayWidth: 32,
    foregroundColor: LedColor.CYAN,
    running: true,
    timeFormat: 24,
};

export type TextConfig = {
    backgroundColor?: LedColor;
    brightness?: number;
    foregroundColor?: LedColor;
    text: string;
};

const defaultTextConfig: Required<TextConfig> = {
    text: '',
    ...defaultConfig,
};

let stopPromiseResolver: (() => void)|undefined;
let stopPromise = new Promise<void>(() => {});
function resetStopPromise() {
    stopPromiseResolver && stopPromiseResolver();
    stopPromise = new Promise(resolve => {
        stopPromiseResolver = resolve;
    });
}

addExitCallback(() => {
    resetStopPromise();
});

export interface ClockEmitter extends EventEmitter {
    emit(type: 'clock-updated', date: Date): boolean;
    emit(type: 'config-update', config: Partial<ClockConfig>): boolean;
    emit(type: 'start-clock'): boolean;
    emit(type: 'print-text', config: Partial<TextConfig>): boolean;
    emit(type: 'stop-clock'): boolean;

    on(type: 'clock-updated', listener: (date: Date) => void): this;
    on(type: 'print-text', listener: (config: Partial<TextConfig>) => void): this;
    on(type: 'config-update', listener: (config: ClockConfig) => void): this;
    on(type: 'start-clock', listener: () => void): this;
    on(type: 'stop-clock', listener: () => void): this;

    once(type: 'config-update', listener: (config: Partial<ClockConfig>) => void): this;
    once(type: 'stop-clock', listener: () => void): this;
    once(type: 'print-text', listener: (config: Partial<TextConfig>) => void): this;
    once(type: 'clock-updated', listener: (date: Date) => void): this;
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
    const emitter = new EventEmitter() as ClockEmitter;

    function checkClock() {
        const now = new Date();
        const timeString = getFormattedTimeString(now, config);

        const textOptions = [
            {
                backgroundColor: config.backgroundColor,
                foregroundColor: config.foregroundColor,
                monospace: true,
            },
            {
                backgroundColor: config.backgroundColor,
                foregroundColor: config.foregroundColor,
                monospace: false,
            },
        ];

        if (lastTime !== timeString) {
            lastTime = timeString;
            if (!drawText(50, timeString, textOptions, {
                padding: MatrixPaddingOption.BOTH,
                width: config.displayWidth,
            })) {
                throw new Error('Drawing failed');
            }
            emitter.emit('clock-updated', now);
        }
        if (config.running) {
            setTimeout(() => checkClock(), config.checkIntervalMs);
        }
    }

    let config = overrideDefinedProperties(defaultConfig, inputConfig);

    emitter.on('print-text', textConfig => {
        resetStopPromise();
        const timeout = setTimeout(() => {
            emitter.emit('start-clock');
            resetStopPromise();
        }, 5000);
        stopPromise.then(() => clearTimeout(timeout));
        emitter.emit('stop-clock');
        if (textConfig.text) {
            drawScrollingText(32, 50, textConfig.text, {foregroundColor: LedColor.CYAN}, {stopPromise});
        }
    });

    let lastTime = '';
    emitter.on('config-update', newConfig => {
        config = overrideDefinedProperties(config, newConfig);
    });

    emitter.on('stop-clock', () => {
        lastTime = '';
        config.running = false;
    });

    emitter.on('start-clock', () => {
        config.running = true;
        checkClock();
    });

    checkClock();

    return emitter;
}
