// Temporary variables.
let i, x, y, t, d;

// Timestamp of start of animation.
let zeroTime = 0;

// Generate 10 random mountain ranges.
let objects = Array(10)
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

// Function to generate colors.
//
// Colors are specified as RGB in decimal, with 111 black, 119 is blue, and 999
// is white. After the first color, each next color is mixed in linearly, using
// an interpolation coefficient that comes before the color.
//
// For example,
//
//     r(111) // black
//     r(999) // white
//     r(111, 0.7, 999) // black + 0.7 white
//     r(911, 0.2, 555) // red + 0.2 gray
//     r(911, 0.2, 555, 0.3, 119) // red + 0.2 gray, then + 0.3 blue
let color = (...b) => (
  // y: color, initialized to 0.
  (y = [0, 0, 0]),
  // x: interpolation coefficient: 0 = previous color, 1 = next color.
  (x = 1),
  b.map((w, i) =>
    i & 1
      ? (x = w < 0 ? 0 : w > 1 ? 1 : w)
      : (y = y.map((y, i) => y * (1 - x) + 32 * x * ((w + '')[i] - 1))),
  ),
  `rgb(${y})`
);

// Frame rendering callback.
let render = (time) => {
  c.save();
  c.translate(a.width / 2, a.height / 2);
  c.scale(a.width * 0.01, a.width * 0.01);
  zeroTime = zeroTime || time;
  time = ((time - zeroTime) / 5e3) % 1;
  requestAnimationFrame(render);
  c.fillStyle = color(111, time, 999);
  c.fillRect(-50, -50, 100, 100);
  objects.forEach((x, i) => {
    c.save();
    c.translate(0, -10 + 2 * i);
    c.fillStyle = color(223, i * 0.1, 452);
    c.fill(x);
    c.restore();
  });
  c.restore();
};

// Rendering callback will call requestAnimationFrame.
render();
