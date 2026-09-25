import * as THREE from 'three';
import { CarConfig } from '../data/CarConfigs';
import { MathUtils } from '../utils/MathUtils';
import { TrackData } from '../tracks/TrackGenerator';
import { SoundSynth } from '../audio/SoundSynth';

export interface CarPhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  heading: number;         // yaw angle around Y in radians
  pitch: number;           // pitch angle around X in radians (hills & jumps)
  angularVelocity: number;
  steeringAngle: number;
  speed: number;           // forward scalar speed (units/s)
  verticalVelocity: number;
  isAirborne: boolean;
  airTime: number;
  suspensionDip: number;   // compression displacement on landing
  justLanded: boolean;     // frame pulse on touchdown
  isWaterHazard: boolean;
  isMudHazard: boolean;
  isCaveZone: boolean;
  isDrifting: boolean;
  driftIntensity: number;  // 0 to 1
  nitroAmount: number;     // 0 to 100
  isBoosting: boolean;
  isBraking: boolean;
  isReversing: boolean;
  isOffTrack: boolean;
  hasCollided: boolean;
  collisionSeverity: number;
}

export class CarPhysics {
  public state: CarPhysicsState;
  private config: CarConfig;
  private trackData: TrackData;

  // Internal physics helper vectors
  private forwardVec = new THREE.Vector3();
  private rightVec = new THREE.Vector3();
  private targetHeading = 0;
  private lastTrackY = 0;
  private lastTrackPitch = 0;
  private uphillClimbTimer = 0;
  private peakClimbPitch = 0;
  private peakClimbVerticalSpeed = 0;
  private jumpCooldownTimer = 0;

  constructor(
    config: CarConfig,
    trackData: TrackData,
    initialPos: THREE.Vector3,
    initialRot: THREE.Euler
  ) {
    this.config = config;
    this.trackData = trackData;
    this.targetHeading = initialRot.y;
    this.lastTrackY = initialPos.y;
    this.lastTrackPitch = 0;

    this.state = {
      position: initialPos.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      heading: initialRot.y,
      pitch: 0,
      angularVelocity: 0,
      steeringAngle: 0,
      speed: 0,
      verticalVelocity: 0,
      isAirborne: false,
      airTime: 0,
      suspensionDip: 0,
      justLanded: false,
      isWaterHazard: false,
      isMudHazard: false,
      isCaveZone: false,
      isDrifting: false,
      driftIntensity: 0,
      nitroAmount: 100,
      isBoosting: false,
      isBraking: false,
      isReversing: false,
      isOffTrack: false,
      hasCollided: false,
      collisionSeverity: 0,
    };
  }

