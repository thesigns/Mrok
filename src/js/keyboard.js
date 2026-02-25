const COMPASS_KEYS = {
  KeyQ: { dx: -1, dy: -1 },
  KeyW: { dx:  0, dy: -1 },
  KeyE: { dx:  1, dy: -1 },
  KeyA: { dx: -1, dy:  0 },
  KeyS: { dx:  0, dy:  0 },
  KeyD: { dx:  1, dy:  0 },
  KeyZ: { dx: -1, dy:  1 },
  KeyX: { dx:  0, dy:  1 },
  KeyC: { dx:  1, dy:  1 },
};

export class Keyboard {
  constructor({ onCompass, onHandle, onMenu, isActive }) {
    this.onCompass = onCompass;
    this.onHandle = onHandle;
    this.onMenu = onMenu;
    this.isActive = isActive;
    this.heldKey = null;
    this.repeatTimeout = null;
    this.repeatInterval = null;

    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.addEventListener("keyup", (e) => this.handleKeyUp(e));
  }

  handleKeyDown(e) {
    if (e.repeat || !this.isActive()) return;

    const compass = COMPASS_KEYS[e.code];
    if (compass) {
      e.preventDefault();
      this.onCompass(compass.dx, compass.dy);
      this.stopRepeat();
      this.heldKey = e.code;
      this.repeatTimeout = setTimeout(() => {
        this.repeatInterval = setInterval(() => {
          this.onCompass(compass.dx, compass.dy);
        }, 100);
      }, 500);
      return;
    }

    if (e.code === "KeyH") {
      e.preventDefault();
      this.onHandle();
      return;
    }

    if (e.code === "KeyM") {
      e.preventDefault();
      this.onMenu();
    }
  }

  handleKeyUp(e) {
    if (e.code === this.heldKey) {
      this.stopRepeat();
    }
  }

  stopRepeat() {
    clearTimeout(this.repeatTimeout);
    clearInterval(this.repeatInterval);
    this.repeatTimeout = null;
    this.repeatInterval = null;
    this.heldKey = null;
  }
}
