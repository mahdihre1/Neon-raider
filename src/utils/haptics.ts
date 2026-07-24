// Mobile Haptic Feedback Manager
export class HapticFeedback {
  public static enabled: boolean = true;

  // Light tap for menu buttons, scrap collection
  public static tap() {
    if (!this.enabled || typeof window === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(10);
    } catch {
      // Ignored if device doesn't permit vibration
    }
  }

  // Medium vibration for powerups, weapon switch, EMP charge
  public static medium() {
    if (!this.enabled || typeof window === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(30);
    } catch {
      // Ignored
    }
  }

  // Heavy double-pulse vibration for ship damage or boss hit
  public static impact() {
    if (!this.enabled || typeof window === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate([40, 30, 40]);
    } catch {
      // Ignored
    }
  }

  // Intense rumbling pattern for screen EMP blast or boss explosion
  public static heavyRumble() {
    if (!this.enabled || typeof window === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate([60, 40, 80, 40, 120]);
    } catch {
      // Ignored
    }
  }
}
