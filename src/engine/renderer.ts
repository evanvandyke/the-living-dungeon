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
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private tileSize: number;
  private particles: Particle[] = [];
  private time = 0;

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

  clear() {
    this.ctx.fillStyle = "#0a0a0f";
    this.ctx.fillRect(0, 0, this.width, this.height);
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

  drawCreature(
    col: number,
    row: number,
    sprite: number[][],
    palette: Color[],
    pulse = 0
  ) {
    const x = col * this.tileSize;
    const y = row * this.tileSize;
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
    speed = 2
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed * (0.5 + Math.random()),
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  updateParticles(dt: number) {
    this.time += dt;
    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt / p.maxLife;
      if (p.life <= 0) return false;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = `rgb(${p.color.r},${p.color.g},${p.color.b})`;
      this.ctx.fillRect(p.x, p.y, p.size * p.life, p.size * p.life);
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
}
