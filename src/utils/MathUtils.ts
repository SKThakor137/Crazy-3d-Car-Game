import * as THREE from 'three';

export class MathUtils {
  static clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  // Smooth damping towards a target
  static damp(current: number, target: number, smoothing: number, dt: number): number {
    return this.lerp(current, target, 1 - Math.exp(-smoothing * dt));
  }

  // Format seconds into "01:23.45"
  static formatTime(seconds: number): string {
    if (seconds === Infinity || isNaN(seconds) || seconds <= 0) return '--:--.--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  }

  // Convert physics velocity units/sec to realistic display KM/H
  static toKmH(speedUnitsPerSec: number): number {
    return Math.round(Math.abs(speedUnitsPerSec) * 3.6 * 1.05);
  }

  // Angle difference between two angles in radians (-PI to PI)
  static angleDiff(a: number, b: number): number {
    let diff = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  // Generate CatmullRomCurve3 from control points
  static createTrackSpline(points: [number, number, number][]): THREE.CatmullRomCurve3 {
    const vPoints = points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    return new THREE.CatmullRomCurve3(vPoints, true, 'centripetal', 0.5);
  }

  // Find approximate parameter t [0, 1] on curve closest to target position
  static getClosestTOnCurve(
    curve: THREE.CatmullRomCurve3,
    position: THREE.Vector3,
    samples = 120,
    currentEstimateT?: number
  ): { t: number; point: THREE.Vector3; distanceSq: number } {
    let bestT = 0;
    let minDistanceSq = Infinity;
    const tempPoint = new THREE.Vector3();

    // If we already have a previous estimate, search in a window around it for efficiency
    if (currentEstimateT !== undefined) {
      const windowRange = 0.15; // search +- 15% of track
      const localSamples = 30;
      for (let i = -localSamples; i <= localSamples; i++) {
        let t = (currentEstimateT + (i / localSamples) * windowRange) % 1.0;
        if (t < 0) t += 1.0;
        curve.getPointAt(t, tempPoint);
        const distSq = tempPoint.distanceToSquared(position);
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          bestT = t;
        }
      }
      return { t: bestT, point: curve.getPointAt(bestT), distanceSq: minDistanceSq };
    }

    // Global sample search
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      curve.getPointAt(t, tempPoint);
      const distSq = tempPoint.distanceToSquared(position);
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        bestT = t;
      }
    }

    return { t: bestT, point: curve.getPointAt(bestT), distanceSq: minDistanceSq };
  }
}

