// Demo title. This is stripped out of the demo by the build system, but it is
// present in the shim.
/* exported title */
var title = 'Star Traveler';

// Temporary variables.
let x, y;

// Timestamp of start of animation.
let zeroTime = 0;

let iter = (i, x) => [...Array(i).keys()].map(x);

// Generate 10 random mountain ranges.
let functions = [];
iter(10, (i) => {
  y = iter(i, (_) => 0);
  iter(
    6,
    (i) =>
      (y = y.flatMap((y, j) =>
        j
          ? [(x + y) / 2 + (Math.random() - 0.5) * 15 * 0.51 ** i, (x = y)]
          : [(x = y)],
      )),
  );
  let p = new Path2D(
    `M-50,50L${y.map((x, i) => [i - y.length / 2, x]).join('L')}L50,50z`,
  );
  functions.push((time) => {
    c.translate(0, -20);
    c.scale((x = 30 / (30 - 2 * i - time * 8)), x);
    c.translate(0, 10);
    c.fillStyle = color(223, i * 0.1, 452);
    c.fill(p);
  });
});

// Function to generate colors. Uses x, y.
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
  b.map((z, i) =>
    i & 1
      ? (x = z < 0 ? 0 : z > 1 ? 1 : z)
      : (y = y.map((y, i) => y * (1 - x) + 32 * x * ((z + '')[i] - 1))),
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
  c.fillStyle = color(555);
  c.fillRect(-50, -50, 100, 100);
  functions.map((x) => (c.save(), x(time), c.restore()));
  c.restore();
};

// Rendering callback will call requestAnimationFrame.
render();
