import * as WSCapture from '/__wscapture__/module.js';

const canvas = document.getElementById('canvas');
if (canvas == null) {
  throw new Error('Could not find canvas.');
}
const context = canvas.getContext('2d', {
  alpha: false,
  willReadFrequently: true, // Hint for Gecko.
});
if (context == null) {
  throw new Error('Null context');
}

window.a = canvas;
window.b = document.body;
window.c = context;
window.d = document;

let started = false;
const oldRequestAnimationFrame = window.requestAnimationFrame;
window.requestAnimationFrame = function requestAnimationFrame(callback) {
  if (!started) {
    started = true;
    WSCapture.setContext(context);
    WSCapture.startRecording();
  }
  function handler(time) {
    if (WSCapture.beginFrame()) {
      time = WSCapture.currentTimeMS(time);
      if (time >= 5000) {
        WSCapture.stopRecording();
        return;
      }
      callback(time + 1000);
      WSCapture.endFrame();
    } else {
      oldRequestAnimationFrame(handler);
    }
  }
  oldRequestAnimationFrame(handler);
};

{
  const script = document.createElement('script');
  script.src = 'src.js';
  script.type = 'text/javascript';
  document.head.appendChild(script);
}
