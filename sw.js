/* 부서진 나침반 서비스 워커 — 빌드가 만든 파일 (app/src/pwa/sw.ts). 고치지 말 것 */
const VERSION = "483b52d511da";
const CACHE = "aos-shell-" + VERSION;
const SHELL = ["apple-touch-icon.png","assets/basis_transcoder-VXdx5NbI.wasm","assets/basis_transcoder-o4Hde_L7.js","assets/compare-CzJGAerZ.js","assets/hero3d-BLJQFPUJ.js","assets/index-DI167hnn.css","assets/index-mRS8qX2_.js","assets/그림-Df-wMRcc.js","assets/그림-qXiR9apG.js","assets/바닥색-38Cjm_h1.js","assets/아틀라스-CXmSRQZd.js","assets/주인공빛-Cfvhdo-7.js","assets/주인공층-DULM2DH_.js","assets/커서-Ddb7RZ8E.js","assets/커서-KRXZqr3u.js","assets/효과색-DeCoaH1w.js","icon-192.png","icon-512.png","icon-maskable-192.png","icon-maskable-512.png","icon.ico","index.html","manifest.webmanifest"];
const SHELL_SET = new Set(SHELL);
const scopePath = () => new URL(self.registration.scope).pathname;

self.addEventListener('install', (e) => {
  // 껍데기를 다 받아야 설치됨. 기다리다가 화면이 "다시 불러오기"를 누르면 skip-waiting
  // cache: 'reload' — 브라우저 HTTP 캐시(GitHub Pages 10분)의 옛 index.html 이 새 판 캐시에 들어가지 않게 늘 서버에서
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        c.addAll(SHELL.map((f) => new Request(new URL(f, self.registration.scope).href, { cache: 'reload' }))),
      ),
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
  if (e.data === 'version' && e.source) e.source.postMessage({ version: VERSION });
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("aos-shell-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 다른 주소(에셋 서버 · 글꼴 · 오류 보고)는 손대지 않음
  if (url.origin !== self.location.origin) return;
  const base = scopePath();
  if (!url.pathname.startsWith(base)) return;
  let rel = url.pathname.slice(base.length);
  try {
    rel = decodeURIComponent(rel);
  } catch {
    return;
  }
  // 큰 그림 (오프라인 빌드의 packs/) 은 미리도 · 나중에도 넣지 않음
  if (rel.startsWith('packs/')) return;
  if (req.mode === 'navigate') {
    // 껍데기의 index.html 먼저 (같은 판의 코드와 짝) — 없으면 네트워크
    e.respondWith(
      caches
        .open(CACHE)
        .then((c) => c.match(new URL('index.html', self.registration.scope).href))
        .then((hit) => hit || fetch(req)),
    );
    return;
  }
  if (SHELL_SET.has(rel)) {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req))));
    return;
  }
  if (rel.startsWith('assets/')) {
    // 해시 이름의 작은 파일: 처음 받을 때 넣어 둠 (이미 받은 것만)
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              // 200 만 (Range 요청의 206 조각은 Cache 에 넣을 수 없음)
              if (res.status === 200 && res.type === 'basic') c.put(req, res.clone()).catch(() => {});
              return res;
            }),
        ),
      ),
    );
  }
});
