// Bộ tranh phong cảnh Lâm Đồng vẽ bằng SVG: cao nguyên (núi + rừng thông), biển, rừng đất đỏ.
// Không dùng ảnh ngoài, nhẹ và sắc nét ở mọi kích thước. Mọi hình đều được sinh cố định (không ngẫu nhiên
// theo lần tải) nên máy chủ và trình duyệt vẽ giống hệt nhau.

import { regionTheme } from "@/lib/storyFormat";

/* =========================
   HÀM VẼ
========================= */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Number(n).toFixed(1);

// Dải núi / đồi lượn mềm
function ridge(seed, baseY, amp, { step = 110, W = 1440, H = 640, smooth = 1 } = {}) {
  const r = rng(seed);
  const pts = [];
  for (let x = -step; x <= W + step * 2.2; x += step) {
    pts.push([x, baseY - amp * (0.2 + 0.8 * r() ** smooth)]);
  }
  let d = `M${f(pts[0][0])},${H} L${f(pts[0][0])},${f(pts[0][1])}`;
  let lastX = pts[0][0];
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${f(pts[i][0])},${f(pts[i][1])} ${f(mx)},${f(my)}`;
    lastX = mx;
  }
  d += ` L${f(lastX)},${H} Z`;
  return d;
}

// Cây thông nhiều tầng
function pine(x, y, h, w) {
  const p = (dx, dy) => `${f(x + dx * w)},${f(y - dy * h)}`;
  return (
    `M${p(0, 1)} L${p(0.5, 0.64)} L${p(0.26, 0.64)} L${p(0.62, 0.32)} L${p(0.3, 0.32)} ` +
    `L${p(0.78, 0.04)} L${p(0.06, 0.04)} L${p(0.06, 0)} L${p(-0.06, 0)} L${p(-0.06, 0.04)} ` +
    `L${p(-0.78, 0.04)} L${p(-0.3, 0.32)} L${p(-0.62, 0.32)} L${p(-0.26, 0.64)} L${p(-0.5, 0.64)} Z`
  );
}

function pineRow(seed, baseY, count, hMin, hMax, { x0 = -40, x1 = 1480, jitter = 26, fill, opacity = 1 }) {
  const r = rng(seed);
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = x0 + ((x1 - x0) * (i + r() * 0.8)) / count;
    const h = hMin + (hMax - hMin) * r() ** 1.5;
    d += pine(x, baseY + (r() - 0.5) * jitter, h, h * (0.2 + r() * 0.06)) + " ";
  }
  return `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`;
}

// Tán rừng: nhiều hình tròn chồng nhau tạo đường viền cây rậm
function canopy(seed, baseY, count, rMin, rMax, fill, opacity = 1) {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = -30 + (1500 * (i + r() * 0.9)) / count;
    const rad = rMin + (rMax - rMin) * r();
    out += `<circle cx="${f(x)}" cy="${f(baseY + (r() - 0.5) * 22)}" r="${f(rad)}"/>`;
  }
  return `<g fill="${fill}" opacity="${opacity}">${out}<rect x="-40" y="${f(baseY)}" width="1520" height="700"/></g>`;
}

// Đường sóng ngang
function wave(y, amp, len, phase, W = 1440) {
  let d = `M-20,${f(y)}`;
  for (let x = -20; x <= W + len; x += len) {
    d += ` q${f(len / 4)},${f(-amp)} ${f(len / 2)},0 t${f(len / 2)},0`;
  }
  return d.replace(/ q/, ` q`) + (phase ? "" : "");
}

// Trụ thanh long
function dragonPost(x, y, h) {
  const top = y - h;
  let crown = "";
  let fruit = "";
  for (let i = -2; i <= 2; i++) {
    const ex = x + i * 15;
    const ey = top + 10 + Math.abs(i) * 6;
    crown += `M${f(x)},${f(top)} q${f(i * 9)},${f(-14 + Math.abs(i) * 4)} ${f(i * 15)},${f(10 + Math.abs(i) * 6)} `;
    if (i !== 0) fruit += `<circle cx="${f(ex)}" cy="${f(ey + 4)}" r="4.2" fill="#d9376a" stroke="none"/>`;
  }
  return `<path d="M${f(x)},${f(y)} L${f(x)},${f(top)}" stroke-width="3.2"/><path d="${crown}" stroke-width="3" fill="none"/>${fruit}`;
}

/* =========================
   BA CẢNH
========================= */

function highland() {
  return `
<defs>
  <linearGradient id="hl-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0c2b25"/><stop offset="0.38" stop-color="#2d5d49"/>
    <stop offset="0.66" stop-color="#9eb277"/><stop offset="0.86" stop-color="#e3c27a"/><stop offset="1" stop-color="#f0d596"/>
  </linearGradient>
  <radialGradient id="hl-sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff1c2" stop-opacity="0.95"/><stop offset="0.35" stop-color="#f6d888" stop-opacity="0.45"/><stop offset="1" stop-color="#f6d888" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="hl-mist" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#eef3dd" stop-opacity="0"/><stop offset="0.5" stop-color="#eef3dd" stop-opacity="0.42"/><stop offset="1" stop-color="#eef3dd" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="hl-ground" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1c3b26"/><stop offset="1" stop-color="#0b1d12"/>
  </linearGradient>
</defs>
<rect width="1440" height="640" fill="url(#hl-sky)"/>
<circle cx="1010" cy="318" r="300" fill="url(#hl-sun)"/>
<circle cx="1010" cy="318" r="40" fill="#fff3cf" opacity="0.92"/>
<path d="${ridge(11, 392, 170, { step: 150, smooth: 0.8 })}" fill="#7da07c" opacity="0.55"/>
<rect x="0" y="318" width="1440" height="110" fill="url(#hl-mist)"/>
<path d="${ridge(23, 452, 150, { step: 120 })}" fill="#4f7f58" opacity="0.9"/>
${pineRow(5, 452, 60, 36, 74, { fill: "#3c6a48", opacity: 0.85 })}
<rect x="0" y="392" width="1440" height="110" fill="url(#hl-mist)" opacity="0.8"/>
<path d="${ridge(37, 520, 120, { step: 100 })}" fill="#2f5a3b"/>
${pineRow(9, 508, 74, 58, 118, { fill: "#234a2e" })}
<path d="${ridge(51, 590, 70, { step: 90 })}" fill="#173823"/>
${pineRow(13, 600, 40, 110, 230, { fill: "#102a1a", x0: -60, x1: 1500 })}
<rect x="0" y="600" width="1440" height="60" fill="url(#hl-ground)"/>`;
}

function sea() {
  let waves = "";
  for (let i = 0; i < 9; i++) {
    const y = 392 + i * 26 + i * i * 1.4;
    waves += `<path d="${wave(y, 4 + i * 1.6, 70 + i * 22)}" fill="none" stroke="#ffffff" stroke-width="${f(1.1 + i * 0.25)}" opacity="${f(0.1 + i * 0.022)}"/>`;
  }
  let glint = "";
  const r = rng(77);
  for (let i = 0; i < 16; i++) {
    const y = 372 + i * 17;
    const w = 16 + i * 8 + r() * 14;
    glint += `<rect x="${f(1010 - w / 2 + (r() - 0.5) * 16)}" y="${f(y)}" width="${f(w)}" height="3" rx="1.5"/>`;
  }
  let posts = "";
  const pr = rng(31);
  for (let i = 0; i < 9; i++) {
    posts += dragonPost(940 + i * 58 + pr() * 14, 628 - (i % 3) * 5, 62 + pr() * 22);
  }
  return `
<defs>
  <linearGradient id="sea-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0b2a3a"/><stop offset="0.35" stop-color="#2c6270"/>
    <stop offset="0.52" stop-color="#d9a36a"/><stop offset="0.6" stop-color="#f4c57c"/><stop offset="1" stop-color="#f4c57c"/>
  </linearGradient>
  <radialGradient id="sea-sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff0c4" stop-opacity="0.95"/><stop offset="0.4" stop-color="#ffd58a" stop-opacity="0.4"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="sea-water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e0a574"/><stop offset="0.12" stop-color="#4f8590"/><stop offset="0.55" stop-color="#215b6b"/><stop offset="1" stop-color="#0e3646"/>
  </linearGradient>
  <linearGradient id="sea-sand" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d8a25e"/><stop offset="1" stop-color="#8f5a2c"/>
  </linearGradient>
</defs>
<rect width="1440" height="640" fill="url(#sea-sky)"/>
<circle cx="1010" cy="352" r="280" fill="url(#sea-sun)"/>
<circle cx="1010" cy="352" r="54" fill="#fff0c8" opacity="0.95"/>
<path d="M-20,372 C60,340 150,318 250,334 C330,346 400,366 470,372 L470,380 L-20,380 Z" fill="#1d4a55" opacity="0.85"/>
<path d="M1240,374 C1300,352 1370,340 1470,350 L1470,380 L1240,380 Z" fill="#1d4a55" opacity="0.7"/>
<rect x="0" y="372" width="1440" height="268" fill="url(#sea-water)"/>
${waves}
<g fill="#ffe3a6" opacity="0.5">${glint}</g>
<g fill="#10303a"><path d="M690,388 L740,388 Q735,398 725,398 L705,398 Q695,398 690,388 Z"/><path d="M716,388 L716,356 L742,384 Z" opacity="0.9"/><path d="M712,388 L712,362 L696,384 Z" opacity="0.75"/></g>
<path d="M-20,640 L-20,566 C120,540 300,560 460,600 C560,624 620,632 700,640 Z" fill="#4c2f1e" opacity="0.95"/>
<path d="M600,640 C760,598 940,560 1160,566 C1300,570 1400,590 1480,606 L1480,640 Z" fill="url(#sea-sand)"/>
<g fill="none" stroke="#2a1a10" stroke-linecap="round" opacity="0.9">${posts}</g>`;
}

function forest() {
  let rows = "";
  for (let i = 0; i < 7; i++) {
    rows += `<path d="M-20,${f(520 + i * 17)} C300,${f(498 + i * 17)} 700,${f(560 + i * 15)} 1500,${f(515 + i * 17)}" fill="none" stroke="#2c140c" stroke-width="${f(1.4 + i * 0.3)}" opacity="${f(0.22 + i * 0.03)}"/>`;
  }
  const tree = (x, y, h, s) =>
    `<path d="M${x},${y} L${x},${y - h}" stroke="#0e2316" stroke-width="${s}" stroke-linecap="round"/>` +
    `<ellipse cx="${x}" cy="${y - h - s * 3}" rx="${s * 9}" ry="${s * 3.4}" fill="#0e2316"/>` +
    `<ellipse cx="${x - s * 4}" cy="${y - h - s * 1}" rx="${s * 5}" ry="${s * 2.2}" fill="#0e2316"/>` +
    `<ellipse cx="${x + s * 5}" cy="${y - h}" rx="${s * 5}" ry="${s * 2}" fill="#0e2316"/>`;
  return `
<defs>
  <linearGradient id="fr-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#103230"/><stop offset="0.3" stop-color="#2f5a47"/>
    <stop offset="0.52" stop-color="#c98a4e"/><stop offset="0.78" stop-color="#f0b866"/><stop offset="1" stop-color="#f6cf86"/>
  </linearGradient>
  <radialGradient id="fr-sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffe3a6" stop-opacity="0.9"/><stop offset="0.4" stop-color="#ffb866" stop-opacity="0.4"/><stop offset="1" stop-color="#ffb866" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="fr-mist" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffe9c4" stop-opacity="0"/><stop offset="0.55" stop-color="#ffe9c4" stop-opacity="0.38"/><stop offset="1" stop-color="#ffe9c4" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="fr-soil" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8a3d23"/><stop offset="1" stop-color="#4a2013"/>
  </linearGradient>
</defs>
<rect width="1440" height="640" fill="url(#fr-sky)"/>
<circle cx="420" cy="350" r="290" fill="url(#fr-sun)"/>
<circle cx="420" cy="350" r="46" fill="#ffeab8" opacity="0.92"/>
<path d="${ridge(61, 410, 130, { step: 140, smooth: 0.9 })}" fill="#a2573a" opacity="0.6"/>
<rect x="0" y="330" width="1440" height="110" fill="url(#fr-mist)"/>
${canopy(7, 430, 46, 22, 42, "#496b3f", 0.8)}
<path d="${ridge(73, 488, 110, { step: 130 })}" fill="#8a4128" opacity="0.95"/>
${canopy(17, 486, 52, 24, 48, "#2f5434", 0.95)}
<rect x="0" y="420" width="1440" height="110" fill="url(#fr-mist)" opacity="0.7"/>
<path d="${ridge(89, 552, 80, { step: 120 })}" fill="url(#fr-soil)"/>
${rows}
${canopy(29, 594, 40, 30, 56, "#14301c", 1)}
${tree(1180, 600, 190, 5)}${tree(1330, 610, 140, 4)}${tree(110, 612, 215, 6)}${tree(250, 618, 120, 3.6)}`;
}

const SCENES = { highland: highland(), sea: sea(), forest: forest() };

/* =========================
   THÀNH PHẦN GIAO DIỆN
========================= */

// Tranh phong cảnh phủ kín khung chứa (cha cần position: relative + overflow hidden)
export function LandscapeScene({ theme = "highland", className = "" }) {
  return (
    <svg
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMax slice"
      className={`absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: SCENES[theme] || SCENES.highland }}
    />
  );
}

