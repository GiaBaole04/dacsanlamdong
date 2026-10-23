/**
 * GỢI Ý SẢN PHẨM TƯƠNG TỰ (content-based filtering)
 *
 * Với một sản phẩm đang xem, tính "độ giống" với từng sản phẩm còn lại rồi lấy các sản phẩm giống nhất.
 * Độ giống là tổng có trọng số của 4 thành phần, mỗi thành phần nằm trong khoảng 0..1:
 *
 *   score = 0.45 * text + 0.25 * category + 0.15 * region + 0.15 * price
 *
 *  1. text     : độ giống về nội dung chữ (tên, mô tả, danh mục, vùng) bằng TF-IDF + cosine similarity.
 *  2. category : 1 nếu cùng danh mục, ngược lại 0.
 *  3. region   : 1 nếu cùng địa danh (vd cùng "Cầu Đất"), 0.5 nếu cùng vùng tỉnh cũ
 *                (Lâm Đồng / Đắk Nông / Bình Thuận cũ), ngược lại 0.
 *  4. price    : càng gần mức giá khởi điểm càng cao, lệch 4 lần trở lên thì bằng 0.
 *
 * Không cần thư viện ngoài, không cần dữ liệu đơn hàng, chạy ngay trên danh sách sản phẩm đã tải.
 */

export const SIMILARITY_WEIGHTS = {
  text: 0.45,
  category: 0.25,
  region: 0.15,
  price: 0.15,
};

// Các từ quá phổ biến, không giúp phân biệt sản phẩm
const STOPWORDS = new Set([
  'và', 'của', 'là', 'có', 'cho', 'các', 'những', 'một', 'được', 'với', 'trong', 'từ', 'này',
  'để', 'khi', 'đã', 'rất', 'như', 'hay', 'cũng', 'nên', 'theo', 'đến', 'tại', 'bởi', 'mà',
  'nhưng', 'hoặc', 'không', 'rồi', 'thì', 'ở', 'tiện', 'dùng', 'hằng', 'ngày',
]);

// Ba tỉnh cũ đã hợp nhất thành tỉnh Lâm Đồng (dùng để chấm điểm "cùng vùng")
const PROVINCE_RULES = [
  {
    key: 'dak-nong',
    places: ['gia nghĩa', 'đắk song', 'đắk mil', 'đắk r', 'cư jút', 'krông nô', 'tuy đức'],
  },
  {
    key: 'binh-thuan',
    places: ['phan thiết', 'hàm thuận', 'mũi né', 'hàm tân', 'la gi', 'tuy phong', 'bắc bình', 'phú quý', 'đức linh', 'tánh linh'],
  },
  {
    key: 'lam-dong',
    places: ['đà lạt', 'cầu đất', 'bảo lộc', 'lạc dương', 'đơn dương', 'đức trọng', 'di linh', 'lâm hà', 'bảo lâm', 'đạ huoai'],
  },
];

/* =========================
   BƯỚC 1: TF-IDF
========================= */

function normalize(text) {
  return String(text || '').normalize('NFC').toLowerCase();
}

/**
 * Tách chữ thành "từ". Tiếng Việt viết cách nhau từng âm tiết nên ngoài từng âm tiết còn lấy thêm
 * cặp hai âm tiết liền nhau (vd "cà phê", "hạt điều") để giữ được các từ ghép.
 */
