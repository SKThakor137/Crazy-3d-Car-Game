import * as THREE from 'three';
import { TrackConfig } from '../data/TrackConfigs';
import { MathUtils } from '../utils/MathUtils';

export interface TrackData {
  spline: THREE.CatmullRomCurve3;
  checkpoints: THREE.Vector3[];
  checkpointDistances: number[];
  roadGeometry: THREE.BufferGeometry;
  kerbLeftGeometry: THREE.BufferGeometry;
  kerbRightGeometry: THREE.BufferGeometry;
  barrierLeftGeometry: THREE.BufferGeometry;
  barrierRightGeometry: THREE.BufferGeometry;
  startFinishGantryPosition: THREE.Vector3;
  startFinishGantryRotation: THREE.Euler;
  spawnPoints: { position: THREE.Vector3; rotation: THREE.Euler }[];
  totalLength: number;
  roadWidth: number;
  theme: 'beach' | 'forest' | 'canyon' | 'adventure';
}

export class TrackGenerator {
  public static generate(config: TrackConfig): TrackData {
    const spline = MathUtils.createTrackSpline(config.controlPoints);
    const divisions = 240;
    const width = config.roadWidth;
    const halfWidth = width / 2;
    const kerbWidth = 1.0;
    const barrierOffset = 1.8;
    const barrierHeight = 0.65; // sleek low-profile guardrail for open outdoor views

    const points = spline.getSpacedPoints(divisions);
    const totalLength = spline.getLength();

    // Arrays for Road Geometry
    const roadVertices: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];

    // Arrays for Kerbs
    const kerbLeftVertices: number[] = [];
    const kerbLeftColors: number[] = [];
    const kerbLeftIndices: number[] = [];

    const kerbRightVertices: number[] = [];
    const kerbRightColors: number[] = [];
    const kerbRightIndices: number[] = [];

    // Arrays for Barriers
    const barrierLVertices: number[] = [];
    const barrierLIndices: number[] = [];
    const barrierRVertices: number[] = [];
    const barrierRIndices: number[] = [];

    const cKerb1 = new THREE.Color(config.kerbPrimaryColor);
    const cKerb2 = new THREE.Color(config.kerbSecondaryColor);

    // Build ribbon meshes along the spline
    for (let i = 0; i <= divisions; i++) {
      const t = i / divisions;
      const pt = points[i % points.length];
      const tangent = spline.getTangentAt(t % 1.0).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Road left and right edges
      const pLeft = new THREE.Vector3().addVectors(pt, normal.clone().multiplyScalar(-halfWidth));
      const pRight = new THREE.Vector3().addVectors(pt, normal.clone().multiplyScalar(halfWidth));

      roadVertices.push(pLeft.x, pLeft.y + 0.05, pLeft.z);
      roadVertices.push(pRight.x, pRight.y + 0.05, pRight.z);

      const uScale = (t * totalLength) / 8; // repeats every 8 units
      roadUvs.push(0, uScale);
      roadUvs.push(1, uScale);

      // Left Kerb
      const pKerbLeftOuter = new THREE.Vector3().addVectors(pLeft, normal.clone().multiplyScalar(-kerbWidth));
      kerbLeftVertices.push(pLeft.x, pLeft.y + 0.08, pLeft.z);
      kerbLeftVertices.push(pKerbLeftOuter.x, pKerbLeftOuter.y + 0.15, pKerbLeftOuter.z);

      const isOddKerb = Math.floor((t * totalLength) / 3) % 2 === 0;
      const kColor = isOddKerb ? cKerb1 : cKerb2;
      kerbLeftColors.push(kColor.r, kColor.g, kColor.b);
      kerbLeftColors.push(kColor.r, kColor.g, kColor.b);

      // Right Kerb
      const pKerbRightOuter = new THREE.Vector3().addVectors(pRight, normal.clone().multiplyScalar(kerbWidth));
      kerbRightVertices.push(pRight.x, pRight.y + 0.08, pRight.z);
      kerbRightVertices.push(pKerbRightOuter.x, pKerbRightOuter.y + 0.15, pKerbRightOuter.z);

      kerbRightColors.push(kColor.r, kColor.g, kColor.b);
      kerbRightColors.push(kColor.r, kColor.g, kColor.b);

      // Left Barrier
      const pBarrierLBase = new THREE.Vector3().addVectors(pLeft, normal.clone().multiplyScalar(-barrierOffset));
      barrierLVertices.push(pBarrierLBase.x, pBarrierLBase.y, pBarrierLBase.z);
      barrierLVertices.push(pBarrierLBase.x, pBarrierLBase.y + barrierHeight, pBarrierLBase.z);

      // Right Barrier
      const pBarrierRBase = new THREE.Vector3().addVectors(pRight, normal.clone().multiplyScalar(barrierOffset));
      barrierRVertices.push(pBarrierRBase.x, pBarrierRBase.y, pBarrierRBase.z);
      barrierRVertices.push(pBarrierRBase.x, pBarrierRBase.y + barrierHeight, pBarrierRBase.z);

      // Quad indices
      if (i < divisions) {
        const base = i * 2;
        const next = (i + 1) * 2;

        // Road
        roadIndices.push(base, base + 1, next);
        roadIndices.push(next, base + 1, next + 1);

        // Kerb Left
        kerbLeftIndices.push(base, base + 1, next);
        kerbLeftIndices.push(next, base + 1, next + 1);

        // Kerb Right
        kerbRightIndices.push(base, next, base + 1);
        kerbRightIndices.push(base + 1, next, next + 1);

        // Barrier Left
        barrierLIndices.push(base, next, base + 1);
        barrierLIndices.push(base + 1, next, next + 1);

        // Barrier Right
        barrierRIndices.push(base, base + 1, next);
        barrierRIndices.push(next, base + 1, next + 1);
      }
    }

