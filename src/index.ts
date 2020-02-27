import {LedColor, drawText, MatrixPaddingOption} from 'ws2812draw';

type ClockConfig = {
    timeFormat: 24 | 12;
    checkIntervalMs: number;
    displayWidth: number;
};

const defaultConfig: ClockConfig = {
    timeFormat: 24,
    checkIntervalMs: 500,
    displayWidth: 32,
};

function startClock(config: ClockConfig = defaultConfig) {
    function checkClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();

        if (config.timeFormat === 12 && hours > 12) {
            hours = hours - 12;
        }
        const timeString = `${String(hours).length < 2 ? ' ' : ''}${hours}:${
            String(minutes).length < 2 ? '0' : ''
        }${minutes}`;
        const textOptions = [
            {foregroundColor: LedColor.CYAN, monospace: true},
            {foregroundColor: LedColor.CYAN, monospace: false},
        ];

        drawText(50, timeString, textOptions, {padding: MatrixPaddingOption.BOTH, width: config.displayWidth});
        setTimeout(() => checkClock(), config.checkIntervalMs);
    }
    checkClock();
}

console.log('starting clock');
startClock();
