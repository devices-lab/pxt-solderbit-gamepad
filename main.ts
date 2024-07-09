/**
 * Provides access to basic micro:bit functionality.
 */
//% color=190 weight=100 icon="\uf1ec" block="solder:bit Gamepad"
namespace solderbitGamepad {
    // Fixed pin assignments
    const SERIAL_OUT = DigitalPin.P0;
    const PARALLEL_LOAD = DigitalPin.P1;
    const CLOCK = DigitalPin.P2;

    /**
     * Initializes the shift register pins and sets initial states.
     */
    function setupShiftRegister(): void {
        pins.digitalWritePin(PARALLEL_LOAD, 0);
        pins.digitalWritePin(CLOCK, 0);
        control.waitMicros(10);
        pins.digitalWritePin(PARALLEL_LOAD, 1);
    }

    /**
     * Reads the button states from the shift register.
     */
    function readShiftRegister(): number {
        // Pulse the load pin
        pins.digitalWritePin(PARALLEL_LOAD, 0);
        control.waitMicros(5); // Wait a bit for hardware to settle
        pins.digitalWritePin(PARALLEL_LOAD, 1);

        let buttonStates = 0;
        for (let i = 0; i < 8; i++) {
            // Clock the shift register
            pins.digitalWritePin(CLOCK, 1);
            control.waitMicros(2); // Short pulse
            pins.digitalWritePin(CLOCK, 0);

            // Read the serial output
            let value = pins.digitalReadPin(SERIAL_OUT);
            buttonStates |= (value << (7 - i));
        }
        return buttonStates;
    }

    /**
     * Checks if a specific button is pressed.
     */
    //% block="button $buttonNum is pressed"
    //% buttonNum.defl=1
    export function isButtonPressed(buttonNum: number): boolean {
        let buttonStates = readShiftRegister();
        return (buttonStates & (1 << (buttonNum - 1))) !== 0;
    }

    // Automatically setup the shift register when the extension is loaded
    control.runInBackground(setupShiftRegister);
}
