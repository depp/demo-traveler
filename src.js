z = 0;
// Generate 10 random mountain ranges.
d = Array(10)
  .fill()
  .map(() => {
    d = Array(3).fill(0);
    for (i = 0; i < 6; i++) {
      x = d[0];
      d = d.flatMap((y) => [
        (x + y) / 2 + Math.random() * 10 * 0.6 ** i,
        (x = y) + Math.random() * 10 * 0.6 ** i,
      ]);
    }
    t = 'M-50,0';
    for (x = -50; x < 51; x++) {
      t += ' L' + [x, d.shift()];
    }
    t += ' L50,50 L-50,50 z';
    return new Path2D(t);
  });
f = (time) => {
  c.save();
  c.translate(a.width / 2, a.height / 2);
  c.scale(a.width * 0.01, a.width * 0.01);
  z = z || time;
  time = ((time - z) / 5e3) % 1;
  requestAnimationFrame(f);
  c.fillStyle = `rgb(${time * 255},${time * 255},${time * 255})`;
  c.fillRect(-50, -50, 100, 100);
  d.forEach((d, i) => {
    c.save();
    c.translate(0, -10 + 2 * i);
    v = 25 * i;
    c.fillStyle = `rgb(0,${v},0)`;
    c.fill(d);
    c.restore();
  });
  c.restore();
};
f();
