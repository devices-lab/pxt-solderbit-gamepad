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

  // // Set-up for the NeoPixels
  // let neoPixelStrip = neopixel.create(DigitalPin.P1, 5, NeoPixelMode.RGB)
  // neoPixelStrip.clear()
  // neoPixelStrip.show()

  // /**
  //  * This variable returns the internal reference to the NeoPixel strip on the
  //  * solder:bit, so it can be used with the NeoPixel extension.
  //  */
  // //% block="the ClipBit Pixel Strip"
  // //% group="Pixels and LEDs" advanced="true"
  // export function clipBitPixels() : neopixel.Strip {
  //     return neoPixelStrip
  // }

  // Enum for button mapping, adjusted to powers of two
  export enum Button {
    RightBumper = 1, // 2^0
    LeftBumper = 2, // 2^1
    Right = 4, // 2^2
    Up = 8, // 2^3
    Left = 16, // 2^4
    Down = 32, // 2^5
    Y = 64, // 2^6
    X = 128, // 2^7
  }

  // Function to check a specific button press using bit mask
  //% block="button $button is pressed"
  //% group="Buttons"
  export function isButtonPressed(button: Button): boolean {
    let buttonStates = readShiftRegister();
    return (buttonStates & button) !== 0; // Use the button enum directly as a mask
  }

  // Add logic block for checking button press in 'if' statements
  //% block="if button $button is pressed"
  //% group="Buttons"
  export function ifButtonPressed(button: Button): boolean {
    return isButtonPressed(button);
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
        buttonStates |= 1 << (NUM_BUTTONS - 1 - i);
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
              } else if (
                (newButtonStates & mask) === 0 &&
                buttonReleaseHandlers[i]
              ) {
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
