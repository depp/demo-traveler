// Demo title. This is stripped out of the demo by the build system, but it is
// present in the shim.
/* exported title */
var title = 'Star Traveler';

// Temporary variables.
let x, y, z;

// Timestamp of start of animation.
let zeroTime = 0;

// Return an array 'a' with size 'i', where a[j] = x(j).
let iter = (i, x) => [...Array(i).keys()].map(x);

// Apply a perspective transformation to the canvas. This will make the
// transformation for an object located at (x,y,z). X is right, Y is down, and Z
// is forward. Returns true if the object should be drawn, otherwise the object
// is clipped and should not be drawn.
//
// The front clipping plane is Z=1.
let perspective = (x, y, z) =>
  z > 1 && (c.scale((z = 9 / z), z), c.translate(x, y), 1);

let star = new Path2D('M-1,0L0,1L1,0L0,-1z');

// Generate 10 random mountain ranges.
let functions = [
  iter(1e3, (i, x, y) => {
    i = 1 - i / 1e3;
    x = Math.random() - 0.5;
    y = Math.random() - 0.5;
    return (time) => {
      z = i - time * 0.5;
      if (z > 1e-3 && z < 0.5) {
        c.translate((x * 50) / z, (y * 50) / z);
        c.scale(0.4, 0.4);
        c.fillStyle = '#fff';
        c.fill(star);
      }
    };
  }),
  iter(0, (i, p) => {
    y = iter(8, (_) => 0);
    iter(
      6,
      (i) =>
        (y = y.flatMap((y, j) =>
          j
            ? [(x + y) / 2 + (Math.random() - 0.5) * 15 * 0.51 ** i, (x = y)]
            : [(x = y)],
        )),
    );
    x = y.length / 2;
    p = new Path2D(
      `M-${x},50L${y.map((y, i) => [i - x, y]).join('L')}L${x},50z`,
    );
    return (time) => {
      // Z coordinate.
      x = 60 - 2 * i - time * 20;
      c.translate(0, -20);
      // The x*x/40 is a planetary curvature factor.
      if (perspective(0, 10 + (x * x) / 40, x)) {
        c.translate(0, 10);
        c.fillStyle = color(452, (x / 40) ** 0.3, 223);
        c.fill(p);
      }
    };
  }),
].flat();

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
  c.fillStyle = color(111);
  c.fillRect(-50, -50, 100, 100);
  functions.map((x) => (c.save(), x(time), c.restore()));
  c.restore();
};

// Rendering callback will call requestAnimationFrame.
render();
