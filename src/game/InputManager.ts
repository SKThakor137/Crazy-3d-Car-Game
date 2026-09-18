export interface InputState {
  throttle: number;      // -1 (reverse) to 1 (forward)
  steer: number;         // -1 (left) to 1 (right)
  handbrake: boolean;    // space / virtual handbrake
  nitro: boolean;        // shift / virtual nitro
  resetRequested: boolean;
  pauseRequested: boolean;
  viewToggleRequested: boolean;
}

export class InputManager {
  private static keys: Record<string, boolean> = {};
  private static touchState = {
    accelerate: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
    nitro: false,
    reset: false,
    pause: false,
  };

  private static resetFlag = false;
  private static pauseFlag = false;
  private static viewToggleFlag = false;
  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.isInitialized = true;
  }

  public static destroy(): void {
    if (!this.isInitialized || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.isInitialized = false;
    this.keys = {};
  }

  private static handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    const key = e.key ? e.key.toLowerCase() : '';

    // Prevent scrolling for game controls
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code) || ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      e.preventDefault();
    }

    this.keys[code] = true;
    if (key) this.keys[key] = true;

    if (code === 'KeyR' || key === 'r') {
      this.resetFlag = true;
    }
    if (code === 'Escape' || code === 'KeyP' || key === 'escape' || key === 'p') {
      this.pauseFlag = true;
    }
    if (code === 'KeyC' || code === 'KeyV' || key === 'c' || key === 'v') {
      this.viewToggleFlag = true;
    }
  };

  private static handleKeyUp = (e: KeyboardEvent): void => {
    const code = e.code;
    const key = e.key ? e.key.toLowerCase() : '';
    this.keys[code] = false;
    if (key) this.keys[key] = false;
  };

  private static handleBlur = (): void => {
    this.keys = {};
    this.touchState = {
      accelerate: false,
      brake: false,
      steerLeft: false,
      steerRight: false,
      handbrake: false,
      nitro: false,
      reset: false,
      pause: false,
    };
  };

  // Virtual touch controls triggers
  public static setTouchInput(action: keyof typeof InputManager.touchState, value: boolean): void {
    this.touchState[action] = value;
    if (action === 'reset' && value) {
      this.resetFlag = true;
    }
    if (action === 'pause' && value) {
      this.pauseFlag = true;
    }
  }

  public static requestReset(): void {
    this.resetFlag = true;
  }

  public static requestPause(): void {
    this.pauseFlag = true;
  }

  public static requestViewToggle(): void {
    this.viewToggleFlag = true;
  }

  public static getState(sensitivity = 1.0): InputState {
    const k = this.keys;
    const t = this.touchState;

    // Forward / Reverse throttle
    let throttle = 0;
    const fwd = k['KeyW'] || k['w'] || k['ArrowUp'] || k['arrowup'] || t.accelerate;
    const rev = k['KeyS'] || k['s'] || k['ArrowDown'] || k['arrowdown'] || t.brake;
    if (fwd) throttle += 1;
    if (rev) throttle -= 1;

    // Left / Right steering
    let steer = 0;
    const left = k['KeyA'] || k['a'] || k['ArrowLeft'] || k['arrowleft'] || t.steerLeft;
    const right = k['KeyD'] || k['d'] || k['ArrowRight'] || k['arrowright'] || t.steerRight;
    if (left) steer -= 1;
    if (right) steer += 1;
    steer *= sensitivity;

    // Handbrake
    const handbrake = !!(k['Space'] || k[' '] || t.handbrake);

    // Nitro
    const nitro = !!(k['ShiftLeft'] || k['ShiftRight'] || k['shift'] || t.nitro);

    const resetReq = this.resetFlag;
    this.resetFlag = false;

    const pauseReq = this.pauseFlag;
    this.pauseFlag = false;

    const viewToggleReq = this.viewToggleFlag;
    this.viewToggleFlag = false;

    return {
      throttle,
      steer: Math.max(-1, Math.min(1, steer)),
      handbrake,
      nitro,
      resetRequested: resetReq,
      pauseRequested: pauseReq,
      viewToggleRequested: viewToggleReq,
    };
  }
}