export function tokenize(text) {
  const raw = normalize(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  const isWord = (w) => w.length > 1 && !/\d/.test(w) && !STOPWORDS.has(w);

  const tokens = [];
  for (let i = 0; i < raw.length; i++) {
    if (isWord(raw[i])) tokens.push(raw[i]);
    if (i + 1 < raw.length && isWord(raw[i]) && isWord(raw[i + 1])) {
      tokens.push(`${raw[i]} ${raw[i + 1]}`);
    }
  }
  return tokens;
}

function productText(product) {
  // Tên và danh mục được lặp 2 lần để có trọng số cao hơn phần mô tả
  return [
    product.name,
    product.name,
    product.category,
    product.category,
    product.description,
    product.region,
  ].join(' ');
}

/** Tạo vector TF-IDF (đã chuẩn hóa độ dài về 1) cho từng sản phẩm. */
export function buildVectors(products) {
  const docs = products.map((p) => ({ id: String(p.id), tokens: tokenize(productText(p)) }));
  const total = docs.length;

  // df: số sản phẩm có chứa từ đó
  const df = new Map();
  for (const doc of docs) {
    for (const term of new Set(doc.tokens)) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  const vectors = new Map();
  for (const doc of docs) {
    const counts = new Map();
    for (const term of doc.tokens) counts.set(term, (counts.get(term) || 0) + 1);

    const vector = new Map();
    let norm = 0;
    for (const [term, count] of counts) {
      const tf = 1 + Math.log(count); // tf dạng log để từ lặp nhiều không lấn át
      const idf = Math.log((total + 1) / ((df.get(term) || 0) + 1)) + 1; // idf có làm mượt
      const weight = tf * idf;
      vector.set(term, weight);
      norm += weight * weight;
    }

    norm = Math.sqrt(norm) || 1;
    for (const [term, weight] of vector) vector.set(term, weight / norm);
    vectors.set(doc.id, vector);
  }

  return vectors;
}

/** Cosine similarity của hai vector đã chuẩn hóa = tích vô hướng. */
export function cosine(a, b) {
  if (!a || !b) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, weight] of small) {
    const other = large.get(term);
    if (other) dot += weight * other;
  }
  return dot;
}

/* =========================
   BƯỚC 2: DANH MỤC, VÙNG, GIÁ
========================= */

function startingPrice(product) {
  const prices = (product?.variants || [])
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length ? Math.min(...prices) : null;
}

function priceSimilarity(a, b) {
  const pa = startingPrice(a);
  const pb = startingPrice(b);
  if (!pa || !pb) return 0.5; // thiếu giá thì chấm trung tính
  const ratio = Math.abs(Math.log(pa / pb));
  return Math.max(0, 1 - ratio / Math.log(4));
}

function placeOf(region) {
  return normalize(region).split(',')[0].trim();
}

function provinceOf(region) {
  const text = normalize(region);
  const rule = PROVINCE_RULES.find((r) => r.places.some((place) => text.includes(place)));
  return rule ? rule.key : null;
}

function regionSimilarity(a, b) {
  const placeA = placeOf(a.region);
  const placeB = placeOf(b.region);
  if (placeA && placeA === placeB) return 1;

  const provinceA = provinceOf(a.region);
  if (provinceA && provinceA === provinceOf(b.region)) return 0.5;
  return 0;
}

/* =========================
   BƯỚC 3: TỔNG HỢP VÀ XẾP HẠNG
========================= */

/**
 * Trả về tối đa `limit` sản phẩm giống `target` nhất:
 * [{ product, score (0..1), reasons: ['Cùng danh mục', ...] }]
 */
export function getSimilarProducts(target, products, limit = 4) {
  if (!target || !Array.isArray(products)) return [];

  // Dùng toàn bộ sản phẩm (kể cả sản phẩm đang xem) để tính idf cho ổn định
  const vectors = buildVectors(products);
  const targetVector = vectors.get(String(target.id));

  const results = products
    .filter((p) => String(p.id) !== String(target.id))
    .map((p) => {
      const text = cosine(targetVector, vectors.get(String(p.id)));
      const category = p.category && p.category === target.category ? 1 : 0;
      const region = regionSimilarity(target, p);
      const price = priceSimilarity(target, p);

      const score =
        SIMILARITY_WEIGHTS.text * text +
        SIMILARITY_WEIGHTS.category * category +
        SIMILARITY_WEIGHTS.region * region +
        SIMILARITY_WEIGHTS.price * price;

      // Lý do hiển thị cho người dùng thấy vì sao sản phẩm này được gợi ý
      const reasons = [];
      if (category === 1) reasons.push('Cùng danh mục');
      if (region === 1) reasons.push('Cùng vùng');
      else if (region === 0.5) reasons.push('Cùng vùng tỉnh cũ');
      if (price >= 0.75) reasons.push('Giá gần nhau');
      if (text >= 0.2) reasons.push('Mô tả giống nhau');

      return { product: p, score, reasons: reasons.slice(0, 3) };
    })
    .sort((x, y) => y.score - x.score || Number(x.product.id) - Number(y.product.id));

  return results.slice(0, limit);
}