    // Assemble road geometry
    const roadGeometry = new THREE.BufferGeometry();
    roadGeometry.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
    roadGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeometry.setIndex(roadIndices);
    roadGeometry.computeVertexNormals();

    // Assemble left kerb geometry
    const kerbLeftGeometry = new THREE.BufferGeometry();
    kerbLeftGeometry.setAttribute('position', new THREE.Float32BufferAttribute(kerbLeftVertices, 3));
    kerbLeftGeometry.setAttribute('color', new THREE.Float32BufferAttribute(kerbLeftColors, 3));
    kerbLeftGeometry.setIndex(kerbLeftIndices);
    kerbLeftGeometry.computeVertexNormals();

    // Assemble right kerb geometry
    const kerbRightGeometry = new THREE.BufferGeometry();
    kerbRightGeometry.setAttribute('position', new THREE.Float32BufferAttribute(kerbRightVertices, 3));
    kerbRightGeometry.setAttribute('color', new THREE.Float32BufferAttribute(kerbRightColors, 3));
    kerbRightGeometry.setIndex(kerbRightIndices);
    kerbRightGeometry.computeVertexNormals();

    // Assemble barriers
    const barrierLeftGeometry = new THREE.BufferGeometry();
    barrierLeftGeometry.setAttribute('position', new THREE.Float32BufferAttribute(barrierLVertices, 3));
    barrierLeftGeometry.setIndex(barrierLIndices);
    barrierLeftGeometry.computeVertexNormals();

    const barrierRightGeometry = new THREE.BufferGeometry();
    barrierRightGeometry.setAttribute('position', new THREE.Float32BufferAttribute(barrierRVertices, 3));
    barrierRightGeometry.setIndex(barrierRIndices);
    barrierRightGeometry.computeVertexNormals();

    // Extract ordered Checkpoints along the spline (approx 16 checkpoints around circuit)
    const numCheckpoints = 16;
    const checkpoints: THREE.Vector3[] = [];
    const checkpointDistances: number[] = [];
    for (let c = 0; c < numCheckpoints; c++) {
      const t = c / numCheckpoints;
      const pt = spline.getPointAt(t);
      checkpoints.push(pt);
      checkpointDistances.push(t * totalLength);
    }

    // Start / Finish Line Gantry
    const startPt = spline.getPointAt(0);
    const startTangent = spline.getTangentAt(0).normalize();
    const gantryRot = new THREE.Euler(0, Math.atan2(startTangent.x, startTangent.z), 0);

    // Spawn points for 6 cars (grid formation behind start line: 2 per row)
    const spawnPoints: { position: THREE.Vector3; rotation: THREE.Euler }[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const startNormal = new THREE.Vector3().crossVectors(startTangent, up).normalize();

    // Row offsets: grid positions behind the start line
    const gridRows = [
      { dist: -6, side: -2.5 },  // Pos 1 (Pole)
      { dist: -12, side: 2.5 },  // Pos 2
      { dist: -18, side: -2.5 }, // Pos 3
      { dist: -24, side: 2.5 },  // Pos 4
      { dist: -30, side: -2.5 }, // Pos 5
      { dist: -36, side: 2.5 },  // Pos 6 (Player starting at back)
    ];

    for (const grid of gridRows) {
      // Sample t along spline curve behind the start line
      const tOffset = grid.dist / totalLength;
      let t = (1.0 + tOffset) % 1.0;
      if (t < 0) t += 1.0;

      const pt = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const spawnPos = pt.clone().add(normal.clone().multiplyScalar(grid.side));
      spawnPos.y = pt.y + 0.35; // clean clearance above asphalt

      // Car mesh front is at +Z. Angle to rotate around Y so +Z faces tangent:
      const heading = Math.atan2(tangent.x, tangent.z);

      spawnPoints.push({
        position: spawnPos,
        rotation: new THREE.Euler(0, heading, 0),
      });
    }

    return {
      spline,
      checkpoints,
      checkpointDistances,
      roadGeometry,
      kerbLeftGeometry,
      kerbRightGeometry,
      barrierLeftGeometry,
      barrierRightGeometry,
      startFinishGantryPosition: startPt,
      startFinishGantryRotation: gantryRot,
      spawnPoints,
      totalLength,
      roadWidth: config.roadWidth,
      theme: config.theme,
    };
  }
}

