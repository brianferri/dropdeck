type Particle = {
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    alpha: number
};

function initParticles(canvas: HTMLCanvasElement, rgb: string): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    function setSize(): void {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    setSize();
    window.addEventListener("resize", setSize);
    const particles: Array<Particle> = Array.from({ length: 42 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: (Math.random() * 2.5) + 0.8,
        alpha: (Math.random() * 0.35) + 0.1
    }));
    // Threaded as a parameter rather than closing over `ctx` so the non-null narrowing survives past the guard.
    function loop(context: CanvasRenderingContext2D): void {
        if (!canvas.isConnected) return;
        if (!canvas.width || canvas.width !== canvas.offsetWidth) setSize();
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
            p.vx *= 0.99;
            p.vy *= 0.99;
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            context.beginPath();
            context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            context.fillStyle = `rgba(${rgb},${p.alpha})`;
            context.fill();
        }
        requestAnimationFrame(() => { loop(context); });
    }
    loop(ctx);
}

export function initAllParticles(rgb: string): void {
    document.querySelectorAll<HTMLCanvasElement>(".particle-canvas").forEach((c) => {
        initParticles(c, rgb);
    });
}
