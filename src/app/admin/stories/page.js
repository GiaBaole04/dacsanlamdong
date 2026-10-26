"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { StoryCover } from "@/components/Landscape";
import { useAuth } from "@/hooks/useAuth";
import { formatStoryDate } from "@/lib/storyFormat";

import { friendlyError } from "@/lib/friendlyError";
export default function AdminStoriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [stories, setStories] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const [toggling, setToggling] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/admin/stories", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không tải được danh sách bài viết.");
      setStories(json.stories);
    } catch (err) {
      setError(friendlyError(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () =>
      (stories || []).filter((s) => filter === "all" || (filter === "published" ? s.isPublished : !s.isPublished)),
    [stories, filter]
  );

  const draftCount = (stories || []).filter((s) => !s.isPublished).length;

  async function togglePublish(story) {
    setToggling(story.id);
    setNotice("");

    try {
      const res = await fetch(`/api/admin/stories/${story.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !story.isPublished }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không cập nhật được bài viết.");
      await load();
    } catch (err) {
      setNotice(friendlyError(err));
    } finally {
      setToggling(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/admin/stories/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không xóa được bài viết.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setDeleteError(friendlyError(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#344723]">Câu chuyện đặc sản</h1>
          <p className="mt-1 text-sm text-[#8c8d7d]">Viết bài giới thiệu nguồn gốc và câu chuyện của từng vùng đất.</p>
        </div>
        <Link href="/admin/stories/new" className="bg-[#344723] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#263719]">
          Viết bài mới
        </Link>
      </div>

      <div className="mt-6 flex gap-1 border-b border-[#e4dfd2]" role="tablist">
        {[
          ["all", "Tất cả"],
          ["published", "Đã đăng"],
          ["draft", "Bản nháp"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              filter === key ? "border-[#344723] text-[#344723]" : "border-transparent text-[#8c8d7d] hover:text-[#344723]"
            }`}
          >
            {label}
            {key === "draft" && draftCount > 0 && <span className="ml-1.5 bg-[#fbf1d9] px-1.5 text-xs text-[#8a6a1a]">{draftCount}</span>}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]">{error}</p>}
      {notice && (
        <p className="mt-6 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]" role="alert">
          {notice}
        </p>
      )}

      <div className="mt-4 overflow-x-auto border border-[#e4dfd2] bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-[#faf8f1] text-left text-xs uppercase tracking-[0.08em] text-[#8c8d7d]">
            <tr>
              <th className="px-4 py-3 font-medium">Bài viết</th>
              <th className="px-4 py-3 font-medium">Vùng</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Cập nhật</th>
              <th className="px-4 py-3 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#efe9da]">
            {!stories ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#8c8d7d]">Đang tải…</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#8c8d7d]">Chưa có bài viết nào.</td>
              </tr>
            ) : (
              visible.map((s) => (
                <tr key={s.id} className={s.isPublished ? "" : "bg-[#faf8f1]"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <StoryCover region={s.region} coverUrl={s.coverUrl} alt="" className="h-12 w-16 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[#344723]">{s.title}</div>
                        <div className="truncate text-xs text-[#a3a58f]">/stories/{s.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6f715f]">{s.region || "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => togglePublish(s)}
                      disabled={toggling === s.id}
                      aria-label={`${s.isPublished ? "Chuyển về bản nháp" : "Đăng bài"}: ${s.title}`}
                      className={`px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                        s.isPublished ? "bg-[#e3eedc] text-[#3b6a2a] hover:bg-[#d3e4c8]" : "bg-[#fbf1d9] text-[#8a6a1a] hover:bg-[#f5e6bd]"
                      }`}
                    >
                      {s.isPublished ? "Đã đăng" : "Bản nháp"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8c8d7d]">{formatStoryDate(s.updatedAt || s.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {s.isPublished && (
                      <a href={`/stories/${s.slug}`} target="_blank" rel="noopener noreferrer" className="mr-4 font-medium text-[#53633c] hover:text-[#344723]">
                        Xem
                      </a>
                    )}
                    <Link href={`/admin/stories/${s.id}`} className="font-semibold text-[#344723] hover:text-[#8c7040]">
                      Sửa
                    </Link>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setDeleteTarget(s);
                        }}
                        aria-label={`Xóa ${s.title}`}
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
        title="Xóa bài viết?"
        confirmLabel="Xóa bài viết"
        tone="danger"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        <p>
          Xóa vĩnh viễn bài <strong>{deleteTarget?.title}</strong>? Không thể hoàn tác.
        </p>
        <p>Nếu chỉ muốn tạm ngừng hiển thị, hãy chuyển bài về bản nháp.</p>
      </ConfirmDialog>
    </div>
  );
}