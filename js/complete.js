// complete.js（差し替え版）
// 目的：現在ユーザーのスタンプ取得を「3スポット」で判定し、UIを表示。
// 仕様：
//  - Firebase v8 を使用し users/<uid>/stamps を once('value') で取得
//  - ローカルフォールバックは uid 名前空間付き localStorage: stamp_<uid>_<spotId> = 'true'
//  - uid 取得は ensureAnon() 優先、失敗時は localStorage の uid
//  - 完走（3/3）で #completeCard を表示、未達なら #notComplete を表示

(function () {
  const ALL_SPOTS = ['spot7','spot8','spot9'];
  const TARGET = 3;

  function getLocalUid() {
    try { return localStorage.getItem('uid') || null; } catch { return null; }
  }
  async function getUid() {
    if (typeof window.ensureAnon === 'function') {
      try {
        const uid = await window.ensureAnon();
        if (uid) return uid;
      } catch {}
    }
    return getLocalUid();
  }

  function lsKey(uid, spot) { return `stamp_${uid}_${spot}`; }
  function localGot(uid, spot) {
    if (!uid) return false;
    try { return localStorage.getItem(lsKey(uid, spot)) === 'true'; } catch { return false; }
  }

  async function fetchRemoteStamps(uid) {
    if (!uid) return {};
    try {
      if (!(window.firebase && firebase.apps && firebase.apps.length)) return {};
      const snap = await firebase.database().ref(`users/${uid}/stamps`).once('value');
      return snap && snap.val ? snap.val() : {};
    } catch (e) {
      console.warn('[complete] remote fetch failed:', e?.message || e);
      return {};
    }
  }

  async function detectComplete() {
    const uid = await getUid();
    const remote = await fetchRemoteStamps(uid);
    const owned = {};
    ALL_SPOTS.forEach(s => {
      const r = !!remote[s];
      const l = localGot(uid, s);
      owned[s] = r || l;
    });
    const count = ALL_SPOTS.reduce((n, s) => n + (owned[s] ? 1 : 0), 0);
    return {ok: count >= TARGET, uid};
  }

  // -- helpers for modal insertion / i18n
  function getPageOrigin() {
    const p = (location.pathname || '').split('/').pop() || '';
    if (p.indexOf('map_noar') !== -1) return 'map_noar.html';
    return 'map.html';
  }

  function seenKeyFor(uid, origin) {
    return `complete_seen_${origin}_${uid}`;
  }

  function getLang(){ try { return localStorage.getItem('app_lang') || 'ja'; } catch { return 'ja'; } }

  function createModal(origin) {
    if (document.getElementById('completeOverlay')) return; // already added

    const lang = getLang();
    const texts = {
      ja: { title: '🎉 コンプリート！', lead: '全てのスタンプを集めました。ご参加ありがとうございます！', back: 'マップに戻る', survey: 'アンケートへ' },
      en: { title: '🎉 Completed!', lead: 'You collected all the stamps. Thank you for joining!', back: 'Back to Map', survey: 'Go to Survey' }
    };
    const t = texts[lang] || texts.ja;

    const ov = document.createElement('div');
    ov.id = 'completeOverlay';
    ov.className = 'complete-overlay';
    ov.setAttribute('aria-hidden', 'true');

    const modal = document.createElement('div');
    modal.id = 'completeModal';
    modal.className = 'complete-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','completeTitle');
    modal.setAttribute('aria-describedby','completeLead');

    modal.innerHTML = `
      <h2 id="completeTitle" class="complete-title">${t.title}</h2>
      <p id="completeLead" class="complete-lead">${t.lead}</p>
      <div class="complete-row">
        <button id="closeComplete" class="btn btn-secondary" type="button">${t.back}</button>
        <a id="toSurvey" class="btn" href="post-survey.html?returnTo=${origin}">${t.survey}</a>
      </div>
    `;

    document.body.appendChild(ov);
    document.body.appendChild(modal);

    // handlers
    document.getElementById('closeComplete')?.addEventListener('click', ()=>{
      // navigate back to origin (keeps behavior consistent)
      location.href = origin;
    });
  }

  function openModal() {
    const ov = document.getElementById('completeOverlay');
    const modal = document.getElementById('completeModal');
    if (!ov || !modal) return;
    ov.classList.add('is-open'); modal.classList.add('is-open');
    ov.setAttribute('aria-hidden','false');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // detect
    const res = await detectComplete();
    const ok = res.ok; const uid = res.uid;

    // map pages may want to show inline links; leave that to map.js but show modal centrally
    if (!ok) return;

    const origin = getPageOrigin();
    // if already seen for this origin and uid, do nothing
    try {
      const seenKey = seenKeyFor(uid || 'anon', origin);
      if (localStorage.getItem(seenKey) === 'true') return;
      // inject modal and show
      createModal(origin);
      openModal();
      // mark seen
      try { localStorage.setItem(seenKey, 'true'); } catch(e){}
    } catch (e) {
      console.warn('[complete] show failed', e);
    }
  });
})();
