import * as THREE from 'three';

/**
 * Photorealistic Procedural Texture Generator
 * Generates high-resolution PBR textures in memory via HTML5 Canvas
 * Used to transform procedural Three.js models into console-quality (Vice City / PUBG style) assets.
 */

// 1. Carbon Fiber 2x2 Twill Weave Texture
export function createCarbonFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#101014';
  ctx.fillRect(0, 0, 64, 64);

  const size = 8;
  for (let y = 0; y < 64; y += size) {
    for (let x = 0; x < 64; x += size) {
      const isAlt = ((x / size) + (y / size)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#1c1c22' : '#0a0a0d';
      ctx.fillRect(x, y, size, size);

      // Micro weave fibers
      ctx.strokeStyle = isAlt ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y + size);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.anisotropy = 4;
  return texture;
}

// 2. Realistic Tire Tread Texture (Directional sports radial grooves + sidewall text)
export function createTireTreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Base vulcanized rubber
  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, 512, 128);

  // Longitudinal water channels
  ctx.fillStyle = '#08080a';
  ctx.fillRect(0, 30, 512, 10);
  ctx.fillRect(0, 60, 512, 12);
  ctx.fillRect(0, 90, 512, 10);

  // Lateral tread blocks (repeating angled sipes)
  ctx.strokeStyle = '#0a0a0c';
  ctx.lineWidth = 4;
  for (let x = 0; x < 512; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 12, 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 6, 40);
    ctx.lineTo(x + 16, 60);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 16, 72);
    ctx.lineTo(x + 6, 90);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 12, 100);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }

  // Micro rubber grain
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 2000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 128;
    ctx.fillRect(rx, ry, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(4, 1);
  return texture;
}

// 3. Realistic Racing Livery (Dual racing stripes, sponsor decals, door shutlines)
export function createCarLiveryTexture(baseColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base car paint
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 1024, 1024);

  // Twin Center Racing Stripes (Matte White with Black Pinstripe)
  const centerX = 512;
  const stripeW = 70;
  const gap = 20;

  // Left stripe
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(centerX - gap / 2 - stripeW, 0, stripeW, 1024);
  // Right stripe
  ctx.fillRect(centerX + gap / 2, 0, stripeW, 1024);

  // Outer pinstripes
  ctx.fillStyle = '#111115';
  ctx.fillRect(centerX - gap / 2 - stripeW - 8, 0, 6, 1024);
  ctx.fillRect(centerX + gap / 2 + stripeW + 2, 0, 6, 1024);

  // Racing Number Roundel (#07) on Hood
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX, 700, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#111115';
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 130px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('07', centerX, 705);

  // Sponsor decals ("APEX PERFORMANCE", "TURBO")
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('SUPER APEX', centerX, 300);

  ctx.fillStyle = '#ff0033';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('RACING DYNAMICS', centerX, 340);

  // Door shutline panel crevices (sharp dark borders)
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 100, 944, 824);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