  public update(
    dt: number,
    throttleInput: number, // -1 to 1
    steerInput: number,    // -1 to 1
    handbrakeInput: boolean,
    nitroInput: boolean
  ): void {
    const p = this.config.physics;
    this.state.hasCollided = false;
    this.state.collisionSeverity = 0;

    // 1. Nitro Logic
    const wantsNitro = nitroInput && this.state.nitroAmount > 0.5 && throttleInput > 0;
    this.state.isBoosting = wantsNitro;
    if (wantsNitro) {
      this.state.nitroAmount = Math.max(0, this.state.nitroAmount - 24 * dt);
    } else {
      // Slow passive recharge, plus bonus if drifting
      const driftBonus = this.state.isDrifting ? 15 : 0;
      this.state.nitroAmount = Math.min(100, this.state.nitroAmount + (8 + driftBonus) * dt);
    }

    // 2. Throttle & Acceleration
    const speedRatio = Math.abs(this.state.speed) / p.topSpeed;
    const currentTopSpeed = p.topSpeed * (wantsNitro ? p.nitroMultiplier : 1.0);
    const accelPower = p.accelerationRate * (wantsNitro ? 1.7 : 1.0);

    this.state.isBraking = false;
    this.state.isReversing = false;

    if (throttleInput > 0) {
      if (this.state.speed < -0.5) {
        // Braking while going backwards
        this.state.speed += p.brakingRate * dt;
        this.state.isBraking = true;
      } else {
        // Accelerating forward
        const accelCurve = Math.max(0.2, 1.0 - Math.pow(speedRatio, 1.5));
        this.state.speed += throttleInput * accelPower * accelCurve * dt;
        if (this.state.speed > currentTopSpeed) {
          this.state.speed = MathUtils.damp(this.state.speed, currentTopSpeed, 3, dt);
        }
      }
    } else if (throttleInput < 0) {
      if (this.state.speed > 0.5) {
        // Braking while going forward
        this.state.speed -= p.brakingRate * dt;
        this.state.isBraking = true;
      } else {
        // Reversing
        this.state.speed -= p.reverseSpeed * 1.5 * dt;
        this.state.speed = Math.max(-p.reverseSpeed, this.state.speed);
        this.state.isReversing = true;
      }
    } else {
      // Passive rolling friction / coasting
      const friction = this.state.isDrifting ? 12 : 6;
      if (this.state.speed > 0) {
        this.state.speed = Math.max(0, this.state.speed - friction * dt);
      } else if (this.state.speed < 0) {
        this.state.speed = Math.min(0, this.state.speed + friction * dt);
      }
    }

    // 3. Steering & Drift Dynamics
    const targetSteer = steerInput * p.steerAngleMax;
    this.state.steeringAngle = MathUtils.damp(this.state.steeringAngle, targetSteer, 14, dt);

    // Drifting trigger: handbrake or hard steering at speed
    const isHardSteering = Math.abs(steerInput) > 0.6 && this.state.speed > 25;
    const canDrift = (handbrakeInput || isHardSteering) && Math.abs(this.state.speed) > 10;
    this.state.isDrifting = canDrift;

    if (this.state.isDrifting) {
      this.state.driftIntensity = MathUtils.damp(
        this.state.driftIntensity,
        Math.min(1.0, Math.abs(steerInput) * 0.8 + (handbrakeInput ? 0.4 : 0.1)),
        8,
        dt
      );
      // Slight speed bleed during heavy drift
      this.state.speed -= (handbrakeInput ? 16 : 8) * dt;
    } else {
      this.state.driftIntensity = MathUtils.damp(this.state.driftIntensity, 0, p.gripRecovery, dt);
    }

    // Yaw rotation: ensure strong steering even at low/zero speed so car can turn away from walls
    const speedTurnFactor = Math.max(0.85, Math.min(1.0, Math.abs(this.state.speed) / 10));
    const driftTurnMultiplier = this.state.isDrifting ? 1.45 : 1.0;
    const yawDelta = -this.state.steeringAngle * p.turnSpeed * speedTurnFactor * driftTurnMultiplier * dt;

    if (this.state.speed < 0) {
      // Invert steering when reversing
      this.state.heading -= yawDelta;
    } else {
      this.state.heading += yawDelta;
    }

    // 4. Update Vectors and Positions
    this.forwardVec.set(Math.sin(this.state.heading), 0, Math.cos(this.state.heading)).normalize();
    this.rightVec.set(this.forwardVec.z, 0, -this.forwardVec.x).normalize();

    // Lateral slip velocity
    let lateralGrip = this.state.isDrifting ? (1 - p.driftSlipFactor) : 0.95;
    if (this.state.isMudHazard) {
      lateralGrip *= 0.48; // Slippery loose mud rally physics
    }
    const forwardMovement = this.forwardVec.clone().multiplyScalar(this.state.speed * dt);
    const slipMovement = this.rightVec.clone().multiplyScalar(this.state.angularVelocity * dt * (1 - lateralGrip));

    this.state.velocity.copy(forwardMovement).add(slipMovement);
    this.state.position.add(forwardMovement);

    // 5. Track Conformance & Ground Height
    this.conformToTrack(dt);

    // 6. Track Boundary & Barrier Collision
    this.handleBarrierCollisions();
  }

