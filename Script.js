(() => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  const rand = (min, max) => Math.random() * (max - min) + min;
  const TAU = Math.PI * 2;
  const palette = [
    "255,189,89",
    "255,119,97",
    "138,79,255",
    "255,235,180",
    "255,82,200",
  ];

  class Particle {
    constructor(x, y, opts = {}) {
      this.x = x;
      this.y = y;
      this.vx = opts.vx ?? rand(-1, 1);
      this.vy = opts.vy ?? rand(-2, -0.2);
      this.size = opts.size ?? rand(1, 4);
      this.life = opts.life ?? rand(40, 120);
      this.age = 0;
      this.color = opts.color ?? palette[Math.floor(rand(0, palette.length))];
      this.glow = opts.glow ?? rand(6, 26);
      this.friction = opts.friction ?? 0.985;
      this.gravity = opts.gravity ?? 0.03;
      this.alpha = 1;
    }

    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.age++;
      this.alpha = Math.max(0, 1 - this.age / this.life);
    }

    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.glow);
      g.addColorStop(0, `rgba(${this.color},${this.alpha})`);
      g.addColorStop(1, `rgba(${this.color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    get dead() { return this.alpha <= 0; }
  }

  class Rocket {
    constructor() {
      this.x = rand(window.innerWidth * 0.1, window.innerWidth * 0.9);
      this.y = window.innerHeight + 10;
      this.vx = rand(-0.5, 0.5);
      this.vy = rand(-7, -9);
      this.color = palette[Math.floor(rand(0, palette.length))];
      this.trail = [];
      this.exploded = false;
    }

    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 10) this.trail.shift();

      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.1; // gravity pull

      // trail sparks
      for (let i = 0; i < 2; i++) {
        particles.push(new Particle(this.x, this.y, {
          size: rand(1, 2),
          glow: rand(6, 12),
          life: rand(20, 40),
          gravity: 0.05,
          color: this.color
        }));
      }

      // explode when slowing down
      if (this.vy >= -1 && !this.exploded) {
        this.explode();
        this.exploded = true;
      }
    }

    explode() {
      const count = rand(40, 70);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * TAU;
        const speed = rand(1.5, 5);
        particles.push(new Particle(this.x, this.y, {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(1.5, 3.5),
          glow: rand(10, 30),
          life: rand(80, 160),
          gravity: 0.03,
          color: this.color
        }));
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(${this.color},0.8)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < this.trail.length - 1; i++) {
        const p1 = this.trail[i];
        const p2 = this.trail[i + 1];
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  const particles = [];
  const rockets = [];

  // Mouse + touch fireworks
  function burst(x, y) {
    const count = rand(20, 40);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU;
      const speed = rand(1.5, 4);
      particles.push(new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(1.2, 3),
        glow: rand(10, 30),
        life: rand(80, 150),
        gravity: 0.02
      }));
    }
  }

  function move(x, y) {
    for (let i = 0; i < 2; i++) {
      particles.push(new Particle(x, y, {
        size: rand(1, 3),
        glow: rand(8, 20),
        life: rand(40, 80),
        gravity: 0.01
      }));
    }
  }

  window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
  window.addEventListener("click", e => burst(e.clientX, e.clientY));
  window.addEventListener("touchmove", e => {
    const t = e.touches[0];
    if (t) move(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener("touchstart", e => {
    const t = e.touches[0];
    if (t) burst(t.clientX, t.clientY);
  }, { passive: true });

  // Auto-launch rockets
  setInterval(() => {
    rockets.push(new Rocket());
  }, 1800);

  // Animation loop
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    rockets.forEach((r, i) => {
      r.update();
      r.draw(ctx);
      if (r.exploded || r.y > window.innerHeight) rockets.splice(i, 1);
    });

    particles.forEach(p => {
      p.update();
      p.draw(ctx);
    });

    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].dead) particles.splice(i, 1);
    }

    requestAnimationFrame(loop);
  }
  loop();
})();
