(() => {
  const LANGS = { es: 'Español', en: 'English', ja: '日本語', zh: '中文', ko: '한국어' };
  const UI = {
    es: { welcomeTitle: 'Experiencia de realidad aumentada', welcomeText: 'Necesitamos tu cámara para mostrarte la experiencia. No se guarda ninguna imagen.', allowCamera: 'Permitir cámara', camDenied: 'No pudimos acceder a la cámara. Actívala en los ajustes del navegador e inténtalo de nuevo.', stickyTitle: '¿Cómo quieres ver la experiencia?', stickyYes: 'Fija', stickyYesHint: 'Se queda en pantalla aunque muevas la cámara', stickyNo: 'Sigue al objeto', stickyNoHint: 'Desaparece si dejas de enfocar el objeto', aim: 'Enfoca la silueta', readMore: 'Leer más', close: 'Cerrar', restart: 'Volver a ver', endTitle: '¡Gracias por visitarnos!', loading: 'Cargando…', notReady: 'Esta experiencia aún no está lista.' },
    en: { welcomeTitle: 'Augmented reality experience', welcomeText: 'We need your camera to show you the experience. No images are stored.', allowCamera: 'Allow camera', camDenied: "We couldn't access the camera. Enable it in your browser settings and try again.", stickyTitle: 'How do you want to see it?', stickyYes: 'Sticky', stickyYesHint: 'Stays on screen even if you move the camera', stickyNo: 'Follows the object', stickyNoHint: 'Disappears when you stop pointing at the object', aim: 'Aim at the outline', readMore: 'Read more', close: 'Close', restart: 'Watch again', endTitle: 'Thank you for visiting!', loading: 'Loading…', notReady: 'This experience is not ready yet.' },
    ja: { welcomeTitle: 'AR（拡張現実）体験', welcomeText: '体験を表示するためにカメラを使用します。画像は保存されません。', allowCamera: 'カメラを許可', camDenied: 'カメラにアクセスできませんでした。ブラウザの設定で許可して、もう一度お試しください。', stickyTitle: '表示方法を選んでください', stickyYes: '固定表示', stickyYesHint: 'カメラを動かしても画面に残ります', stickyNo: '対象に追従', stickyNoHint: '対象から外れると消えます', aim: 'シルエットに合わせてください', readMore: '続きを読む', close: '閉じる', restart: 'もう一度見る', endTitle: 'ご来訪ありがとうございました！', loading: '読み込み中…', notReady: 'この体験はまだ準備中です。' },
    zh: { welcomeTitle: '增强现实体验', welcomeText: '我们需要使用您的摄像头来展示体验，不会保存任何图像。', allowCamera: '允许使用摄像头', camDenied: '无法访问摄像头。请在浏览器设置中开启后重试。', stickyTitle: '您想如何观看？', stickyYes: '固定显示', stickyYesHint: '移动摄像头后内容仍留在屏幕上', stickyNo: '跟随物体', stickyNoHint: '不再对准物体时内容会消失', aim: '请对准轮廓', readMore: '阅读更多', close: '关闭', restart: '再看一次', endTitle: '感谢您的参观！', loading: '加载中…', notReady: '该体验尚未准备好。' },
    ko: { welcomeTitle: '증강현실 체험', welcomeText: '체험을 보여 드리기 위해 카메라가 필요합니다. 이미지는 저장되지 않습니다.', allowCamera: '카메라 허용', camDenied: '카메라에 접근할 수 없습니다. 브라우저 설정에서 허용한 후 다시 시도해 주세요.', stickyTitle: '어떻게 보시겠어요?', stickyYes: '고정', stickyYesHint: '카메라를 움직여도 화면에 남아 있습니다', stickyNo: '대상 따라가기', stickyNoHint: '대상에서 벗어나면 사라집니다', aim: '실루엣에 맞춰 주세요', readMore: '더 보기', close: '닫기', restart: '다시 보기', endTitle: '방문해 주셔서 감사합니다!', loading: '로딩 중…', notReady: '이 체험은 아직 준비되지 않았습니다.' }
  };

  const $ = (s) => document.querySelector(s);
  let lang = detectLang(), exp = null, sticky = false, raf = 0;

  function detectLang() {
    for (const l of navigator.languages || [navigator.language]) {
      const c = (l || '').toLowerCase().slice(0, 2);
      if (UI[c]) return c;
    }
    return 'en';
  }
  const t = (k) => (UI[lang] && UI[lang][k]) || UI.en[k];
  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i]').forEach((el) => (el.textContent = t(el.dataset.i)));
    $('#langSel').value = lang;
  }
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    document.body.classList.toggle('ar', id === 'screenAR');
  }
  function getText() {
    const tx = (curEl && curEl.texts) || {};
    const pick = tx[lang] || tx.en || Object.values(tx)[0] || {};
    return { title: pick.title || '', body: pick.body || '' };
  }

  async function init() {
    $('#langSel').innerHTML = Object.entries(LANGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    $('#langSel').onchange = (e) => { lang = e.target.value; applyI18n(); };
    applyI18n();
    try {
      const list = await (await fetch('/api/experiences')).json();
      const id = new URLSearchParams(location.search).get('e');
      exp = list.find((e) => e.id === id) || list[0];
    } catch (e) {}
    $('#btnCamera').onclick = askCamera;
    document.querySelectorAll('[data-sticky]').forEach((b) => (b.onclick = () => { sticky = b.dataset.sticky === '1'; startAR(); }));
    $('#btnRestart').onclick = startAR;
    $('#btnX').onclick = closeAR;
    $('#btnClose').onclick = closeAR;
    $('#btnMore').onclick = () => {
      const x = getText();
      $('#modalTitle').textContent = x.title;
      $('#modalBody').textContent = x.body;
      $('#modal').classList.remove('hidden');
    };
    $('#btnModalClose').onclick = () => $('#modal').classList.add('hidden');
  }

  // 1 y 2: permiso de cámara + detección de idioma
  async function askCamera() {
    const msg = $('#camMsg');
    msg.textContent = '';
    if (!exp || !exp.targetSrc) { msg.textContent = t('notReady'); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      s.getTracks().forEach((tr) => tr.stop());
    } catch (e) { msg.textContent = t('camDenied'); return; }
    lang = detectLang();
    applyI18n();
    show('screenSticky');
  }

  // ---- Experiencia: el objetivo solo sirve de disparador; los elementos van a pantalla completa
  const NEXT = { es: 'Siguiente', en: 'Next', ja: '次へ', zh: '下一步', ko: '다음' };
  Object.keys(NEXT).forEach((k) => (UI[k].next = NEXT[k]));
  let curEl = null, idx = -1, started = false;
  const vid = document.createElement('video');
  vid.playsInline = true; vid.setAttribute('webkit-playsinline', '');
  const hide = (list) => list.forEach((s) => $(s).classList.add('hidden'));

  // Audio separado, con botón para silenciarlo
  const SOUND = { es: ['Silenciar', 'Activar sonido'], en: ['Mute', 'Sound on'], ja: ['ミュート', '音を出す'], zh: ['静音', '开启声音'], ko: ['음소거', '소리 켜기'] };
  const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
  const aud = new Audio();
  const soundLabel = () => {
    const s = SOUND[lang] || SOUND.en;
    $('#btnSound').textContent = aud.paused ? '🔊 ' + s[1] : '🔇 ' + s[0];
  };
  ['play', 'pause', 'ended'].forEach((e) => aud.addEventListener(e, soundLabel));
  const unlockAudio = () => { aud.src = SILENT; aud.play().catch(() => {}); };  // se llama con un toque del usuario (iPhone)
  const stopAudio = () => { aud.pause(); aud.removeAttribute('src'); $('#btnSound').classList.add('hidden'); };

  function startAR() {
    show('screenAR');
    idx = -1; started = false; unlockAudio(); $('#btnSound').classList.add('hidden');
    $('#silImg').src = exp.silhouetteSrc || '';
    $('#silImg').style.display = exp.silhouetteSrc ? '' : 'none';
    hide(['#textPanel', '#modal', '#stage', '#btnNextF']);
    $('#stage').innerHTML = '';
    $('#silhouette').classList.remove('hidden');
    $('#loading').classList.remove('hidden');
    $('#loading').textContent = t('loading');

    const holder = $('#sceneHolder');
    holder.innerHTML = `
      <a-scene mindar-image="imageTargetSrc: ${exp.targetSrc}; uiLoading: no; uiScanning: no; uiError: no; missTolerance: 5; warmupTolerance: 3"
               color-space="sRGB" renderer="colorManagement: true, physicallyCorrectLights"
               vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" embedded>
        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
        <a-entity id="target" mindar-image-target="targetIndex: 0"></a-entity>
      </a-scene>`;
    const scene = holder.querySelector('a-scene');
    const target = holder.querySelector('#target');
    scene.addEventListener('arReady', () => $('#loading').classList.add('hidden'));
    scene.addEventListener('arError', () => { $('#loading').textContent = t('notReady'); });
    target.addEventListener('targetFound', () => {
      $('#silhouette').classList.add('hidden');
      if (!started) { started = true; next(); }
    });
    target.addEventListener('targetLost', () => { if (!sticky && started) resetExp(); });
  }

  function next() {
    const els = exp.elements || [];
    idx++;
    if (idx >= els.length) return closeAR();
    curEl = els[idx];
    const last = idx === els.length - 1;
    const stage = $('#stage');
    hide(['#textPanel', '#btnNextF']);
    stopAudio();
    if (curEl.type === 'text') { stage.classList.remove('hidden'); return showText(last); }
    vid.pause(); vid.onended = null;
    stage.classList.remove('hidden');
    if (curEl.type === 'video') {
      stage.innerHTML = ''; stage.appendChild(vid);
      vid.src = pickSrc(curEl); vid.muted = false;
      vid.onended = next;
      vid.play().catch(() => { vid.muted = true; vid.play().catch(() => {}); });
    } else {
      stage.innerHTML = `<img src="${curEl.src}" alt="">`;
      $('#btnNextF').textContent = last ? t('close') : t('next');
      $('#btnNextF').classList.remove('hidden');
      if (curEl.audioSrc) {
        aud.src = curEl.audioSrc; aud.currentTime = 0;
        aud.play().catch(() => {});
        $('#btnSound').classList.remove('hidden');
        soundLabel();
      }
    }
  }

  // iPhone/Safari reproduce .mov con transparencia; Chrome/Android usan .webm
  function pickSrc(el) {
    const apple = /iP(hone|ad|od)/.test(navigator.userAgent) || /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const mov = [el.src, el.srcAlt].find((u) => /\.mov$/i.test(u || ''));
    const webm = [el.src, el.srcAlt].find((u) => /\.webm$/i.test(u || ''));
    const other = [el.src, el.srcAlt].find((u) => u && !/\.(mov|webm)$/i.test(u));
    return (apple ? mov || webm : webm || mov) || other || el.src || el.srcAlt;
  }

  function showText(last) {
    const x = getText();
    if (!x.title && !x.body) return next();
    $('#textTitle').textContent = x.title;
    $('#textBody').textContent = x.body;
    $('#btnNextP').textContent = t('next');
    $('#btnNextP').classList.toggle('hidden', last);
    $('#textPanel').classList.remove('hidden');
    const b = $('#textBody');
    $('#btnMore').classList.toggle('hidden', !(b.scrollHeight > b.clientHeight + 1));
  }

  function resetExp() {
    stopAudio(); vid.pause(); vid.onended = null; started = false; idx = -1;
    hide(['#textPanel', '#stage', '#btnNextF', '#modal']);
    $('#stage').innerHTML = '';
    $('#silhouette').classList.remove('hidden');
  }

  function closeAR() {
    stopAudio(); vid.pause(); vid.onended = null;
    const scene = document.querySelector('a-scene');
    try { scene.systems['mindar-image-system'].stop(); } catch (e) {}
    $('#sceneHolder').innerHTML = '';
    $('#stage').innerHTML = '';
    show('screenEnd');
  }

  $('#btnSound').onclick = () => { if (aud.paused) aud.play().catch(() => {}); else aud.pause(); soundLabel(); };
  $('#btnNextP').onclick = next;
  $('#btnNextF').onclick = next;
  init();
})();
