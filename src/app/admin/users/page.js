"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatDateTime } from "@/lib/orderUtils";

import { friendlyError } from "@/lib/friendlyError";
const ROLE_LABEL = { admin: "Quản trị viên", staff: "Nhân viên", customer: "Khách hàng" };
const ROLE_BADGE = {
  admin: "bg-[#e8e4f6] text-[#52458f]",
  staff: "bg-[#e4eefa] text-[#2f5d8f]",
  customer: "bg-[#ece8dc] text-[#6f715f]",
};
const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "admin", label: "Quản trị viên" },
  { key: "staff", label: "Nhân viên" },
  { key: "customer", label: "Khách hàng" },
];

function roleWarning(from, to) {
  if (to === "customer") return "Người này sẽ mất quyền truy cập khu vực quản trị.";
  if (to === "staff") {
    return from === "admin"
      ? "Người này sẽ không còn quyền quản lý tài khoản và xóa dữ liệu."
      : "Nhân viên có thể xử lý đơn hàng, quản lý sản phẩm và viết bài. Người này cần đăng xuất rồi đăng nhập lại để quyền mới có hiệu lực.";
  }
  return "Quản trị viên có toàn quyền: xóa sản phẩm, xóa bài viết và quản lý tài khoản. Người này cần đăng xuất rồi đăng nhập lại để quyền mới có hiệu lực.";
}

export default function AdminUsersPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [change, setChange] = useState(null); // { user, role }
  const [busy, setBusy] = useState(false);
  const [changeError, setChangeError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const current = ++requestId.current;

    try {
      setError("");
      const params = new URLSearchParams({ role: tab });
      if (query) params.set("q", query);

      const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không tải được danh sách tài khoản.");
      if (current === requestId.current) setData(json);
    } catch (err) {
      if (current === requestId.current) setError(friendlyError(err));
    }
  }, [tab, query]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchUser(id, body) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Không cập nhật được tài khoản.");
  }

  async function confirmChange() {
    if (!change || busy) return;

    setBusy(true);
    setChangeError("");

    try {
      await patchUser(change.user.id, { role: change.role });
      setChange(null);
      await load();
    } catch (err) {
      setChangeError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function unlock(user) {
    setNotice("");

    try {
      await patchUser(user.id, { unlock: true });
      await load();
    } catch (err) {
      setNotice(friendlyError(err));
    }
  }

  const counts = data?.counts;
  const total = counts ? counts.admin + counts.staff + counts.customer : 0;

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-[#344723]">Tài khoản</h1>
      <p className="mt-1 text-sm text-[#8c8d7d]">Quản lý vai trò của nhân viên và khách hàng. Chỉ quản trị viên xem được trang này.</p>

      <div className="mt-6 border border-[#e8d9ae] bg-[#fbf4dd] px-5 py-4 text-sm leading-6 text-[#7d6a35]">
        <strong>Thêm nhân viên mới:</strong> nhờ người đó đăng ký tài khoản trên website (xác thực email bằng mã OTP), sau đó đổi vai
        trò của họ sang &ldquo;Nhân viên&rdquo; tại đây.
      </div>

      <div className="mt-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email…"
          aria-label="Tìm tài khoản"
          className="h-11 w-full max-w-[380px] border border-[#d9d1bf] bg-white px-4 text-sm outline-none focus:border-[#344723]"
        />
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-[#e4dfd2]" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
              tab === t.key ? "border-[#344723] text-[#344723]" : "border-transparent text-[#8c8d7d] hover:text-[#344723]"
            }`}
          >
            {t.label}
            {counts && <span className="ml-1 text-xs text-[#a3a58f]"> ({t.key === "all" ? total : counts[t.key]})</span>}
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
              <th className="px-4 py-3 font-medium">Tài khoản</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Đơn hàng</th>
              <th className="px-4 py-3 font-medium">Tình trạng</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#efe9da]">
            {!data ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#8c8d7d]">Đang tải…</td>
              </tr>
            ) : data.users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#8c8d7d]">Không có tài khoản nào phù hợp.</td>
              </tr>
            ) : (
              data.users.map((u) => {
                const isSelf = u.id === data.currentUserId;
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-[#344723]">
                        {u.fullName}
                        {isSelf && <span className="ml-2 bg-[#e3eedc] px-2 py-0.5 text-[11px] font-semibold text-[#3b6a2a]">Bạn</span>}
                      </div>
                      <div className="text-xs text-[#8c8d7d]">{u.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {isSelf ? (
                        <span className={`px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                      ) : (
                        <select
                          value={u.role}
                          aria-label={`Vai trò của ${u.fullName}`}
                          onChange={(e) => {
                            setChangeError("");
                            setChange({ user: u, role: e.target.value });
                          }}
                          className="h-10 border border-[#d9d1bf] bg-white px-2.5 text-sm outline-none focus:border-[#344723]"
                        >
                          {Object.entries(ROLE_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#6f715f]">{u.orderCount}</td>
                    <td className="px-4 py-3.5">
                      {u.lockedUntil ? (
                        <div>
                          <span className="bg-[#f6e3dc] px-2.5 py-1 text-xs font-semibold text-[#9a4528]">Đang bị khóa</span>
                          <div className="mt-1 text-xs text-[#8c8d7d]">đến {formatDateTime(u.lockedUntil)}</div>
                          <button type="button" onClick={() => unlock(u)} aria-label={`Mở khóa ${u.fullName}`} className="mt-1 text-xs font-semibold text-[#344723] underline underline-offset-4 hover:text-[#8c7040]">
                            Mở khóa
                          </button>
                        </div>
                      ) : !u.emailVerified ? (
                        <span className="bg-[#fbf1d9] px-2.5 py-1 text-xs font-semibold text-[#8a6a1a]">Chưa xác thực email</span>
                      ) : (
                        <span className="text-xs text-[#3b6a2a]">Bình thường</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#8c8d7d]">{formatDateTime(u.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(change)}
        title="Đổi vai trò tài khoản?"
        confirmLabel="Đổi vai trò"
        tone={change?.role === "customer" ? "danger" : "primary"}
        busy={busy}
        error={changeError}
        onConfirm={confirmChange}
        onCancel={() => setChange(null)}
      >
        {change && (
          <>
            <p>
              Đổi <strong>{change.user.fullName}</strong> từ <strong>{ROLE_LABEL[change.user.role]}</strong> sang{" "}
              <strong>{ROLE_LABEL[change.role]}</strong>?
            </p>
            <p>{roleWarning(change.user.role, change.role)}</p>
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}