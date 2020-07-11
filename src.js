// Demo title. This is stripped out of the demo by the build system, but it is
// present in the shim.
/* exported title */
var title = 'Star Traveler';

// Temporary variables.
let x, y, z;

// Timestamp of start of animation.
let zeroTime = 0;

// Current time, ranging from 0..10.
let time;

// Return an array 'a' with size 'i', where a[j] = x(j).
let iter = (i, x) => [...Array(i).keys()].map(x);

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
  iter(5e3, (i, u, v, w, y) => {
    [u, v, w] = iter(3, (_) => Math.random() - 0.5);
    y = iter(3, (_) => 99 + 150 * Math.random());
    return (_) => {
      if ((z = 5 - i / 1e3 - Math.log1p(9 ** (time - 8))) > 1e-3 && z < 1) {
        c.translate((u * 99) / z, (v * 99) / z - 20 * smooth(6, -9));
        c.scale(
          (w / 4 + 0.5) * (1.2 - z) + 0.2 * Math.random(),
          (w / 4 + 0.5) * (1.2 - z) + 0.2 * Math.random(),
        );
        color(z * z, y, 111);
        c.fill(star);
        c.scale(0.5, 0.5);
        color(z * z, 999, 111);
        c.fill(star);
      }
    };
  }),
  iter(60, (i, p) => {
    p = new Path2D(
      `M0,99L${fractal(0, 0, 10)
        .map((y, i) => [i, y])
        .join('L')}L1e3,99`,
    );
    return (_) => {
      // Z coordinate.
      if ((z = 2 - i / 25 - time / 5) > 0.02) {
        // Camera movement.
        c.translate(0, 40 * smooth(6, 9) - 20 - 200 * smooth(0, -9));
        c.scale(0.2 / z, 0.2 / z);
        // The x*x*80 is a planetary curvature factor.
        c.translate(-700, 20 + z * z * 80);

        // Mountains
        // Mountains go from x=5..25
        color(
          time * 3,
          145,
          color(z * 2, 121, color(time - 2, 346, 534, 223, 111)),
        );
        // COLORS:
        // - desert brown (night): 443 -> 223
        // - lunar surface (night): 444 -> 222
        // - forest (day): 121 -> 346
        // - forest (?): 121 445
        // - sunset: -> 445
        c.fill(p);

        // Clouds
        // Closest cloud is at z=11 or so, farthest at z=50 or so.
        color(
          time * 0.7 - 1,
          // color(z, 137, 346), // clear day
          color(z, 889, 346), // cloudy day
          color(z * 2, 222, 815, 933), // sunset
          color(z, 112, 334), // night
        );
        c.globalAlpha = smooth(3.5 + z, -2);
        c.translate(time * 80, -25);
        c.scale(2, -1);
        c.fill(p);
      }
    };
  }),
].flat();

// Function to generate colors. Uses x, y. Assigns result to fillStyle and
// returns it as an array of RGB values in the range 0..255.
//
// This function generates a color from a linear gradient. The first parameter
// is the position along the gradient from 0 to N+1, the remaining parameters
// are N colors. The colors can either be [R,G,B] arrays with values in the
// range 0-255, or can be three-digit numbers with one digit for each channel.
// The digits may range from 1 to 9 (0 is not used).
//
// For example, the color black is either 111 or [0,0,0]. White is 999 or
// [255,255,255]. Red is 911 or [255,0,0].
//
// Usage examples:
//
//     color(x, 111, 999); // Gradient, x=0 is black, x=1 is white.
//     color(x, 911, 191, 119); // x=0 is red, x=1 is green, x=2 is blue
//     color(x, 111, color(y, 911, 119)); // Double gradient
let color = (a, ...b) => (
  (a *= a > 0),
  ([x, y] = [...b.slice(a), (x = b.pop()), x].map((y) =>
    y == +y ? [...('' + y)].map((y) => 32 * y - 32) : y,
  )),
  (c.fillStyle = `rgb(${(y = iter(
    3,
    (i) => (1 - (a % 1)) * x[i] + (a % 1) * y[i],
  ))})`),
  y
);

// Smooth step function. Starts with value 0, changes smoothly to value 1. Takes
// two paramaters, which are the transition time, and the
// transition speed, which is a positive number (24 is fast, 8 is slower). The
// transition starts slightly before the given time and finishes slightly after.
//
// For example, smooth(4, 24) changes from 0 to 1 at t=4.
let smooth = (x, y) => 1 / (1 + 3 ** (y * (x - time)));

// Frame rendering callback.
let render = (t) => (
  c.save(),
  c.fillRect(0, 0, a.width, a.height),
  c.translate(a.width / 2, a.height / 2),
  c.scale(a.width / 99, a.width / 99),
  (zeroTime = zeroTime || t - 2e3),
  (time = ((t - zeroTime) / 3e3) % 10),
  requestAnimationFrame(render),
  functions.map((x) => (c.save(), x(), c.restore())),
  color(0, 145),
  c.beginPath(),
  c.arc(0, 0, 0.2 / (10 - time), 0, 7),
  c.fill(),
  c.restore()
);

// Rendering callback will call requestAnimationFrame.
render();
