"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StoryContent from "@/components/StoryContent";
import { StoryCover, ThemeIcon } from "@/components/Landscape";
import { THEME_LABEL, readingMinutes, regionTheme } from "@/lib/storyFormat";
import { validateStoryInput } from "@/lib/storyRules";

const inputClass =
  "w-full border bg-white px-3.5 text-sm outline-none transition placeholder:text-[#a3a58f] focus:border-[#344723]";

function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-[#4d513e]">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs leading-5 text-[#a3a58f]">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-[#a04a2e]">{error}</p>}
    </div>
  );
}

export default function StoryForm({ storyId }) {
  const router = useRouter();
  const isEdit = Boolean(storyId);
  const fileInput = useRef(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [regions, setRegions] = useState([]);

  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [tab, setTab] = useState("write");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Danh sách vùng gợi ý lấy từ các sản phẩm đang có
        const listRes = await fetch("/api/admin/products", { cache: "no-store" });
        if (listRes.ok) {
          const listJson = await listRes.json();
          const unique = [...new Set(listJson.products.map((p) => p.region).filter(Boolean))];
          if (!cancelled) setRegions(unique);
        }

        if (isEdit) {
          const res = await fetch(`/api/admin/stories/${storyId}`, { cache: "no-store" });

          if (res.status === 404) {
            if (!cancelled) setNotFound(true);
            return;
          }

          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Không tải được bài viết.");

          if (!cancelled) {
            const s = json.story;
            setTitle(s.title);
            setRegion(s.region);
            setExcerpt(s.excerpt);
            setCoverUrl(s.coverUrl);
            setContent(s.content);
            setIsPublished(s.isPublished);
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
  }, [isEdit, storyId]);

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

      const res = await fetch("/api/admin/upload?folder=stories", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không tải được ảnh.");

      setCoverUrl(json.url);
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

    const payload = { title, region, excerpt, coverUrl, content, isPublished };
    const { errors: found } = validateStoryInput(payload);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      if (found.content) setTab("write");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(isEdit ? `/api/admin/stories/${storyId}` : "/api/admin/stories", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.errors) setErrors(json.errors);
        throw new Error(json.error || "Không lưu được bài viết.");
      }

      router.push("/admin/stories");
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
        <h1 className="font-serif text-3xl font-semibold text-[#344723]">Không tìm thấy bài viết</h1>
        <Link href="/admin/stories" className="mt-6 inline-block text-sm font-semibold text-[#8c7040] hover:text-[#344723]">
          ← Về danh sách bài viết
        </Link>
      </div>
    );
  }

  if (loadError) {
    return <p className="border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]">{loadError}</p>;
  }

  const theme = regionTheme(region);
  const border = (key) => (errors[key] ? "border-[#d9a08b]" : "border-[#d9d1bf]");

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-[960px]">
      <Link href="/admin/stories" className="text-sm font-medium text-[#8c7040] hover:text-[#344723]">
        ← Tất cả bài viết
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-[#344723]">{isEdit ? "Sửa bài viết" : "Viết bài mới"}</h1>

      <div className="mt-8 space-y-6">
        <section className="border border-[#e4dfd2] bg-white p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Tiêu đề" htmlFor="title" error={errors.title}>
                <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} h-11 ${border("title")}`} placeholder="Ví dụ: Cầu Đất: nơi cà phê Arabica lớn lên trong sương" />
              </Field>
            </div>

            <Field
              label="Vùng"
              htmlFor="region"
              error={errors.region}
              hint="Chọn đúng vùng của sản phẩm để bài viết hiện cùng sản phẩm đó và tự dùng tranh phong cảnh phù hợp."
            >
              <input id="region" list="region-options" value={region} onChange={(e) => setRegion(e.target.value)} className={`${inputClass} h-11 ${border("region")}`} placeholder="Ví dụ: Cầu Đất, Lâm Đồng" />
              <datalist id="region-options">
                {regions.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </Field>

            <div>
              <div className="mb-1.5 text-[13px] font-medium text-[#4d513e]">Kiểu tranh minh họa</div>
              <div className="flex h-11 items-center gap-2 border border-[#e4dfd2] bg-[#faf8f1] px-3.5 text-sm text-[#53633c]">
                <ThemeIcon theme={theme} className="h-4 w-4" />
                {THEME_LABEL[theme]}
              </div>
              <p className="mt-1.5 text-xs text-[#a3a58f]">Tự nhận theo vùng khi bạn không tải ảnh bìa.</p>
            </div>

            <div className="sm:col-span-2">
              <Field label="Tóm tắt (không bắt buộc)" htmlFor="excerpt" error={errors.excerpt} hint="Để trống thì hệ thống tự lấy từ đoạn đầu của bài.">
                <textarea id="excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={`${inputClass} resize-none py-3 ${border("excerpt")}`} />
              </Field>
            </div>
          </div>
        </section>

        <section className="border border-[#e4dfd2] bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-[#344723]">Ảnh bìa</h2>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <StoryCover region={region} coverUrl={coverUrl} alt="Ảnh bìa" className="h-28 w-44 flex-shrink-0 border border-[#e4dfd2]" />
            <div>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" aria-label="Chọn ảnh bìa" />
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="h-11 border border-[#344723] bg-white px-5 text-sm font-semibold text-[#344723] transition hover:bg-[#f3f6ee] disabled:opacity-50">
                {uploading ? "Đang tải lên…" : coverUrl ? "Đổi ảnh bìa" : "Tải ảnh bìa lên"}
              </button>
              {coverUrl && (
                <button type="button" onClick={() => setCoverUrl("")} className="ml-3 text-sm font-medium text-[#9a4528] hover:text-[#7e3720]">
                  Dùng tranh vẽ tự động
                </button>
              )}
              <p className="mt-2 text-xs leading-5 text-[#a3a58f]">JPG, PNG hoặc WEBP, tối đa 3MB. Không tải ảnh thì hệ thống tự dùng tranh phong cảnh theo vùng.</p>
              {(uploadError || errors.coverUrl) && <p className="mt-1.5 text-xs text-[#a04a2e]">{uploadError || errors.coverUrl}</p>}
            </div>
          </div>
        </section>

        <section className="border border-[#e4dfd2] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-lg font-semibold text-[#344723]">Nội dung</h2>
            <div className="flex gap-1" role="tablist">
              {[
                ["write", "Soạn thảo"],
                ["preview", "Xem trước"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-2 text-sm font-medium transition ${tab === key ? "bg-[#344723] text-white" : "text-[#6f715f] hover:bg-[#f1eadb]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {tab === "write" ? (
            <div className="mt-4">
              <textarea
                id="content"
                aria-label="Nội dung bài viết"
                rows={20}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`${inputClass} resize-y py-3 font-mono text-[13.5px] leading-7 ${border("content")}`}
                placeholder="Viết nội dung bài ở đây. Các đoạn cách nhau một dòng trống."
              />
              {errors.content && <p className="mt-1.5 text-xs text-[#a04a2e]">{errors.content}</p>}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#a3a58f]">
                <span>
                  {content.length.toLocaleString("vi-VN")} / 20.000 ký tự · khoảng {readingMinutes(content)} phút đọc
                </span>
              </div>
              <details className="mt-4 border border-[#e4dfd2] bg-[#faf8f1] px-4 py-3 text-[13px] leading-6 text-[#6f715f]">
                <summary className="cursor-pointer font-medium text-[#344723]">Cách định dạng bài viết</summary>
                <ul className="mt-3 space-y-1.5">
                  <li>Các đoạn văn cách nhau bằng <strong>một dòng trống</strong>.</li>
                  <li>Tiêu đề phụ: bắt đầu dòng bằng <code className="bg-white px-1">## </code> (ví dụ <code className="bg-white px-1">## Vì sao đặc biệt</code>).</li>
                  <li>Câu trích dẫn: bắt đầu dòng bằng <code className="bg-white px-1">&gt; </code>.</li>
                  <li>Danh sách: mỗi dòng bắt đầu bằng <code className="bg-white px-1">- </code>.</li>
                  <li>Địa chỉ web (https://...) tự trở thành liên kết. Mục <strong>## Nguồn tham khảo</strong> ở cuối bài được trình bày riêng.</li>
                </ul>
              </details>
            </div>
          ) : (
            <div className="mt-4 border border-[#e4dfd2] bg-[#f8f5ec] px-6 py-8" data-testid="preview">
              <h3 className="font-serif text-[30px] font-semibold leading-tight text-[#344723]">{title || "Tiêu đề bài viết"}</h3>
              {region && <p className="mt-2 text-sm text-[#8c7040]">{region}</p>}
              <div className="mt-6 max-w-[720px]">
                {content.trim() ? <StoryContent content={content} /> : <p className="text-sm text-[#a3a58f]">Chưa có nội dung để xem trước.</p>}
              </div>
            </div>
          )}
        </section>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#4d513e]">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 accent-[#344723]" />
          Đăng bài ngay (bỏ chọn để lưu thành bản nháp, chỉ nhân viên thấy)
        </label>

        {serverError && (
          <p className="border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]" role="alert">
            {serverError}
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="h-12 bg-[#344723] px-8 text-sm font-semibold text-white transition hover:bg-[#263719] disabled:opacity-60">
            {saving ? "Đang lưu…" : "Lưu bài viết"}
          </button>
          <Link href="/admin/stories" className="flex h-12 items-center border border-[#d9d1bf] bg-white px-6 text-sm font-semibold text-[#4d513e] transition hover:border-[#344723]">
            Hủy
          </Link>
        </div>
      </div>
    </form>
  );
}