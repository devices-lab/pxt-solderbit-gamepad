//% weight=100 color=190 icon="\uf11b" block="solder:bit Gamepad"
//% groups="['Buttons', 'NeoPixels']"
namespace gamepad {
    // Pins setup
    let serialOut = DigitalPin.P0;
    let parallelLoad = DigitalPin.P1;
    let clock = DigitalPin.P2;

    // Constants
    const NUM_BUTTONS = 8;
    const DEBOUNCE_INTERVAL = 50; // Debounce time in milliseconds

    // Variables to track button state and debounce
    let lastButtonStates = 0;
    let lastDebounceTime = control.millis();

    // Enum for button mapping
    export enum Button {
        RightBumper = 0,
        LeftBumper = 1,
        Right = 2,
        Up = 3,
        Left = 4,
        Down = 5,
        Y = 6,
        X = 7
    }

    //% block="button $button is pressed"
    //% group="Buttons"
    export function isButtonPressed(button: Button): boolean {
        let buttonStates = readShiftRegister();
        return (buttonStates & (1 << button)) !== 0;
    }

    function readShiftRegister(): number {
        pins.digitalWritePin(parallelLoad, 0);
        control.waitMicros(5);
        pins.digitalWritePin(parallelLoad, 1);

        let buttonStates = 0;
        for (let i = 0; i < NUM_BUTTONS; i++) {
            pins.digitalWritePin(clock, 0);
            control.waitMicros(2); // Clock pulse width
            if (pins.digitalReadPin(serialOut) === 1) {
                buttonStates |= (1 << (NUM_BUTTONS - 1 - i));
            }
            pins.digitalWritePin(clock, 1);
            control.waitMicros(2); // Ensure clock high time
        }
        return buttonStates;
    }

    // Event handlers storage
    let buttonPressHandlers: { [key: number]: () => void } = {};
    let buttonReleaseHandlers: { [key: number]: () => void } = {};

    //% block="on button $button pressed"
    //% group="Buttons"
    export function onButtonPressed(button: Button, handler: () => void) {
        buttonPressHandlers[button] = handler;
    }

    //% block="on button $button released"
    //% group="Buttons"
    export function onButtonReleased(button: Button, handler: () => void) {
        buttonReleaseHandlers[button] = handler;
    }

    // Monitoring button state changes
    control.inBackground(() => {
        while (true) {
            let currentMillis = control.millis();
            if (currentMillis - lastDebounceTime > DEBOUNCE_INTERVAL) {
                let newButtonStates = readShiftRegister();
                if (newButtonStates !== lastButtonStates) {
                    for (let i = 0; i < NUM_BUTTONS; i++) {
                        let mask = 1 << i;
                        if ((newButtonStates & mask) !== (lastButtonStates & mask)) {
                            if ((newButtonStates & mask) !== 0 && buttonPressHandlers[i]) {
                                buttonPressHandlers[i]();
                            } else if ((newButtonStates & mask) === 0 && buttonReleaseHandlers[i]) {
                                buttonReleaseHandlers[i]();
                            }
                        }
                    }
                    lastButtonStates = newButtonStates;
                }
                lastDebounceTime = currentMillis;
            }
            basic.pause(10);
        }
    });
}
