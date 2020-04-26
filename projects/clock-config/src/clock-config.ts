import {LedColor} from 'ws2812draw';

export type ClockModeConfig = {
    backgroundColor: LedColor;
    brightness: number;
    foregroundColor: LedColor;
}

export enum ClockMode {
    DARK = 'dark',
    DEFAULT = 'light',
    LIGHT = 'light'
}

export type ClockConfig = {
    displayWidth: number;
    lightSensorBcmPin: number;
    modes: {
        [key in ClockMode]: ClockModeConfig;
    };
    sampleIntervalMs: number;
    timeFormat: 24 | 12;
};

export type ClockTextConfig = {
    backgroundColor?: LedColor;
    brightness?: number;
    foregroundColor?: LedColor;
    text: string;
};

export type ClockUpdatedEventData = {
    mode: ClockMode;
    time: Date;
}

export type ClockStatus = {
    clockRunning: boolean;
    config: ClockConfig;
    currentlyScrolling: boolean;
    lastMode: ClockMode;
    lastTimeString: string;
}
