/* map_noar.js
 * ARを使わないマップ版
 *  - buildCameraChooserItems の挙動を変更し、スポット選択時には explanation.html に遷移します
 *  - 他は map.js と同等の動作（スタンプ帳やカウラの反映など）
 */

const $  = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));

/* ====== 8th Wall 側 URL（未使用だが残す） ====== */
const EIGHTHWALL_URLS = {
  spot7: 'https://maria261081.8thwall.app/test-3/',
  spot8: 'https://maria261081.8thwall.app/icu-library/',
  spot9: 'https://maria261081.8thwall.app/icu-d-memorial/',
  spot4: 'https://maria261081.8thwall.app/spot4/',
  spot5: 'https://maria261081.8thwall.app/spot5/',
  spot6: 'https://maria261081.8thwall.app/spot6/'
};

const ALL_SPOTS       = ['spot7','spot8','spot9'];
const AR_SPOTS        = ALL_SPOTS.slice();
const COMPLETE_TARGET = 3;

const SPOT_LABELS = {
  spot7: '本館正面玄関<br>Main Building — Front Entrance',
  spot8: '図書館手前<br>In Front of the Library',
  spot9: 'D館記念碑<br>D-Building Monument',
  spot4: 'チャペル<br>Chapel',
  spot5: '新体育館<br>PEC-A',
  spot6: '<h2>Goal</h2>本館 3F<br>University Hall 3F',
};
// Per-spot overrides for photo sources (non-AR map). Use PNGs for some spots when needed.
// Main building (spot7) uses default spot07.JPG, override the others as requested:
const OVERRIDE_PHOTOS = {
  spot8: 'assets/images/current_photos/spot08.PNG',
  spot9: 'assets/images/current_photos/spot08.PNG'
};
const photoSrc = (spotId) => {
  if (OVERRIDE_PHOTOS[spotId]) return OVERRIDE_PHOTOS[spotId];
  const nn = String(spotId.replace('spot','')).padStart(2,'0');
  return `assets/images/current_photos/spot${nn}.JPG`;
};

function lsGet(k){ try{return localStorage.getItem(k);}catch{return null;} }
function lsSet(k,v){ try{localStorage.setItem(k,v);}catch{} }
function lsKeyStamp(uid, spot){ return `stamp_${uid}_${spot}`; }
// Use a page-scoped seen key so map_noar shows its own complete popup
function seenKey(uid){ return `complete_${COMPLETE_TARGET}_seen_map_noar_${uid}`; }

