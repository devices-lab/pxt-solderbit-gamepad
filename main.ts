/**
 * Provides access to basic micro:bit functionality.
 */
//% color=190 weight=100 icon="\uf1ec" block="solder:bit Gamepad"
namespace solderbitGamepad {
    // Define an enumeration for the buttons
    export enum Button {
        DPadLeft = 0,
        DPadRight = 1,
        DPadUp = 2,
        DPadDown = 3,
        LeftBumper = 4,
        RightBumper = 5,
        ButtonX = 6,
        ButtonY = 7
    }

    // Fixed pin assignments
    const SERIAL_OUT = DigitalPin.P0;
    const PARALLEL_LOAD = DigitalPin.P1;
    const CLOCK = DigitalPin.P2;

    function setupShiftRegister(): void {
        pins.digitalWritePin(PARALLEL_LOAD, 0);
        pins.digitalWritePin(CLOCK, 0);
        control.waitMicros(10);
        pins.digitalWritePin(PARALLEL_LOAD, 1);
    }

    function readShiftRegister(): number {
        pins.digitalWritePin(PARALLEL_LOAD, 0);
        control.waitMicros(5); // Wait a bit for hardware to settle
        pins.digitalWritePin(PARALLEL_LOAD, 1);

        let buttonStates = 0;
        for (let i = 0; i < 8; i++) {
            pins.digitalWritePin(CLOCK, 1);
            control.waitMicros(2); // Short pulse
            pins.digitalWritePin(CLOCK, 0);

            let value = pins.digitalReadPin(SERIAL_OUT);
            buttonStates |= (value << (7 - i));
        }
        return buttonStates;
    }

    /**
     * Checks if a specific button, as named, is pressed.
     */
    //% block="button $button is pressed"
    export function isButtonPressed(button: Button): boolean {
        let buttonStates = readShiftRegister();
        return (buttonStates & (1 << button)) !== 0;
    }

    control.runInBackground(setupShiftRegister);
}