  // 3D Airtime, Dhalan Jumps, Ballistic Gravity & Surface Hazards
  private conformToTrack(dt: number): void {
    const closest = MathUtils.getClosestTOnCurve(this.trackData.spline, this.state.position, 120);
    const targetY = closest.point.y;
    const tangent = this.trackData.spline.getTangentAt(closest.t).normalize();
    const trackPitch = Math.asin(Math.max(-1, Math.min(1, tangent.y)));

    this.state.justLanded = false;

    // Decay suspension dip
    if (this.state.suspensionDip > 0.001) {
      this.state.suspensionDip = MathUtils.damp(this.state.suspensionDip, 0, 10, dt);
    } else {
      this.state.suspensionDip = 0;
    }

    // ── NON-ADVENTURE TRACKS: simple smooth ground conform, NO jumps/hazards ──
    if (this.trackData.theme !== 'adventure') {
      this.state.position.y = MathUtils.damp(this.state.position.y, targetY - this.state.suspensionDip, 18, dt);
      this.state.pitch = MathUtils.damp(this.state.pitch, trackPitch, 14, dt);
      this.state.verticalVelocity = 0;
      this.state.isAirborne = false;
      this.state.airTime = 0;
      this.state.isWaterHazard = false;
      this.state.isMudHazard = false;
      this.state.isCaveZone = false;
      return;
    }

    // ── ADVENTURE TRACK: hazards, ramps, dhalan jumps ──
    const t = closest.t;

    // 1. Water zone (river crossing)
    const inWater = (t >= 0.28 && t <= 0.38);
    this.state.isWaterHazard = inWater;
    if (inWater) {
      this.state.speed *= (1.0 - 0.08 * dt);
    }

    // 2. Mud zone (deep off-road mud bogging — PUBG / Vice City style)
    const inMud = (t >= 0.46 && t <= 0.58);
    this.state.isMudHazard = inMud;
    if (inMud) {
      if (!this.state.isBoosting) {
        // Physical sinking: tires sink 0.22m into deep mud ruts!
        this.state.suspensionDip = MathUtils.damp(this.state.suspensionDip, 0.24, 6, dt);
        // Heavy viscous bog drag: slows car down to heavy chugging crawl (~22-26 km/h)
        const targetMudSpeed = Math.sign(this.state.speed) * Math.min(Math.abs(this.state.speed), 7.2);
        this.state.speed = MathUtils.damp(this.state.speed, targetMudSpeed, 3.2, dt);
        // Loose rally fishtailing
        this.state.isDrifting = Math.abs(this.state.speed) > 3;
        this.state.driftIntensity = 0.9;
      } else {
        // Nitro blast cuts through thick mud!
        this.state.suspensionDip = MathUtils.damp(this.state.suspensionDip, 0.08, 8, dt);
      }

      // Squelching bubbling mud churn sound
      if (Math.abs(this.state.speed) > 2.5 && Math.random() < 0.22) {
        SoundSynth.playMudSplat();
      }
    }

    // 3. Cave zone (continuous subterranean tunnel)
    this.state.isCaveZone = (t >= 0.66 && t <= 0.82);

    // 4. Slope / Dhalan / Jump Launch Dynamics
    // Decay jump cooldown timer after landing
    if (this.jumpCooldownTimer > 0) {
      this.jumpCooldownTimer = Math.max(0, this.jumpCooldownTimer - dt);
    }

    // Current road vertical speed and pitch tracking
    const roadVerticalSpeed = this.state.speed * Math.sin(trackPitch);
    this.lastTrackPitch = trackPitch;
    this.lastTrackY = targetY;

    // Detect if car is actively climbing an uphill slope
    // RULE 1: WHILE CLIMBING (trackPitch > 0.04), JUMPING IS STRICTLY FORBIDDEN!
    // Car must remain 100% glued to the slope while climbing up ("dhalan chadte waqt bilkul nahi kudna")
    const isActivelyClimbingUphill = trackPitch > 0.04;

    if (isActivelyClimbingUphill && this.state.speed > 6) {
      this.uphillClimbTimer = 0.5; // remember that car climbed uphill
      this.peakClimbPitch = Math.max(this.peakClimbPitch, trackPitch);
      this.peakClimbVerticalSpeed = Math.max(this.peakClimbVerticalSpeed, roadVerticalSpeed);
    } else {
      this.uphillClimbTimer = Math.max(0, this.uphillClimbTimer - dt);
      if (this.uphillClimbTimer <= 0) {
        this.peakClimbPitch = 0;
        this.peakClimbVerticalSpeed = 0;
      }
    }

    // RULE 2: TOP / SUMMIT REACHED DETECTION ("jab dhal ke top upar jaye")
    // Trigger condition:
    // 1. Car must have been climbing uphill previously (uphillClimbTimer > 0)
    // 2. Road has reached the summit/crest and is no longer pointing upward (trackPitch <= 0.03)
    // 3. Not in landing cooldown
    const isAtTopSummit = (this.uphillClimbTimer > 0) &&
                          (trackPitch <= 0.03) &&
                          (this.jumpCooldownTimer <= 0);

    // RULE 3: SPEED-PROPORTIONAL JUMP ("speed acording jump karni chhaiye")
    // - If speed < 11.5 m/s (~41 km/h): NO JUMP! Car smoothly rolls over the top crest.
    // - If speed >= 11.5 m/s: Car leaps according to speed (higher speed = higher & farther flight).
    const canLaunchAtCrest = isAtTopSummit && (this.state.speed >= 11.5);

    if (!this.state.isAirborne) {
      if (canLaunchAtCrest) {
        // LAUNCH DETACHMENT! Car takes flight cleanly over the top summit!
        this.state.isAirborne = true;
        this.state.airTime = 0.05;

        // Speed-proportional vertical impulse:
        // At 45 km/h: modest hop (~3.5 m/s, airtime ~0.3s)
        // At 80 km/h: high arc (~7.5 m/s, airtime ~0.7s)
        // At 120+ km/h / nitro: huge ballistic canyon flight (~12-16 m/s)!
        const speedExcess = Math.max(0, this.state.speed - 11.5);
        const nitroBoost = this.state.isBoosting ? 4.5 : 0.0;
        this.state.verticalVelocity = Math.max(2.5, this.peakClimbVerticalSpeed * 0.65) + (speedExcess * 0.38) + nitroBoost;

        // Nose points gently over the crest
        this.state.pitch = Math.min(0.24, Math.max(0.04, this.peakClimbPitch * 0.5));

        // Clear climb timer so car doesn't re-trigger in mid-air
        this.uphillClimbTimer = 0;
        this.peakClimbPitch = 0;
        this.peakClimbVerticalSpeed = 0;

        SoundSynth.playJumpLaunch();
      } else {
        // GROUNDED: Car is firmly glued to the asphalt road surface!
        // While climbing uphill, car hugs the slope with zero random jumping
        const groundWithSuspension = targetY - this.state.suspensionDip;
        this.state.position.y = MathUtils.damp(this.state.position.y, groundWithSuspension, 20, dt);
        this.state.pitch = MathUtils.damp(this.state.pitch, trackPitch, 14, dt);
        this.state.verticalVelocity = roadVerticalSpeed;
      }
    } else {
      // ── AIRBORNE BALLISTIC FLIGHT ──
      this.state.airTime += dt;
      const gravity = 22.0; // m/s^2 realistic arcade gravity
      this.state.verticalVelocity -= gravity * dt;
      this.state.position.y += this.state.verticalVelocity * dt;

      // Realistic flight pitch: nose rotates according to flight velocity vector
      const targetFlightPitch = Math.atan2(
        this.state.verticalVelocity,
        Math.max(10, Math.abs(this.state.speed))
      );
      this.state.pitch = MathUtils.damp(this.state.pitch, targetFlightPitch, 5.0, dt);

      // Landing detection: car y drops to or below road height targetY
      if (this.state.position.y <= targetY) {
        this.state.position.y = targetY;

        if (this.state.airTime > 0.22) {
          // Suspension compression dip on landing
          const impactSpeed = Math.abs(this.state.verticalVelocity);
          this.state.suspensionDip = Math.min(0.35, impactSpeed * 0.02);
          this.state.justLanded = true;
          SoundSynth.playLandingThud();
        }

        this.state.isAirborne = false;
        this.state.airTime = 0;
        this.state.verticalVelocity = roadVerticalSpeed;
        this.jumpCooldownTimer = 0.5; // Prevent re-jumping for 0.5s after landing
        this.uphillClimbTimer = 0;
        this.peakClimbPitch = 0;
        this.peakClimbVerticalSpeed = 0;
      }
    }
  }

