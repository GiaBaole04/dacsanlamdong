"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/orderUtils";

// Bỏ dấu tiếng Việt để gõ "ca phe" vẫn tìm ra "Cà phê"
function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export default function AdminProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [visibility, setVisibility] = useState("all");

  const [toggling, setToggling] = useState(null);
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không tải được danh sách sản phẩm.");
      setData(json);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const products = useMemo(() => {
    if (!data) return [];
    const keyword = normalizeText(search.trim());

    return data.products.filter((p) => {
      if (categoryId !== "all" && String(p.categoryId) !== categoryId) return false;
      if (visibility === "active" && !p.isActive) return false;
      if (visibility === "hidden" && p.isActive) return false;
      if (keyword && !normalizeText(`${p.name} ${p.region || ""} ${p.category}`).includes(keyword)) return false;
      return true;
    });
  }, [data, search, categoryId, visibility]);

  async function toggleVisibility(product) {
    setToggling(product.id);
    setNotice("");

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không cập nhật được sản phẩm.");
      await load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setToggling(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không xóa được sản phẩm.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold text-[#344723]">Sản phẩm</h1>
        <Link
          href="/admin/products/new"
          className="bg-[#344723] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#263719]"
        >
          Thêm sản phẩm
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, khu vực, danh mục…"
          aria-label="Tìm sản phẩm"
          className="h-11 w-full max-w-[360px] border border-[#d9d1bf] bg-white px-4 text-sm outline-none focus:border-[#344723]"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label="Lọc theo danh mục"
          className="h-11 border border-[#d9d1bf] bg-white px-3 text-sm outline-none focus:border-[#344723]"
        >
          <option value="all">Mọi danh mục</option>
          {data?.categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          aria-label="Lọc theo hiển thị"
          className="h-11 border border-[#d9d1bf] bg-white px-3 text-sm outline-none focus:border-[#344723]"
        >
          <option value="all">Tất cả</option>
          <option value="active">Đang bán</option>
          <option value="hidden">Đang ẩn</option>
        </select>
      </div>

      {error && <p className="mt-6 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]">{error}</p>}
      {notice && <p className="mt-6 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]" role="alert">{notice}</p>}

      <div className="mt-4 overflow-x-auto border border-[#e4dfd2] bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-[#faf8f1] text-left text-xs uppercase tracking-[0.08em] text-[#8c8d7d]">
            <tr>
              <th className="px-4 py-3 font-medium">Sản phẩm</th>
              <th className="px-4 py-3 font-medium">Danh mục</th>
              <th className="px-4 py-3 font-medium">Quy cách</th>
              <th className="px-4 py-3 font-medium">Tồn kho</th>
              <th className="px-4 py-3 font-medium">Hiển thị</th>
              <th className="px-4 py-3 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#efe9da]">
            {!data ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#8c8d7d]">Đang tải…</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#8c8d7d]">Không có sản phẩm nào phù hợp.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className={p.isActive ? "" : "bg-[#faf8f1] text-[#8c8d7d]"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden bg-[#eee8da]">
                        {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[#344723]">{p.name}</div>
                        <div className="truncate text-xs text-[#8c8d7d]">{p.region}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3">
                    <div>{p.variants.length} quy cách</div>
                    <div className="text-xs text-[#9b7130]">từ {formatPrice(p.minPrice)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span>{p.totalStock}</span>
                    {p.lowStock && (
                      <span className="ml-2 bg-[#fbf1d9] px-2 py-0.5 text-[11px] font-semibold text-[#8a6a1a]">Sắp hết</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(p)}
                      disabled={toggling === p.id}
                      aria-label={`${p.isActive ? "Ẩn" : "Hiện"} ${p.name}`}
                      className={`px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                        p.isActive ? "bg-[#e3eedc] text-[#3b6a2a] hover:bg-[#d3e4c8]" : "bg-[#e9e3d4] text-[#6f715f] hover:bg-[#ddd6c3]"
                      }`}
                    >
                      {p.isActive ? "Đang bán" : "Đang ẩn"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-[#344723] hover:text-[#8c7040]">
                      Sửa
                    </Link>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setDeleteTarget(p);
                        }}
                        aria-label={`Xóa ${p.name}`}
                        className="ml-4 font-semibold text-[#9a4528] hover:text-[#7e3720]"
                      >
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa sản phẩm?"
        confirmLabel="Xóa sản phẩm"
        tone="danger"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        <p>
          Xóa vĩnh viễn <strong>{deleteTarget?.name}</strong> cùng các quy cách? Không thể hoàn tác.
        </p>
        <p>Sản phẩm đã từng có đơn hàng thì không xóa được, bạn hãy chuyển sang trạng thái ẩn.</p>
      </ConfirmDialog>
    </div>
  );
}