// Ảnh bìa bài viết: ảnh tải lên nếu có, nếu không thì tranh phong cảnh theo vùng
export function StoryCover({ region, coverUrl, alt = "", className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-[#1c3b26] ${className}`}>
      {coverUrl ? (
        <img src={coverUrl} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <LandscapeScene theme={regionTheme(region)} />
      )}
    </div>
  );
}

// Dải núi chuyển tiếp giữa 2 khối nội dung (đặt ở đáy khối phía trên, fill = màu của khối phía dưới)
export function RidgeDivider({ fill = "#f8f5ec", className = "" }) {
  return (
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className={`block h-[60px] w-full md:h-[96px] ${className}`} aria-hidden="true" focusable="false">
      <path d={ridge(404, 120, 78, { step: 130, W: 1440, H: 120 })} fill={fill} />
    </svg>
  );
}

// Dải sóng chuyển tiếp
export function WaveDivider({ fill = "#f8f5ec", className = "" }) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className={`block h-[44px] w-full md:h-[72px] ${className}`} aria-hidden="true" focusable="false">
      <path d="M0,50 C180,10 320,86 520,48 C720,8 860,84 1060,46 C1230,14 1340,60 1440,36 L1440,90 L0,90 Z" fill={fill} />
    </svg>
  );
}

