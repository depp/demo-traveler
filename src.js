z = 0;
t = 'M-50,0';
for (x = -50; x < 51; x++) {
  t += ' L' + [x, Math.random() * 10];
}
t += ' L50,50 L-50,50 z';
p = new Path2D(t);
f = (time) => {
  c.save();
  c.translate(a.width / 2, a.height / 2);
  c.scale(a.width * 0.01, a.width * 0.01);
  z = z || time;
  time = ((time - z) / 5e3) % 1;
  requestAnimationFrame(f);
  c.fillStyle = `rgb(${time * 255},${time * 255},${time * 255})`;
  c.fillRect(-50, -50, 100, 100);
  c.fillStyle = '#060';
  c.fill(p);
  c.restore();
};
f();
