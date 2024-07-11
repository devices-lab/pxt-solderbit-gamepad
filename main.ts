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
    //% block="right trigger"
    RightBumper = 1 << 0, // 0b00000001
    //% block="left trigger"
    LeftBumper = 1 << 1, // 0b00000010
    //% block="right"
    Right = 1 << 2, // 0b00000100
    //% block="up"
    Up = 1 << 3, // 0b00001000
    //% block="left"
    Left = 1 << 4, // 0b00010000
    //% block="down"
    Down = 1 << 5, // 0b00100000
    //% block="Y"
    Y = 1 << 6, // 0b01000000
    //% block="X"
    X = 1 << 7, // 0b10000000
  }

  const strip = neopixel.create(DigitalPin.P1, 5, NeoPixelMode.RGB);
  strip.clear();
  strip.show();

  //% block="the solder:bit NeoPixel array"
  //% group="NeoPixels" advanced="true"
  export function solderbitPixels(): neopixel.Strip {
    return strip;
  }

  /**
   * Clears all color data for the pixels, and turns them off
   */
  //% block="turn off all Gamepad NeoPixels"
  //% group="NeoPixels
  export function clearAllGamepadPixels() {
    led.enable(false);
    strip.clear();
    strip.show();
    led.enable(true);
  }

  //% block="is Gamepad button $button pressed"
  //% group="Buttons"
  export function isButtonPressed(button: Button): boolean {
    let buttonStates = readShiftRegister();
    return (buttonStates & button) !== 0;
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
        buttonStates |= 1 << i;
      }
      pins.digitalWritePin(clock, 1);
      control.waitMicros(2); // Ensure clock high time
    }
    return buttonStates;
  }

  // Event handlers storage
  let buttonPressHandlers: { [key: number]: () => void } = {};
  let buttonReleaseHandlers: { [key: number]: () => void } = {};

  //% block="on Gamepad button $button pressed"
  //% group="Buttons"
  export function onButtonPressed(button: Button, handler: () => void) {
    buttonPressHandlers[button] = handler;
  }

  //% block="on Gamepad button $button released"
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