// Biểu tượng nhỏ cho từng kiểu vùng
export function ThemeIcon({ theme = "highland", className = "h-4 w-4" }) {
  if (theme === "sea") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
        <path d="M2 9c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4.4-2 6.8 0" />
        <path d="M2 14c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4.4-2 6.8 0" />
        <path d="M2 19c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4.4-2 6.8 0" />
      </svg>
    );
  }
  if (theme === "forest") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21v-6" />
        <path d="M12 15c-4.2 0-6-2.6-6-5.2C6 6.8 8.6 4 12 3c3.4 1 6 3.8 6 6.8 0 2.6-1.8 5.2-6 5.2Z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 19 9 7l4 7 2.5-4 6 9H2.5Z" />
      <path d="m7 11.5 2 1.5 2-2" />
    </svg>
  );
}

// Họa tiết đường đồng mức (như bản đồ địa hình) làm nền trang trí nhẹ
export function ContourPattern({ className = "", stroke = "#b08b43", opacity = 0.16 }) {
  const rings = [];
  for (let k = 1; k <= 11; k++) {
    let d = "";
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      const wob = 1 + 0.09 * Math.sin(3 * t + k * 0.35) + 0.05 * Math.sin(5 * t - k * 0.6) + 0.03 * Math.sin(8 * t + k);
      const x = 360 + Math.cos(t) * k * 30 * wob * 1.35;
      const y = 260 + Math.sin(t) * k * 21 * wob;
      d += `${i === 0 ? "M" : "L"}${f(x)},${f(y)} `;
    }
    rings.push(<path key={k} d={`${d}Z`} />);
  }
  return (
    <svg viewBox="0 0 720 520" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke={stroke} strokeWidth="1.1" opacity={opacity}>{rings}</g>
    </svg>
  );
}