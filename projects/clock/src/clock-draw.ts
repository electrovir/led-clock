import {EventEmitter} from 'events';

import {overrideDefinedProperties} from '../../util/object';

import {Gpio} from 'onoff';
import {
    LedColor,
    MatrixPaddingOption,
    drawText,
    drawScrollingText,
    ScrollEmitter,
    drawStill,
    matrix,
} from 'ws2812draw';
import {addExitCallback} from 'catch-exit';
import {
    ClockConfig,
    ClockMode,
    ClockTextConfig,
    ClockUpdatedEventData,
    ClockStatus,
} from 'clock-config/src/clock-config';

const defaultConfig: ClockConfig = {
    displayWidth: 32,
    lightSensorBcmPin: 4,
    modes: {
        [ClockMode.DARK]: {
            backgroundColor: LedColor.BLACK,
            brightness: 25,
            foregroundColor: LedColor.RED,
        },
        [ClockMode.LIGHT]: {
            backgroundColor: LedColor.BLACK,
            brightness: 75,
            foregroundColor: LedColor.CYAN,
        },
    },
    sampleIntervalMs: 16,
    timeFormat: 24,
};

// const defaultTextConfig: Required<TextConfig> = {
//     text: '',
//     ...defaultConfig,
// };

export interface ClockEmitter extends EventEmitter {
    emit(type: 'clock-stopped'): boolean;
    emit(type: 'clock-updated', data: ClockUpdatedEventData): boolean;
    emit(type: 'config-update', config: Partial<ClockConfig>): boolean;
    emit(type: 'print-text', config: Partial<ClockTextConfig>): boolean;
    emit(type: 'scrolling-done'): boolean;
    emit(type: 'start-clock'): boolean;
    emit(type: 'stop-clock'): boolean;

    getCurrentStatus(): ClockStatus;

    on(type: 'clock-stopped', listener: () => void): this;
    on(type: 'clock-updated', listener: (data: ClockUpdatedEventData) => void): this;
    on(type: 'config-update', listener: (config: ClockConfig) => void): this;
    on(type: 'print-text', listener: (config: Partial<ClockTextConfig>) => void): this;
    on(type: 'scrolling-done', listener: () => void): this;
    on(type: 'start-clock', listener: () => void): this;
    on(type: 'stop-clock', listener: () => void): this;

    once(type: 'clock-stopped', listener: () => void): this;
    once(type: 'clock-updated', listener: (data: ClockUpdatedEventData) => void): this;
    once(type: 'config-update', listener: (config: Partial<ClockConfig>) => void): this;
    once(type: 'print-text', listener: (config: Partial<ClockTextConfig>) => void): this;
    once(type: 'scrolling-done', listener: () => void): this;
    once(type: 'start-clock', listener: () => void): this;
    once(type: 'stop-clock', listener: () => void): this;
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

async function isBrightOut(sensor: Gpio): Promise<boolean> {
    const readValue = await sensor.read();
    return !readValue;
}

async function getCurrentMode(lightSensor: Gpio): Promise<ClockMode> {
    if (await isBrightOut(lightSensor)) {
        return ClockMode.LIGHT;
    } else {
        return ClockMode.DARK;
    }
}

export function startClock(inputConfig: Partial<ClockConfig> = {}) {
    let config = overrideDefinedProperties(defaultConfig, inputConfig);

    const clockEmitter = new EventEmitter() as ClockEmitter;
    const lightSensor = new Gpio(config.lightSensorBcmPin, 'in');

    let lastTimeString = '';
    let lastMode = ClockMode.DEFAULT;
    let scrollEmitter: ScrollEmitter|undefined;
    let clockSamplingEnabled = true;

    async function sampleCurrentTime() {
        const now = new Date();
        const timeString = getFormattedTimeString(now, config);

        const currentMode = await getCurrentMode(lightSensor);
        const modeConfig = config.modes[currentMode];

        const textOptions = [
            // make sure the first character is monospace so that when it's empty,
            // it still takes up a full letter's width
            {
                backgroundColor: modeConfig.backgroundColor,
                foregroundColor: modeConfig.foregroundColor,
                monospace: true,
            },
            {
                backgroundColor: modeConfig.backgroundColor,
                foregroundColor: modeConfig.foregroundColor,
                monospace: false,
            },
        ];

        if (lastTimeString !== timeString || lastMode !== currentMode) {
            lastTimeString = timeString;
            lastMode = currentMode;
            drawText(modeConfig.brightness, timeString, textOptions, {
                padding: MatrixPaddingOption.BOTH,
                width: config.displayWidth,
            });
            clockEmitter.emit('clock-updated', {
                mode: currentMode,
                time: now,
            });
        }
        if (clockSamplingEnabled) {
            setTimeout(() => sampleCurrentTime(), config.sampleIntervalMs);
        } else {
            clockEmitter.emit('clock-stopped');
        }
    }

    clockEmitter.on('print-text', textConfig => {
        if (scrollEmitter) {
            return;
        }
        clockEmitter.once('clock-stopped', () => {
            if (textConfig.text) {
                scrollEmitter = drawScrollingText(config.displayWidth, 50, textConfig.text,
                    {foregroundColor: LedColor.CYAN}, {
                        drawAfterLastScroll: false,
                        emptyFrameBetweenLoops: true,
                        loopCount: 2,
                        loopDelayMs: 2000,
                        padding: MatrixPaddingOption.LEFT,
                    });
                scrollEmitter.on('done', () => {
                    scrollEmitter = undefined;
                    clockEmitter.emit('scrolling-done');
                });
            }
        });
        clockEmitter.emit('stop-clock');
    });

    clockEmitter.on('config-update', newConfig => {
        config = overrideDefinedProperties(config, newConfig);
    });

    clockEmitter.on('scrolling-done', () => {
        clockEmitter.emit('start-clock');
    });

    clockEmitter.on('stop-clock', () => {
        clockSamplingEnabled = false;
    });

    clockEmitter.on('start-clock', () => {
        clockSamplingEnabled = true;
        lastTimeString = '';
        sampleCurrentTime().catch(error => {
            throw error;
        });
    });

    clockEmitter.getCurrentStatus = () => {
        const status: ClockStatus = {
            clockRunning: clockSamplingEnabled,
            config,
            currentlyScrolling: !!scrollEmitter,
            lastMode,
            lastTimeString,
        };
        return JSON.parse(JSON.stringify(status));
    };

    clockEmitter.emit('start-clock');

    return clockEmitter;
}

addExitCallback(() => {
    drawStill(0, matrix.createMatrix(8, 32, LedColor.BLACK));
});
