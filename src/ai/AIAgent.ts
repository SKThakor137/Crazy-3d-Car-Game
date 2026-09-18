import * as THREE from 'three';
import { CarConfig } from '../data/CarConfigs';
import { TrackData } from '../tracks/TrackGenerator';
import { MathUtils } from '../utils/MathUtils';
import { AIDifficulty } from '../game/GameStateContext';

export interface AIProfile {
  id: string;
  name: string;
  carConfig: CarConfig;
  color: string;
  laneOffset: number;        // lateral offset from centerline (-3.5 to 3.5)
  aggression: number;        // 0.8 to 1.2
  skill: number;             // 0.8 to 1.0
}

export class AIAgent {
  public profile: AIProfile;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public heading: number;
  public speed: number;
  public steeringAngle: number;
  public splineT: number;
  public lap: number;
  public totalDistance: number;
  public isBoosting: boolean;
  public isBraking: boolean;
  public finished: boolean;
  public finishTime: number;

  private trackData: TrackData;
  private difficulty: AIDifficulty;
  private nitroCooldown = 10;
  private currentNitroTime = 0;

  constructor(
    profile: AIProfile,
    trackData: TrackData,
    initialPos: THREE.Vector3,
    initialRot: THREE.Euler,
    difficulty: AIDifficulty
  ) {
    this.profile = profile;
    this.trackData = trackData;
    this.difficulty = difficulty;

    this.position = initialPos.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = initialRot.y;
    this.speed = 0;
    this.steeringAngle = 0;
    this.splineT = 0;
    this.lap = 1;
    this.totalDistance = 0;
    this.isBoosting = false;
    this.isBraking = false;
    this.finished = false;
    this.finishTime = 0;
    this.bestLapTime = 0;
    this.currentLapStartTime = 0;
    this.topSpeedKmH = 0;
    this.lastT = 0;
  }

  public bestLapTime: number;
  public topSpeedKmH: number;
  private currentLapStartTime: number;
  private lastT: number;

  public update(dt: number, totalLaps: number, otherCarPositions: THREE.Vector3[], raceTime = 0): void {
    if (this.finished) {
      this.speed = Math.max(0, this.speed - 20 * dt);
      return;
    }

    const p = this.profile.carConfig.physics;
    const spline = this.trackData.spline;

    // Difficulty multiplier (tuned so player can reliably compete and win)
    const diffMultiplier =
      this.difficulty === 'Easy' ? 0.72 :
      this.difficulty === 'Normal' ? 0.86 : 0.96;

    const maxSpeed = p.topSpeed * diffMultiplier * this.profile.skill;

    // 1. Determine spline position & target point ahead
    const closest = MathUtils.getClosestTOnCurve(spline, this.position, 40, this.splineT);
    this.splineT = closest.t;

    // Monotonic progression: negative progress if starting behind start line on lap 1
    let progressT = this.splineT;
    if (this.lap === 1 && progressT > 0.85) {
      progressT = progressT - 1.0;
    }
    this.totalDistance = (this.lap - 1) + progressT;

    // Look-ahead distance along curve (e.g. 15-25 units ahead depending on speed)
    const lookAheadUnits = 14 + (this.speed / maxSpeed) * 12;
    const lookAheadT = (this.splineT + lookAheadUnits / this.trackData.totalLength) % 1.0;

    const targetCenterPt = spline.getPointAt(lookAheadT);
    const targetTangent = spline.getTangentAt(lookAheadT).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const targetNormal = new THREE.Vector3().crossVectors(targetTangent, up).normalize();

    // 2. Obstacle & Overtaking avoidance
    let desiredLane = this.profile.laneOffset;
    for (const otherPos of otherCarPositions) {
      if (otherPos === this.position) continue;
      const toOther = otherPos.clone().sub(this.position);
      const dist = toOther.length();
      if (dist < 12) {
        // Car is close: avoid by shifting lane
        const dotFwd = toOther.dot(new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)));
        if (dotFwd > 0) { // car is ahead
          desiredLane = desiredLane > 0 ? -2.5 : 2.5;
        }
      }
    }

    const targetPos = targetCenterPt.clone().add(targetNormal.clone().multiplyScalar(desiredLane));

    // 3. Compute Steering towards target
    const toTarget = targetPos.clone().sub(this.position);
    const desiredHeading = Math.atan2(toTarget.x, toTarget.z);
    const angleDiff = MathUtils.angleDiff(this.heading, desiredHeading);

    const steerTarget = MathUtils.clamp(angleDiff * 1.5, -p.steerAngleMax, p.steerAngleMax);
    this.steeringAngle = MathUtils.damp(this.steeringAngle, steerTarget, 10, dt);

    // Apply heading change towards desired heading
    const turnFactor = Math.min(1.0, this.speed / 10);
    this.heading += this.steeringAngle * p.turnSpeed * turnFactor * dt;

    // 4. Speed & Cornering Braking
    // Tight turns require deceleration
    const turnSeverity = Math.abs(angleDiff);
    let targetSpeed = maxSpeed;
    if (turnSeverity > 0.4) {
      targetSpeed *= Math.max(0.45, 1.0 - turnSeverity * 0.7);
      this.isBraking = true;
    } else {
      this.isBraking = false;
    }

    // Nitro usage on straights (Normal & Hard)
    if (this.difficulty !== 'Easy' && turnSeverity < 0.15 && this.speed > maxSpeed * 0.85) {
      this.currentNitroTime += dt;
      if (this.currentNitroTime > this.nitroCooldown) {
        this.isBoosting = true;
        targetSpeed *= 1.35;
        if (this.currentNitroTime > this.nitroCooldown + 3.0) {
          this.isBoosting = false;
          this.currentNitroTime = 0;
        }
      }
    } else {
      this.isBoosting = false;
    }

    // Accelerate / Brake towards target speed
    if (this.speed < targetSpeed) {
      this.speed += p.accelerationRate * (this.isBoosting ? 1.5 : 0.85) * dt;
    } else {
      this.speed -= p.brakingRate * dt;
    }

    // 5. Update Position & Top Speed
    const fwd = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)).normalize();
    this.position.addScaledVector(fwd, this.speed * dt);
    this.position.y = MathUtils.damp(this.position.y, closest.point.y, 16, dt);

    const speedKmH = MathUtils.toKmH(this.speed);
    if (speedKmH > this.topSpeedKmH) this.topSpeedKmH = Math.round(speedKmH);

    // 6. Lap counting: detect passing start/finish line (wrapping t from > 0.85 to < 0.15)
    if (this.lastT > 0.85 && this.splineT < 0.15) {
      if (this.currentLapStartTime > 0) {
        const lapDuration = raceTime - this.currentLapStartTime;
        if (lapDuration > 10 && (this.bestLapTime === 0 || lapDuration < this.bestLapTime)) {
          this.bestLapTime = parseFloat(lapDuration.toFixed(2));
        }
      }
      this.currentLapStartTime = raceTime;

      this.lap++;
      if (this.lap > totalLaps) {
        this.finished = true;
        this.finishTime = parseFloat(raceTime.toFixed(2));
      }
    }
    this.lastT = this.splineT;
  }
}