async function ensureAnonSafe() {
  if (typeof window.ensureAnon === 'function') {
    try { const uid = await window.ensureAnon(); if (uid) return uid; } catch(e){}
  }
  try {
    if (!firebase?.apps?.length && typeof firebaseConfig !== 'undefined') {
      firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    if (auth.currentUser) return auth.currentUser.uid;
    const cred = await auth.signInAnonymously();
    return cred.user && cred.user.uid;
  } catch(e) {
    console.warn('[map_noar] ensureAnon fallback failed:', e?.message||e);
    return lsGet('uid') || null;
  }
}

async function fetchStamps(uid) {
  let remote = null;
  try {
    const snap = await firebase.database().ref(`users/${uid}/stamps`).once('value');
    remote = snap && snap.val ? snap.val() : null;
  } catch(e) {
    console.warn('[map_noar] fetch stamps remote failed:', e?.message||e);
  }

  const stamps = {};
  ALL_SPOTS.forEach(id=>{
    const local = lsGet(lsKeyStamp(uid,id)) === 'true';
    stamps[id] = (remote && !!remote[id]) || local || false;
  });
  return stamps;
}

function renderStampUI(stamps){
  $$('.stamp-cell[data-spot]').forEach(cell=>{
    const spot = cell.dataset.spot;
    const got  = !!stamps[spot];
    cell.classList.toggle('is-got', got);
    const mark = cell.querySelector('.mark');
    if (mark) mark.textContent = got ? '✅取得済' : '未取得';
  });

  const cnt = ALL_SPOTS.reduce((n,id)=> n + (stamps[id] ? 1 : 0), 0);
  const elCount = $('#stampCount');
  if (elCount) elCount.textContent = `${cnt}/${ALL_SPOTS.length}`;

  const inline = $('#completeInline');
  if (inline) inline.style.display = (cnt >= COMPLETE_TARGET) ? 'block' : 'none';
  const special = $('#specialInline');
  if (special) special.style.display = (cnt >= COMPLETE_TARGET) ? 'block' : 'none';
}

function openCompleteModal(){
  $('#completeOverlay')?.classList.add('is-open');
  $('#completeModal')?.classList.add('is-open');
}
function closeCompleteModal(){
  $('#completeOverlay')?.classList.remove('is-open');
  $('#completeModal')?.classList.remove('is-open');
}
function bindCompleteModalButtons(){
  $('#closeComplete')?.addEventListener('click', closeCompleteModal);
  $('#completeOverlay')?.addEventListener('click', closeCompleteModal);
}
function countCollected(stamps){
  return ALL_SPOTS.reduce((acc,id)=> acc + (stamps[id] ? 1 : 0), 0);
}
async function handleCompletionFlow(uid, stamps){
  // Completion modal is handled centrally by js/complete.js; avoid duplicating behavior here.
  return;
}

function buildCameraChooserItems(){
  const list = $('#cameraChooserList');
  if (!list) return;
  list.innerHTML = '';

  ALL_SPOTS.forEach((id)=>{
    const name = SPOT_LABELS[id] || id.toUpperCase();
    const src  = photoSrc(id);

    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `
      <a class="photoLink" href="#" data-spot="${id}" aria-label="${name}">
        <div class="thumbWrap">
          <img loading="lazy" src="${src}" alt="${name}">
          <div class="label">${name}</div>
        </div>
      </a>
    `;
    list.appendChild(item);
  });

  // 画像クリックで 解説ページへ（ARなしフロー）
  list.querySelectorAll('a.photoLink[data-spot]').forEach(a=>{
    a.addEventListener('click', async (ev)=>{
      ev.preventDefault();
      const spot = a.getAttribute('data-spot');
      const uid  = await ensureAnonSafe();
  const url  = new URL('explanation.html', location.href);
  url.searchParams.set('spotId', spot);
  // 戻り先を指定して、解説ページから元の map_noar に戻れるようにする
  url.searchParams.set('returnTo','map_noar.html');
  if (uid) url.searchParams.set('uid', uid);
      location.href = url.toString();
    });
  });
}

function showCameraChooser(){
  buildCameraChooserItems();
  $('#cameraChooserOverlay')?.classList.add('is-open');
  $('#cameraChooser')?.classList.add('is-open');
}
function hideCameraChooser(){
  $('#cameraChooserOverlay')?.classList.remove('is-open');
  $('#cameraChooser')?.classList.remove('is-open');
}

async function boot(){
  bindCompleteModalButtons();

  $('#cameraBtn')?.addEventListener('click', showCameraChooser);
  $('#cameraChooserClose')?.addEventListener('click', hideCameraChooser);
  $('#cameraChooserOverlay')?.addEventListener('click', hideCameraChooser);

  const uid = await ensureAnonSafe();
  const stamps = await fetchStamps(uid);
  renderStampUI(stamps);
  await handleCompletionFlow(uid, stamps);

  document.addEventListener('visibilitychange', async ()=>{
    if (document.visibilityState === 'visible') {
      const s = await fetchStamps(uid);
      renderStampUI(s);
      await handleCompletionFlow(uid, s);
    }
  });
  window.addEventListener('pageshow', async ()=>{
    const s = await fetchStamps(uid);
    renderStampUI(s);
    await handleCompletionFlow(uid, s);
  });

  // data-ar-spot で直接ボタンがある場合は解説ページへ
  document.querySelectorAll('[data-ar-spot]').forEach(btn=>{
    btn.addEventListener('click', async (ev)=>{
      ev.preventDefault();
      const spot = btn.getAttribute('data-ar-spot');
  const uid = await ensureAnonSafe();
  const url = new URL('explanation.html', location.href);
  url.searchParams.set('spotId', spot);
  url.searchParams.set('returnTo','map_noar.html');
  if (uid) url.searchParams.set('uid', uid);
  location.href = url.toString();
    });
  });

  // フォールバックで個別ボタンがある場合、ALL_SPOTS のみをバインド（解説ページへ）
  ALL_SPOTS.forEach(spot => {
    const el = document.getElementById('openAR-' + spot);
    if (el && !el._arBound) {
      el._arBound = true;
      el.addEventListener('click', async (e)=>{
        e.preventDefault();
        const uid = await ensureAnonSafe();
        const url = new URL('explanation.html', location.href);
        url.searchParams.set('spotId', spot);
        if (uid) url.searchParams.set('uid', uid);
        location.href = url.toString();
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', boot);
