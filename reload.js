// =============================================================================
// Status
// =============================================================================

const statusElt = document.getElementById('status');
const frameElt = document.getElementById('frame');

function setStatus(className, msg) {
  const p = document.createElement('p');
  p.className = className;
  p.appendChild(document.createTextNode(msg));
  while (statusElt.lastChild != null) {
    statusElt.removeChild(statusElt.lastChild);
  }
  statusElt.append(p);
}

setStatus('working', 'Connecting');

// =============================================================================
// Web Socket
// =============================================================================

const ws = new WebSocket(`ws://${window.location.host}/socket`);
ws.addEventListener('error', wsError);
ws.addEventListener('open', wsOpen);
ws.addEventListener('close', wsClose);
ws.addEventListener('message', wsMessage);

function wsError() {
  setStatus('error', 'Disconnected');
}

function wsOpen() {
  setStatus('working', 'Connected');
}

function wsClose() {
  setStatus('error', 'Disconnected');
}

function wsMessage(ev) {
  const [name, ...value] = JSON.parse(ev.data);
  switch (name) {
    case 'status':
      statusMessage(value[0]);
      break;
    case 'changed':
      changedMessage();
      break;
    default:
      console.error(`Unknown message:`, ev.data);
      break;
  }
}

function statusMessage(msg) {
  switch (msg.state) {
    case 'dirty':
      setStatus('working', 'Dirty');
      break;
    case 'ok':
      {
        const { size, sizeLimit } = msg;
        if (size <= sizeLimit) {
          const pct = (100 * (sizeLimit - size)) / sizeLimit;
          setStatus(
            'ok',
            `Ok: ${size}/${sizeLimit} bytes, ${pct.toFixed(1)}% remaining`,
          );
        } else {
          const pct = (100 * (size - sizeLimit)) / sizeLimit;
          setStatus(
            'error',
            `Error: ${size}/${sizeLimit} bytes, ${pct.toFixed(1)}% over`,
          );
        }
      }
      break;
    case 'error':
      setStatus('error', 'Error: ' + msg.message);
      break;
    default:
      console.error(`Unknown status:`, msg);
      break;
  }
}

function changedMessage() {
  frameElt.contentWindow.location.reload();
}
