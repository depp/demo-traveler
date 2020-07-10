// Demo title. This is stripped out of the demo by the build system, but it is
// present in the shim.
/* exported title */
var title = 'Star Traveler';

// Temporary variables.
let x, y, z;

// Timestamp of start of animation.
let zeroTime = 0;

// Current time.
let time;

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

let star = new Path2D(
  'M-1,0A1,1,0,0,0,0,-1A1,1,0,0,0,1,0A1,1,0,0,0,0,1A1,1,0,0,0,-1,0',
);

let fractal = (x, y, i, z) =>
  i--
    ? ((z = (x + y) / 2 + ((Math.random() - 0.5) * (i < 5) * 2 ** i) / 2),
      [fractal(x, z, i), fractal(z, y, i)].flat())
    : [x];

// Generate 10 random mountain ranges.
let functions = [
  iter(4e3, (i, u, v, w, y) => {
    i = 4 - i / 1e3;
    u = Math.random() - 0.5;
    v = Math.random() - 0.5;
    w = Math.random() * 0.5 + 0.5;
    y = iter(3, (_) => 1 + 8 * Math.random());
    return (_) => {
      z = i - smooth2(5, 9) / 3;
      if (z > 1e-3 && z < 1) {
        c.translate((u * 99) / z, (v * 99) / z + 20 * (smooth(4, 24) - 1));
        c.scale(
          w * (z < 0.8 ? 1 - z : 0.2) + 0.2 * Math.random(),
          w * (z < 0.8 ? 1 - z : 0.2) + 0.2 * Math.random(),
        );
        color(y, z * z, 111);
        c.fill(star);
        c.scale(0.5, 0.5);
        color(999, z * z, 111);
        c.fill(star);
      }
    };
  }),
  iter(80, (i, p) => {
    x = (i & 1) * Math.random() * 20;
    y = fractal(0, 0, 10);
    p = new Path2D(`M0,50L${y.map((y, i) => [i, x + y]).join('L')}L500,50z`);
    return (_) => {
      c.translate(0, 40 * smooth(4, 24) - 20);
      // Z coordinate.
      x = 80 - i - time * 40;
      // The x*x/40 is a planetary curvature factor.
      if (perspective(0, 10 + (x * x) / 30, x)) {
        c.translate(-700, 10);
        if (i & 1) {
          // Closest cloud is at x==11 or so, farthest at x=40 or so
          // 0.7 ..
          color(223, (x / 50 - 0.2) * 1, 445);
          c.globalAlpha = 1 - smooth(1.5 + i / 60, 8);
          c.translate(time * 800, -25);
          c.scale(2, -1);
        } else {
          color(452, x ** 0.3 / 3, 223);
        }
        c.fill(p);
      }
    };
  }),
].flat();

// Function to generate colors. Uses x, y. Assigns result to fillStyle.
//
// Colors are specified as RGB in decimal, with 111 black, 119 is blue, and 999
// is white. After the first color, each next color is mixed in linearly, using
// an interpolation coefficient that comes before the color. Colors can either
// be arrays or integers, so 123 is the same as [1,2,3].
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
      : (y = y.map(
          (y, i) => y * (1 - x) + x * 32 * ((z == +z ? z + '' : z)[i] - 1),
        )),
  ),
  (c.fillStyle = `rgb(${y})`)
);

// Smooth step function. Starts with value 0, changes smoothly to value 1. Takes
// two paramaters, which are the transition time, in the range 0..9, and the
// transition speed, which is a positive number (24 is fast, 8 is slower). The
// transition starts slightly before the given time and finishes slightly after.
//
// For example, smooth(4, 24) changes from 0 to 1 at t=4/9.
// The smooth2 function identical to smooth until the transition time, and
// increases linearly afterwards.
let smooth = (x, y) => 1 / (1 + Math.exp(y * 4 * (x / 9 - time)));
let smooth2 = (x, y) =>
  x / 9 - time < 0 ? 0.5 - y * (x / 9 - time) : smooth(x, y);

// Frame rendering callback.
let render = (t) => {
  c.save();
  c.translate(a.width / 2, a.height / 2);
  c.scale(a.width * 0.01, a.width * 0.01);
  zeroTime = zeroTime || t;
  time = ((t - zeroTime) / 2e4) % 1;
  requestAnimationFrame(render);
  color(111);
  c.fillRect(-50, -50, 100, 100);
  functions.map((x) => (c.save(), x(), c.restore()));
  c.restore();
};

// Rendering callback will call requestAnimationFrame.
render();
