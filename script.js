/* Interactive behavior:
 - Hover/approach Yes: it enlarges
 - Hover/approach No: it dodges away
 - Click Yes: celebration animation (confetti + hearts + transitions)
 */
const yes = document.getElementById('yes');
const no = document.getElementById('no');
const actions = document.getElementById('actions');
const card = document.getElementById('card');
const result = document.getElementById('result');
const confettiRoot = document.getElementById('confetti-root');

let lastNoMove = 0;
const NO_MOVE_COOLDOWN = 75; // ms
const NO_THRESHOLD = 210;
let lastPointer = {x: window.innerWidth / 2, y: window.innerHeight / 2};
let yesHover = false;
let accepted = false;

function placeNoInitial(){
  // position the NO button at its starting spot inside actions
  const rect = actions.getBoundingClientRect();
  const pad = 12;
  const left = Math.max(pad, rect.width - no.offsetWidth - pad);
  const top = Math.max(pad, (rect.height - no.offsetHeight) / 2);
  no.style.left = left + 'px';
  no.style.top = top + 'px';
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

function setYesScale(scale){
  yes.style.transform = `scale(${scale})`;
}

function distance(ax, ay, bx, by){
  return Math.hypot(ax - bx, ay - by);
}

function updateYesScaleFromPointer(px, py){
  const yesRect = yes.getBoundingClientRect();
  const ycx = yesRect.left + yesRect.width / 2;
  const ycy = yesRect.top + yesRect.height / 2;
  const d = distance(px, py, ycx, ycy);

  const threshold = 180;
  let scale = 1;
  if (d < threshold) {
    // ease-out as cursor approaches
    const t = 1 - d / threshold;
    scale = 1 + t * 0.55;
  }
  if (yesHover) scale = Math.max(scale, 1.25);
  setYesScale(scale);
}

function isTooCloseToYes(candidateLeft, candidateTop, noRect, rect){
  const yesRect = yes.getBoundingClientRect();
  const yesCenterX = (yesRect.left - rect.left) + yesRect.width / 2;
  const yesCenterY = (yesRect.top - rect.top) + yesRect.height / 2;
  const noCenterX = candidateLeft + noRect.width / 2;
  const noCenterY = candidateTop + noRect.height / 2;
  const min = Math.max(yesRect.width, 90);
  return distance(noCenterX, noCenterY, yesCenterX, yesCenterY) < min;
}

function pickBestEscapeSpot(noRect, rect, localCursorX, localCursorY, pad, maxLeft, maxTop){
  let bestLeft = clamp((noRect.left - rect.left) + 120, pad, maxLeft);
  let bestTop = clamp((noRect.top - rect.top) - 24, pad, maxTop);
  let bestScore = -Infinity;

  for (let i = 0; i < 18; i++) {
    const trialLeft = clamp(pad + Math.random() * Math.max(0, maxLeft - pad), pad, maxLeft);
    const trialTop = clamp(pad + Math.random() * Math.max(0, maxTop - pad), pad, maxTop);
    if (isTooCloseToYes(trialLeft, trialTop, noRect, rect)) continue;

    const trialCenterX = trialLeft + noRect.width / 2;
    const trialCenterY = trialTop + noRect.height / 2;
    const score = distance(trialCenterX, trialCenterY, localCursorX, localCursorY);
    if (score > bestScore) {
      bestScore = score;
      bestLeft = trialLeft;
      bestTop = trialTop;
    }
  }

  return {left: bestLeft, top: bestTop};
}

function dodgeNoFromPointer(px, py, force = false){
  const rect = actions.getBoundingClientRect();
  const noRect = no.getBoundingClientRect();
  const localCursorX = px - rect.left;
  const localCursorY = py - rect.top;
  const noCenterX = (noRect.left - rect.left) + noRect.width/2;
  const noCenterY = (noRect.top - rect.top) + noRect.height/2;
  const dx = noCenterX - localCursorX;
  const dy = noCenterY - localCursorY;
  const dn = Math.hypot(dx, dy);
  const pad = 12;
  const maxLeft = Math.max(pad, rect.width - noRect.width - pad);
  const maxTop = Math.max(pad, rect.height - noRect.height - pad);

  if (!force) {
    if (dn >= NO_THRESHOLD) return;
    if ((Date.now() - lastNoMove) <= NO_MOVE_COOLDOWN) return;
  } else {
    if ((Date.now() - lastNoMove) <= 25) return;
  }

  // if distance is tiny, pick a random direction
  let ux = 0, uy = 0;
  if (dn === 0) {
    const a = Math.random() * Math.PI * 2;
    ux = Math.cos(a);
    uy = Math.sin(a);
  } else {
    ux = dx / dn;
    uy = dy / dn;
  }
  // move distance scales with how close the cursor is
  const moveDist = (NO_THRESHOLD - Math.min(dn, NO_THRESHOLD)) * 2.05 + 115 + Math.random() * 45;

  const curLeft = noRect.left - rect.left;
  const curTop = noRect.top - rect.top;
  let newLeft = curLeft + ux * moveDist + (Math.random() - 0.5) * 60;
  let newTop = curTop + uy * moveDist + (Math.random() - 0.5) * 40;

  newLeft = clamp(newLeft, pad, maxLeft);
  newTop = clamp(newTop, pad, maxTop);

  // Avoid overlapping Yes; if too close, randomize a few times.
  if (isTooCloseToYes(newLeft, newTop, noRect, rect)) {
    const best = pickBestEscapeSpot(noRect, rect, localCursorX, localCursorY, pad, maxLeft, maxTop);
    newLeft = best.left;
    newTop = best.top;
  }

  if (force) {
    const best = pickBestEscapeSpot(noRect, rect, localCursorX, localCursorY, pad, maxLeft, maxTop);
    const currentDistance = distance(
      newLeft + noRect.width / 2,
      newTop + noRect.height / 2,
      localCursorX,
      localCursorY
    );
    const bestDistance = distance(
      best.left + noRect.width / 2,
      best.top + noRect.height / 2,
      localCursorX,
      localCursorY
    );
    if (bestDistance > currentDistance) {
      newLeft = best.left;
      newTop = best.top;
    }
  }

  no.style.left = newLeft + 'px';
  no.style.top = newTop + 'px';
  lastNoMove = Date.now();
}

// reset yes scale and optionally nudge no back when leaving area
actions.addEventListener('pointerleave', ()=>{
  yesHover = false;
  setYesScale(1);
});

function spawnConfetti(x = window.innerWidth/2){
  const colors = ['#ff3b7a','#ffcc00','#45d6a4','#6e77ff','#ff7aa2'];
  const count = 32;
  for(let i=0;i<count;i++){
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.left = (x + (Math.random()-0.5)*300) + 'px';
    el.style.top = (Math.random()*30 - 50) + 'px';
    el.style.width = (6 + Math.random()*8) + 'px';
    el.style.height = (10 + Math.random()*16) + 'px';
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    el.style.animationDuration = (1200 + Math.random()*1000) + 'ms';
    confettiRoot.appendChild(el);
    setTimeout(()=>el.remove(),2500);
  }
}

function spawnHearts(x, y){
  const hearts = ['💖','💗','💘','💝','💕'];
  const count = 10;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'heart';
    el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    el.style.left = (x + (Math.random() - 0.5) * 40) + 'px';
    el.style.top = (y + (Math.random() - 0.5) * 20) + 'px';
    el.style.fontSize = (16 + Math.random() * 14) + 'px';
    el.style.animationDuration = (700 + Math.random() * 550) + 'ms';
    el.style.setProperty('--r', `${(Math.random() - 0.5) * 50}deg`);
    confettiRoot.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
}

yes.addEventListener('click', ()=>{
  if (accepted) return;
  accepted = true;
  yesHover = false;
  setYesScale(1);

  document.body.classList.add('celebrate');
  yes.classList.add('pop');

  // animate card into result
  card.classList.add('accepted');

  const yesRect = yes.getBoundingClientRect();
  const cx = yesRect.left + yesRect.width / 2;
  const cy = yesRect.top + yesRect.height / 2;
  spawnHearts(cx, cy);

  // small delay then show result
  setTimeout(()=>{
    result.classList.add('active');
    spawnConfetti(window.innerWidth / 2);
  },300);

  setTimeout(() => {
    yes.classList.remove('pop');
  }, 600);
});

yes.addEventListener('pointerenter', ()=>{
  yesHover = true;
  setYesScale(1.25);
});
yes.addEventListener('pointerleave', ()=>{
  yesHover = false;
  setYesScale(1);
});

function onPointerMove(e){
  if (accepted) return;
  lastPointer = {x: e.clientX, y: e.clientY};
  updateYesScaleFromPointer(lastPointer.x, lastPointer.y);
  dodgeNoFromPointer(lastPointer.x, lastPointer.y, false);
}

// track pointer globally so dodge reacts sooner
window.addEventListener('pointermove', onPointerMove, {passive: true});
no.addEventListener('pointerenter', ()=>{
  if (accepted) return;
  dodgeNoFromPointer(lastPointer.x, lastPointer.y, true);
});
no.addEventListener('pointermove', ()=>{
  if (accepted) return;
  dodgeNoFromPointer(lastPointer.x, lastPointer.y, true);
});
no.addEventListener('pointerdown', (e)=>{
  if (accepted) return;
  e.preventDefault();
  e.stopPropagation();
  lastPointer = {x: e.clientX, y: e.clientY};
  dodgeNoFromPointer(lastPointer.x, lastPointer.y, true);
});
no.addEventListener('click', (e)=>{
  if (accepted) return;
  e.preventDefault();
  e.stopPropagation();
});
no.addEventListener('touchstart', (e)=>{
  if (accepted) return;
  e.preventDefault();
  const touch = e.touches[0];
  if (touch) {
    lastPointer = {x: touch.clientX, y: touch.clientY};
    dodgeNoFromPointer(lastPointer.x, lastPointer.y, true);
  }
}, {passive: false});
no.addEventListener('keydown', (e)=>{
  if (accepted) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    dodgeNoFromPointer(lastPointer.x, lastPointer.y, true);
  }
});

// reposition NO on resize or load
window.addEventListener('resize', placeNoInitial);
window.addEventListener('load', ()=>{placeNoInitial();});
