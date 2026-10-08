"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validateProductInput } from "@/lib/productRules";
import { formatPrice } from "@/lib/orderUtils";

let rowCounter = 0;
const newRow = (data = {}) => ({
  key: `row-${++rowCounter}`,
  id: data.id ?? null,
  name: data.name ?? "",
  price: data.price !== undefined ? String(data.price) : "",
  stock: data.stock !== undefined ? String(data.stock) : "",
});

const toNumber = (text) => (text === "" ? NaN : Number(text));
const inputClass =
  "h-11 w-full border bg-white px-3.5 text-sm outline-none transition placeholder:text-[#a3a58f] focus:border-[#344723]";

function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-[#4d513e]">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-[#a3a58f]">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-[#a04a2e]">{error}</p>}
    </div>
  );
}

export default function ProductForm({ productId }) {
  const router = useRouter();
  const isEdit = Boolean(productId);
  const fileInput = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState([newRow()]);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const listRes = await fetch("/api/admin/products", { cache: "no-store" });
        const listJson = await listRes.json();
        if (!listRes.ok) throw new Error(listJson.error || "Không tải được danh mục.");
        if (!cancelled) setCategories(listJson.categories);

        if (isEdit) {
          const res = await fetch(`/api/admin/products/${productId}`, { cache: "no-store" });

          if (res.status === 404) {
            if (!cancelled) setNotFound(true);
            return;
          }

          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Không tải được sản phẩm.");

          if (!cancelled) {
            const p = json.product;
            setName(p.name);
            setCategoryId(String(p.categoryId));
            setRegion(p.region);
            setDescription(p.description);
            setImageUrl(p.imageUrl);
            setIsActive(p.isActive);
            setVariants(p.variants.map((v) => newRow(v)));
          }
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, productId]);

  function updateRow(key, field, value) {
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    if (file.size > 3 * 1024 * 1024) {
      setUploadError("Ảnh quá lớn, tối đa 3MB.");
      return;
    }

    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không tải được ảnh.");

      setImageUrl(json.url);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    const payload = {
      name,
      categoryId: toNumber(categoryId),
      region,
      description,
      imageUrl,
      isActive,
      variants: variants.map((v) => ({ id: v.id, name: v.name, price: toNumber(v.price), stock: toNumber(v.stock) })),
    };

    const { errors: found } = validateProductInput(payload);
    setErrors(found);

    if (Object.keys(found).length > 0) return;

    setSaving(true);

    try {
      const res = await fetch(isEdit ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.errors) setErrors(json.errors);
        throw new Error(json.error || "Không lưu được sản phẩm.");
      }

      router.push("/admin/products");
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-72 animate-pulse bg-[#e9e3d4]" aria-busy="true" />;
  }

  if (notFound) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-[#344723]">Không tìm thấy sản phẩm</h1>
        <Link href="/admin/products" className="mt-6 inline-block text-sm font-semibold text-[#8c7040] hover:text-[#344723]">
          ← Về danh sách sản phẩm
        </Link>
      </div>
    );
  }

  if (loadError) {
    return <p className="border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]">{loadError}</p>;
  }

  const border = (key) => (errors[key] ? "border-[#d9a08b]" : "border-[#d9d1bf]");

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-[900px]">
      <Link href="/admin/products" className="text-sm font-medium text-[#8c7040] hover:text-[#344723]">
        ← Tất cả sản phẩm
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-[#344723]">
        {isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      </h1>

      <div className="mt-8 space-y-6">
        <section className="border border-[#e4dfd2] bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-[#344723]">Thông tin chung</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Tên sản phẩm" htmlFor="name" error={errors.name}>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} ${border("name")}`} placeholder="Ví dụ: Cà phê Arabica Cầu Đất" />
              </Field>
            </div>

            <Field label="Danh mục" htmlFor="categoryId" error={errors.categoryId}>
              <select id="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputClass} ${border("categoryId")}`}>
                <option value="">Chọn danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Khu vực sản xuất" htmlFor="region" error={errors.region} hint="Ví dụ: Cầu Đất, Lâm Đồng">
              <input id="region" value={region} onChange={(e) => setRegion(e.target.value)} className={`${inputClass} ${border("region")}`} />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Mô tả" htmlFor="description" error={errors.description}>
                <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} h-auto resize-none py-3 ${border("description")}`} />
              </Field>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-[#4d513e]">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[#344723]" />
            Hiển thị sản phẩm trên cửa hàng
          </label>
        </section>

        <section className="border border-[#e4dfd2] bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-[#344723]">Hình ảnh</h2>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <div className="h-28 w-28 flex-shrink-0 overflow-hidden border border-[#e4dfd2] bg-[#eee8da]">
              {imageUrl ? (
                <img src={imageUrl} alt="Ảnh sản phẩm" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#a3a58f]">Chưa có ảnh</div>
              )}
            </div>

            <div>
              <input ref={fileInput} id="image-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" aria-label="Chọn ảnh tải lên" />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="h-11 border border-[#344723] bg-white px-5 text-sm font-semibold text-[#344723] transition hover:bg-[#f3f6ee] disabled:opacity-50"
              >
                {uploading ? "Đang tải lên…" : imageUrl ? "Đổi ảnh" : "Tải ảnh lên"}
              </button>
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl("")} className="ml-3 text-sm font-medium text-[#9a4528] hover:text-[#7e3720]">
                  Xóa ảnh
                </button>
              )}
              <p className="mt-2 text-xs text-[#a3a58f]">JPG, PNG hoặc WEBP, tối đa 3MB.</p>
              {(uploadError || errors.imageUrl) && <p className="mt-1.5 text-xs text-[#a04a2e]">{uploadError || errors.imageUrl}</p>}
            </div>
          </div>
        </section>

        <section className="border border-[#e4dfd2] bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-[#344723]">Quy cách, giá và tồn kho</h2>
          <p className="mt-1 text-xs leading-5 text-[#a3a58f]">
            Quy cách đã có trong đơn hàng không thể xóa. Hãy đặt tồn kho về 0 hoặc ẩn sản phẩm.
          </p>

          <div className="mt-5 space-y-3">
            {variants.map((row, index) => (
              <div key={row.key} className="grid items-start gap-3 sm:grid-cols-[1.2fr_1fr_0.8fr_auto]">
                <input
                  value={row.name}
                  onChange={(e) => updateRow(row.key, "name", e.target.value)}
                  aria-label={`Tên quy cách ${index + 1}`}
                  placeholder="Ví dụ: 250g, 1kg, chai 500ml"
                  className={`${inputClass} border-[#d9d1bf]`}
                />
                <div>
                  <input
                    value={row.price}
                    onChange={(e) => updateRow(row.key, "price", e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    aria-label={`Giá quy cách ${index + 1}`}
                    placeholder="Giá (đồng)"
                    className={`${inputClass} border-[#d9d1bf]`}
                  />
                  {row.price !== "" && <p className="mt-1 text-xs text-[#9b7130]">{formatPrice(row.price)}</p>}
                </div>
                <input
                  value={row.stock}
                  onChange={(e) => updateRow(row.key, "stock", e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  aria-label={`Tồn kho quy cách ${index + 1}`}
                  placeholder="Tồn kho"
                  className={`${inputClass} border-[#d9d1bf]`}
                />
                <button
                  type="button"
                  onClick={() => setVariants((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== row.key) : rows))}
                  disabled={variants.length === 1}
                  aria-label={`Xóa quy cách ${index + 1}`}
                  className="h-11 px-3 text-sm font-semibold text-[#9a4528] transition hover:text-[#7e3720] disabled:opacity-30"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>

          {errors.variants && <p className="mt-3 text-sm text-[#a04a2e]">{errors.variants}</p>}

          <button
            type="button"
            onClick={() => setVariants((rows) => [...rows, newRow()])}
            className="mt-4 text-sm font-semibold text-[#344723] hover:text-[#8c7040]"
          >
            + Thêm quy cách
          </button>
        </section>

        {serverError && (
          <p className="border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]" role="alert">
            {serverError}
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="h-12 bg-[#344723] px-8 text-sm font-semibold text-white transition hover:bg-[#263719] disabled:opacity-60">
            {saving ? "Đang lưu…" : "Lưu sản phẩm"}
          </button>
          <Link href="/admin/products" className="flex h-12 items-center border border-[#d9d1bf] bg-white px-6 text-sm font-semibold text-[#4d513e] transition hover:border-[#344723]">
            Hủy
          </Link>
        </div>
      </div>
    </form>
  );
}