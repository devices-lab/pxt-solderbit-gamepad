//% weight=100 color=190 icon="\uf11b" block="solder:bit Gamepad"
namespace gamepad {
    // Pins setup
    let serialOut = DigitalPin.P0;
    let parallelLoad = DigitalPin.P1;
    let clock = DigitalPin.P2;

    // Constants
    const NUM_BUTTONS = 8;

    // Enum for button mapping
    export enum Button {
        //% block="right bumper"
        RightBumper = 0,
        //% block="left bumper"
        LeftBumper = 1,
        //% block="right"
        Right = 2,
        //% block="up"
        Up = 3,
        //% block="left"
        Left = 4,
        //% block="down"
        Down = 5,
        //% block="Y"
        Y = 6,
        //% block="X"
        X = 7
    }

    /**
     * Read button states from the shift register
     */
    function readShiftRegister(): number {
        // Pulse the parallel load to load the button states
        pins.digitalWritePin(parallelLoad, 0);
        control.waitMicros(5);
        pins.digitalWritePin(parallelLoad, 1);

        // Read the serial output from the shift register
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

    /**
     * Check if a specific button is pressed
     */
    //% block="button $button is pressed"
    export function isButtonPressed(button: Button): boolean {
        let buttonStates = readShiftRegister();
        return (buttonStates & (1 << button)) !== 0;
    }
}