  // Prevent leaving track barriers and slide smoothly along guardrail
  private handleBarrierCollisions(): void {
    const closest = MathUtils.getClosestTOnCurve(this.trackData.spline, this.state.position, 120);
    const trackPoint = closest.point;
    const tangent = this.trackData.spline.getTangentAt(closest.t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Compute car vector relative to track centerline
    const offsetFromCenter = this.state.position.clone().sub(trackPoint);
    const lateralDist = offsetFromCenter.dot(normal);
    const maxLateral = (this.trackData.roadWidth ? this.trackData.roadWidth / 2 + 1.0 : 7.8);

    if (Math.abs(lateralDist) > maxLateral) {
      // Barrier contact!
      const pushDirection = lateralDist > 0 ? -1 : 1;
      const penetration = Math.abs(lateralDist) - maxLateral;

      // Push back to barrier boundary without jitter
      this.state.position.add(normal.clone().multiplyScalar(pushDirection * penetration));

      // Direction car is heading
      const headingVec = new THREE.Vector3(Math.sin(this.state.heading), 0, Math.cos(this.state.heading));
      const dotWithNormal = headingVec.dot(normal);
      const isDrivingIntoBarrier = (dotWithNormal * (lateralDist > 0 ? 1 : -1)) > 0;

      // If pointing towards the barrier, smoothly deflect heading along track tangent
      if (isDrivingIntoBarrier) {
        const targetHeading = Math.atan2(tangent.x, tangent.z);
        this.state.heading = THREE.MathUtils.lerp(this.state.heading, targetHeading, 0.12);

        // Only lightly scrape if high speed — NEVER freeze car to 0
        if (Math.abs(this.state.speed) > 12) {
          this.state.speed *= 0.96;
          this.state.hasCollided = true;
          this.state.collisionSeverity = Math.min(0.6, Math.abs(this.state.speed) / 30);
          SoundSynth.playCollision(this.state.collisionSeverity);
        }
      }
    }
  }

  // Reset car upright onto the track centerline facing forward
  public resetToTrack(): void {
    const closest = MathUtils.getClosestTOnCurve(this.trackData.spline, this.state.position, 80);
    const trackPoint = closest.point;
    const tangent = this.trackData.spline.getTangentAt(closest.t).normalize();

    this.state.position.copy(trackPoint);
    this.state.position.y += 0.4;
    this.state.speed = 0;
    this.state.velocity.set(0, 0, 0);
    this.state.heading = Math.atan2(tangent.x, tangent.z);
    this.state.steeringAngle = 0;
    this.state.isDrifting = false;
    this.state.driftIntensity = 0;
  }
}

