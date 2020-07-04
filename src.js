var zeroTime;
f = (time) => {
  zeroTime = zeroTime || time;
  time = ((time - zeroTime) / 5e3) % 1;
  requestAnimationFrame(f);
  c.fillStyle = `rgb(${time * 255},${time * 255},${time * 255})`;
  c.fillRect(0, 0, a.width, a.height);
};
f();