// 4. Photorealistic Projector Headlight Glass Texture
export function createHeadlightTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Dark chrome housing
  ctx.fillStyle = '#0a0a10';
  ctx.fillRect(0, 0, 256, 128);

  // Dual projector cups
  const drawProjector = (cx: number, cy: number, r: number) => {
    // Chrome reflector cone
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#70d6ff');
    grad.addColorStop(0.7, '#1e293b');
    grad.addColorStop(1, '#050508');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Central glass projector lens
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Halo LED DRL ring (Angel Eye)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  };

  drawProjector(70, 64, 45);
  drawProjector(185, 64, 45);

  // Top LED eyebrow strip
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(10, 8, 236, 6);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 5. Photorealistic Character Face Texture (Male Rider)
export function createMaleFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Skin base (warm natural tone)
  ctx.fillStyle = '#c58c65';
  ctx.fillRect(0, 0, 512, 512);

  // Forehead & Cheekbone highlights
  const skinGrad = ctx.createRadialGradient(256, 220, 20, 256, 256, 260);
  skinGrad.addColorStop(0, 'rgba(235, 185, 150, 0.4)');
  skinGrad.addColorStop(0.6, 'rgba(197, 140, 101, 0.1)');
  skinGrad.addColorStop(1, 'rgba(140, 85, 50, 0.45)');
  ctx.fillStyle = skinGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Eyebrows (Strong, masculine, angled)
  ctx.fillStyle = '#211812';
  // Left eyebrow
  ctx.beginPath();
  ctx.moveTo(140, 195);
  ctx.lineTo(230, 185);
  ctx.lineTo(225, 200);
  ctx.lineTo(145, 205);
  ctx.fill();
  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(372, 195);
  ctx.lineTo(282, 185);
  ctx.lineTo(287, 200);
  ctx.lineTo(367, 205);
  ctx.fill();

  // Eyes (Sclera + Iris + Pupil + Catchlight)
  const drawEye = (cx: number, cy: number) => {
    // Sclera (eye white)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 32, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Amber / Hazel Iris
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // Dark Pupil
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();

    // Specular Reflection Highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 4, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  drawEye(185, 220);
  drawEye(327, 220);

  // Aviator Sunglasses Frame & Tint (Cool Vice City / PUBG Racer look)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 5;

  // Left lens
  ctx.beginPath();
  ctx.roundRect(140, 190, 95, 75, [8, 8, 30, 30]);
  ctx.fill();
  ctx.stroke();

  // Right lens
  ctx.beginPath();
  ctx.roundRect(277, 190, 95, 75, [8, 8, 30, 30]);
  ctx.fill();
  ctx.stroke();

  // Bridge
  ctx.beginPath();
  ctx.moveTo(235, 215);
  ctx.lineTo(277, 215);
  ctx.stroke();

  // Nose shading
  ctx.fillStyle = 'rgba(110, 50, 20, 0.35)';
  ctx.beginPath();
  ctx.moveTo(256, 260);
  ctx.lineTo(240, 330);
  ctx.lineTo(272, 330);
  ctx.closePath();
  ctx.fill();

  // Trimmed Beard / 5 o'clock Stubble (PUBG action hero)
  ctx.fillStyle = 'rgba(30, 20, 15, 0.38)';
  ctx.beginPath();
  ctx.arc(256, 380, 85, 0, Math.PI);
  ctx.fill();

  // Lips
  ctx.fillStyle = '#9f5842';
  ctx.beginPath();
  ctx.ellipse(256, 385, 38, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 6. Photorealistic Character Face Texture (Female Co-pilot)
export function createFemaleFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Smooth warm ivory skin tone
  ctx.fillStyle = '#e8b896';
  ctx.fillRect(0, 0, 512, 512);

  // Soft radiant skin blush & highlight
  const skinGrad = ctx.createRadialGradient(256, 240, 20, 256, 256, 260);
  skinGrad.addColorStop(0, 'rgba(255, 235, 220, 0.45)');
  skinGrad.addColorStop(0.5, 'rgba(232, 184, 150, 0.1)');
  skinGrad.addColorStop(1, 'rgba(180, 115, 80, 0.35)');
  ctx.fillStyle = skinGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Rosy Cheek Blushes
  ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
  ctx.beginPath();
  ctx.arc(140, 280, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(372, 280, 45, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows (Arched, elegant, dark brown)
  ctx.fillStyle = '#261810';
  ctx.beginPath();
  ctx.moveTo(140, 195);
  ctx.quadraticCurveTo(185, 175, 230, 192);
  ctx.lineTo(225, 200);
  ctx.quadraticCurveTo(185, 185, 145, 202);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(372, 195);
  ctx.quadraticCurveTo(327, 175, 282, 192);
  ctx.lineTo(287, 200);
  ctx.quadraticCurveTo(327, 185, 367, 202);
  ctx.fill();

  // Big expressive eyes with winged eyeliner
  const drawFemaleEye = (cx: number, cy: number, isLeft: boolean) => {
    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 34, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sky-blue / Emerald Iris
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();

    // Double Catchlights (anime / gaming luster)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 5, 4, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy + 4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Winged Eyeliner & Eyelashes
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 36, cy + 2);
    ctx.quadraticCurveTo(cx, cy - 22, isLeft ? cx + 42 : cx + 36, isLeft ? cy - 8 : cy + 2);
    ctx.stroke();
  };

  drawFemaleEye(185, 222, true);
  drawFemaleEye(327, 222, false);

  // Soft feminine nose tip
  ctx.fillStyle = 'rgba(160, 80, 50, 0.3)';
  ctx.beginPath();
  ctx.arc(256, 315, 10, 0, Math.PI * 2);
  ctx.fill();

  // Glossy Berry Pink Lips
  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.ellipse(256, 380, 36, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lip gloss highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(254, 376, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 7. Leather Biker Jacket Texture (Zippers, stitching, patches)
export function createJacketTexture(color: string, isMale: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base jacket color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 512);

  // Leather grain texture
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 2, 2);
  }

  // Silver asymmetrical zipper down the front
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  // Zipper teeth
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  for (let y = 10; y < 512; y += 8) {
    ctx.beginPath();
    ctx.moveTo(250, y);
    ctx.lineTo(262, y);
    ctx.stroke();
  }

  // Lapel collar seams
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(180, 0);
  ctx.lineTo(256, 160);
  ctx.lineTo(332, 0);
  ctx.stroke();

  // Racing badge on chest
  ctx.fillStyle = isMale ? '#0284c7' : '#f43f5e';
  ctx.beginPath();
  ctx.roundRect(140, 160, 70, 35, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RACING', 175, 177);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
