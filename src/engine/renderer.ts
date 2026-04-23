export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: Color;
  size: number;
  type?: "spark" | "dust" | "ember" | "ripple" | "glow";
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private tileSize: number;
  private particles: Particle[] = [];
  time = 0;

  private shakeX = 0;
  private shakeY = 0;
  private shakeDecay = 0;

  constructor(canvas: HTMLCanvasElement, tileSize = 32) {
    this.ctx = canvas.getContext("2d")!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.tileSize = tileSize;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  get cols() {
    return Math.floor(this.width / this.tileSize);
  }

  get rows() {
    return Math.floor(this.height / this.tileSize);
  }

  shake(intensity: number) {
    this.shakeDecay = Math.max(this.shakeDecay, intensity);
  }

  clear() {
    this.ctx.save();
    if (this.shakeDecay > 0.01) {
      this.shakeX = (Math.random() - 0.5) * this.shakeDecay * 12;
      this.shakeY = (Math.random() - 0.5) * this.shakeDecay * 12;
      this.ctx.translate(this.shakeX, this.shakeY);
      this.shakeDecay *= 0.85;
    } else {
      this.shakeDecay = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }
    this.ctx.fillStyle = "#0a0a0f";
    this.ctx.fillRect(-20, -20, this.width + 40, this.height + 40);
  }

  endFrame() {
    this.ctx.restore();
  }

  drawTile(
    col: number,
    row: number,
    color: Color,
    glyph?: string,
    glyphColor?: Color
  ) {
    const x = col * this.tileSize;
    const y = row * this.tileSize;

    this.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a ?? 1})`;
    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

    if (glyph) {
      this.ctx.fillStyle = glyphColor
        ? `rgba(${glyphColor.r},${glyphColor.g},${glyphColor.b},${glyphColor.a ?? 1})`
        : "#fff";
      this.ctx.font = `${this.tileSize * 0.7}px monospace`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        glyph,
        x + this.tileSize / 2,
        y + this.tileSize / 2
      );
    }
  }

  drawAnimatedWater(col: number, row: number, baseColor: Color) {
    const x = col * this.tileSize;
    const y = row * this.tileSize;
    const t = this.time;

    const wave1 = Math.sin(t * 1.5 + col * 0.8 + row * 0.3) * 0.3 + 0.7;
    const wave2 = Math.sin(t * 0.7 + col * 0.3 + row * 1.2) * 0.2 + 0.8;
    const brightness = wave1 * wave2;

    this.ctx.fillStyle = `rgba(${baseColor.r * brightness},${baseColor.g * brightness},${Math.min(255, baseColor.b * brightness * 1.2)},0.85)`;
    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

    this.ctx.fillStyle = `rgba(150,200,255,${0.1 + Math.sin(t * 2 + col + row * 2) * 0.08})`;
    const waveOffset = Math.sin(t * 1.2 + col * 0.5) * 3;
    this.ctx.fillRect(x + 2, y + this.tileSize / 2 + waveOffset, this.tileSize - 4, 2);
    this.ctx.fillRect(x + 4, y + this.tileSize / 4 + waveOffset * 0.7, this.tileSize - 8, 1);
  }

  drawAnimatedLava(col: number, row: number, baseColor: Color) {
    const x = col * this.tileSize;
    const y = row * this.tileSize;
    const t = this.time;

    const pulse = Math.sin(t * 0.8 + col * 1.5 + row * 0.7) * 0.3 + 0.7;
    const glow = Math.sin(t * 1.3 + col * 0.3 + row * 1.1) * 0.2 + 0.8;

    this.ctx.fillStyle = `rgba(${Math.min(255, baseColor.r * pulse * 1.2)},${baseColor.g * glow * 0.6},${baseColor.b * 0.3},1)`;
    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

    const blobX = x + Math.sin(t * 0.5 + col) * 4 + this.tileSize / 2;
    const blobY = y + Math.cos(t * 0.7 + row) * 3 + this.tileSize / 2;
    const blobR = 3 + Math.sin(t * 1.5 + col + row) * 2;
    const gradient = this.ctx.createRadialGradient(blobX, blobY, 0, blobX, blobY, blobR);
    gradient.addColorStop(0, `rgba(255,200,50,${0.6 * pulse})`);
    gradient.addColorStop(1, "rgba(255,100,0,0)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
  }

  drawWallWithFlicker(
    col: number,
    row: number,
    wallColor: Color,
    playerScreenCol: number,
    playerScreenRow: number
  ) {
    const x = col * this.tileSize;
    const y = row * this.tileSize;
    const dist = Math.sqrt(
      (col - playerScreenCol) ** 2 + (row - playerScreenRow) ** 2
    );

    this.ctx.fillStyle = `rgba(${wallColor.r},${wallColor.g},${wallColor.b},1)`;
    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

    if (dist < 6) {
      const flicker =
        Math.sin(this.time * 4 + col * 2.1 + row * 1.7) * 0.15 +
        Math.sin(this.time * 7 + col * 0.8) * 0.08 +
        0.3;
      const falloff = Math.max(0, 1 - dist / 6);
      const alpha = flicker * falloff * 0.4;

      const gradient = this.ctx.createRadialGradient(
        x + this.tileSize / 2,
        y + this.tileSize / 2,
        0,
        x + this.tileSize / 2,
        y + this.tileSize / 2,
        this.tileSize * 0.8
      );
      gradient.addColorStop(0, `rgba(255,180,80,${alpha})`);
      gradient.addColorStop(1, `rgba(200,100,30,0)`);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
    }
  }

  drawFloorWithLight(
    col: number,
    row: number,
    floorColor: Color,
    playerScreenCol: number,
    playerScreenRow: number
  ) {
    const x = col * this.tileSize;
    const y = row * this.tileSize;

    this.ctx.fillStyle = `rgba(${floorColor.r},${floorColor.g},${floorColor.b},1)`;
    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

    const dist = Math.sqrt(
      (col - playerScreenCol) ** 2 + (row - playerScreenRow) ** 2
    );

    if (dist < 5) {
      const flicker =
        Math.sin(this.time * 3.5 + col * 1.3 + row * 0.9) * 0.1 + 0.2;
      const falloff = Math.max(0, 1 - dist / 5);
      const alpha = flicker * falloff * 0.2;

      this.ctx.fillStyle = `rgba(255,200,100,${alpha})`;
      this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
    }
  }

  drawCreature(
    col: number,
    row: number,
    sprite: number[][],
    palette: Color[],
    pulse = 0
  ) {
    const x = col * this.tileSize;
    const bobOffset = Math.sin(this.time * 2 + col * 3 + row * 5) * 1.5;
    const y = col * 0 + row * this.tileSize + bobOffset;
    const pixSize = this.tileSize / sprite.length;

    for (let sy = 0; sy < sprite.length; sy++) {
      for (let sx = 0; sx < sprite[sy].length; sx++) {
        const colorIdx = sprite[sy][sx];
        if (colorIdx === 0) continue;
        const c = palette[colorIdx] || palette[1];
        const brightness = 1 + pulse * 0.3 * Math.sin(this.time * 3 + sx + sy);
        this.ctx.fillStyle = `rgba(${Math.min(255, c.r * brightness)},${Math.min(255, c.g * brightness)},${Math.min(255, c.b * brightness)},${c.a ?? 1})`;
        this.ctx.fillRect(
          x + sx * pixSize,
          y + sy * pixSize,
          pixSize + 0.5,
          pixSize + 0.5
        );
      }
    }
  }

  spawnParticles(
    worldX: number,
    worldY: number,
    color: Color,
    count: number,
    speed = 2,
    type: Particle["type"] = "spark"
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed * (0.5 + Math.random()),
        life: 1,
        maxLife: 0.3 + Math.random() * 0.7,
        color,
        size: type === "ember" ? 1 + Math.random() * 2 : 2 + Math.random() * 3,
        type,
      });
    }
  }

  spawnDeathExplosion(
    screenX: number,
    screenY: number,
    palette: Color[],
    intensity: number
  ) {
    const cx = screenX + this.tileSize / 2;
    const cy = screenY + this.tileSize / 2;
    const count = Math.floor(15 * intensity);

    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      if ((color.a ?? 1) < 0.1) continue;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3 * intensity;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.6,
        color,
        size: 2 + Math.random() * 4,
        type: "spark",
      });
    }

    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 8,
        y: cy + (Math.random() - 0.5) * 8,
        vx: 0,
        vy: -0.5 - Math.random(),
        life: 1,
        maxLife: 0.8 + Math.random() * 0.4,
        color: { r: 255, g: 255, b: 200 },
        size: 4 + Math.random() * 4,
        type: "glow",
      });
    }
  }

  spawnAmbientDust(screenX: number, screenY: number) {
    if (Math.random() > 0.003) return;
    this.particles.push({
      x: screenX + Math.random() * this.tileSize,
      y: screenY + Math.random() * this.tileSize,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -0.1 - Math.random() * 0.2,
      life: 1,
      maxLife: 2 + Math.random() * 2,
      color: { r: 180, g: 170, b: 150 },
      size: 1 + Math.random(),
      type: "dust",
    });
  }

  spawnLavaEmber(screenX: number, screenY: number) {
    if (Math.random() > 0.03) return;
    this.particles.push({
      x: screenX + Math.random() * this.tileSize,
      y: screenY,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 1.5,
      life: 1,
      maxLife: 0.5 + Math.random() * 0.8,
      color: { r: 255, g: Math.floor(100 + Math.random() * 100), b: 20 },
      size: 1 + Math.random() * 2,
      type: "ember",
    });
  }

  spawnWaterRipple(screenX: number, screenY: number) {
    if (Math.random() > 0.008) return;
    this.particles.push({
      x: screenX + Math.random() * this.tileSize,
      y: screenY + Math.random() * this.tileSize,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 1 + Math.random(),
      color: { r: 100, g: 180, b: 255 },
      size: 1,
      type: "ripple",
    });
  }

  updateParticles(dt: number) {
    this.time += dt;
    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt / p.maxLife;
      if (p.life <= 0) return false;

      if (p.type === "glow") {
        const radius = p.size * (1 - p.life * 0.5);
        const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        gradient.addColorStop(0, `rgba(${p.color.r},${p.color.g},${p.color.b},${p.life * 0.6})`);
        gradient.addColorStop(1, `rgba(${p.color.r},${p.color.g},${p.color.b},0)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
      } else if (p.type === "ripple") {
        const radius = (1 - p.life) * 6 + 1;
        this.ctx.strokeStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.life * 0.4})`;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (p.type === "dust") {
        this.ctx.globalAlpha = p.life * 0.3;
        this.ctx.fillStyle = `rgb(${p.color.r},${p.color.g},${p.color.b})`;
        this.ctx.fillRect(p.x, p.y, p.size, p.size);
      } else {
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = `rgb(${p.color.r},${p.color.g},${p.color.b})`;
        this.ctx.fillRect(p.x, p.y, p.size * p.life, p.size * p.life);
      }

      return true;
    });
    this.ctx.globalAlpha = 1;
  }

  drawFogOfWar(
    visible: Set<string>,
    explored: Set<string>,
    cameraCol: number,
    cameraRow: number
  ) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const worldCol = col + cameraCol;
        const worldRow = row + cameraRow;
        const key = `${worldCol},${worldRow}`;
        if (visible.has(key)) continue;
        if (explored.has(key)) {
          this.ctx.fillStyle = "rgba(0,0,0,0.6)";
        } else {
          this.ctx.fillStyle = "rgba(0,0,0,0.95)";
        }
        this.ctx.fillRect(
          col * this.tileSize,
          row * this.tileSize,
          this.tileSize,
          this.tileSize
        );
      }
    }
  }

  drawHealthBar(
    col: number,
    row: number,
    current: number,
    max: number,
    color: Color = { r: 220, g: 50, b: 50 }
  ) {
    const x = col * this.tileSize;
    const y = row * this.tileSize - 4;
    const w = this.tileSize;
    const pct = current / max;

    this.ctx.fillStyle = "rgba(0,0,0,0.5)";
    this.ctx.fillRect(x, y, w, 3);
    this.ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    this.ctx.fillRect(x, y, w * pct, 3);
  }

  drawPlayerGlow(col: number, row: number) {
    const cx = col * this.tileSize + this.tileSize / 2;
    const cy = row * this.tileSize + this.tileSize / 2;
    const flicker = Math.sin(this.time * 4) * 0.05 + 0.15;
    const radius = this.tileSize * 2.5;

    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(255,220,100,${flicker})`);
    gradient.addColorStop(0.5, `rgba(255,180,60,${flicker * 0.3})`);
    gradient.addColorStop(1, "rgba(255,150,30,0)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }
}
