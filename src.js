var z;
f = (t) => {
  z = z || t;
  t = ((t - z) / 5e3) % 1;
  requestAnimationFrame(f);
  c.fillStyle = `rgb(${t * 255},${t * 255},${t * 255})`;
  c.fillRect(0, 0, a.width, a.height);
};
f();
