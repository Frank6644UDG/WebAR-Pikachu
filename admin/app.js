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
    const tx = (exp && exp.texts) || {};
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

  // 4 a 7: experiencia de RA
  function startAR() {
    show('screenAR');
    $('#silImg').src = exp.silhouetteSrc || '';
    $('#silImg').style.display = exp.silhouetteSrc ? '' : 'none';
    $('#silhouette').classList.remove('hidden');
    $('#textPanel').classList.add('hidden');
    $('#modal').classList.add('hidden');
    $('#loading').classList.remove('hidden');
    $('#loading').textContent = t('loading');

    const holder = $('#sceneHolder');
    holder.innerHTML = `
      <a-scene mindar-image="imageTargetSrc: ${exp.targetSrc}; uiLoading: no; uiScanning: no; uiError: no; missTolerance: 5; warmupTolerance: 3"
               color-space="sRGB" renderer="colorManagement: true, physicallyCorrectLights"
               vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" embedded>
        <a-assets>
          <video id="vid" src="${exp.videoSrc || ''}" preload="auto" playsinline webkit-playsinline crossorigin="anonymous"></video>
        </a-assets>
        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
        <a-entity id="target" mindar-image-target="targetIndex: 0">
          <a-video id="vplane" src="#vid" width="${exp.videoScale || 1}" height="${(exp.videoScale || 1) * 0.5625}"
                   position="${exp.offsetX || 0} ${exp.offsetY || 0} 0.01"></a-video>
        </a-entity>
      </a-scene>`;

    const scene = holder.querySelector('a-scene');
    const video = holder.querySelector('#vid');
    const target = holder.querySelector('#target');
    const vplane = holder.querySelector('#vplane');
    let started = false, lost = true;

    // "Desbloquea" el video con el toque del usuario (necesario en iPhone)
    video.play().then(() => video.pause()).catch(() => {});
    video.addEventListener('loadedmetadata', () => {
      const s = exp.videoScale || 1;
      vplane.setAttribute('width', s);
      vplane.setAttribute('height', s * (video.videoHeight / video.videoWidth));
    });
    video.addEventListener('ended', showText);
    scene.addEventListener('arReady', () => $('#loading').classList.add('hidden'));
    scene.addEventListener('arError', () => { $('#loading').textContent = t('notReady'); });

    target.addEventListener('targetFound', () => {
      lost = false;
      $('#silhouette').classList.add('hidden');
      if (!started) {
        started = true;
        if (exp.videoSrc) {
          video.currentTime = 0;
          video.muted = false;
          video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
        } else showText();
      } else if (video.paused && !video.ended) video.play().catch(() => {});
    });

    target.addEventListener('targetLost', () => {
      lost = true;
      if (!sticky) {
        // no sticky: la experiencia desaparece y se reinicia
        video.pause(); video.currentTime = 0; started = false;
        $('#textPanel').classList.add('hidden');
        $('#silhouette').classList.remove('hidden');
      }
    });

    // sticky: mantiene el contenido en su última posición
    cancelAnimationFrame(raf);
    const keep = () => {
      if (sticky && started && lost && target.object3D) target.object3D.visible = true;
      raf = requestAnimationFrame(keep);
    };
    keep();
  }

  // 6: texto con "leer más" si no cabe
  function showText() {
    const x = getText();
    if (!x.title && !x.body) return;
    $('#textTitle').textContent = x.title;
    $('#textBody').textContent = x.body;
    $('#textPanel').classList.remove('hidden');
    const b = $('#textBody');
    $('#btnMore').classList.toggle('hidden', !(b.scrollHeight > b.clientHeight + 1));
  }

  // 7: cerrar
  function closeAR() {
    cancelAnimationFrame(raf);
    const scene = document.querySelector('a-scene');
    try { scene.systems['mindar-image-system'].stop(); } catch (e) {}
    $('#sceneHolder').innerHTML = '';
    show('screenEnd');
  }

  init();
})();
