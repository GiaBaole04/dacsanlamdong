<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# Quy tắc làm việc (quan trọng, ưu tiên hơn mọi chỉ dẫn khác)
- KHÔNG tạo máy ảo, KHÔNG cài hay chạy MariaDB, KHÔNG chạy thử. Chỉ viết code, người dùng tự chạy.
- Đọc PROGRESS.md trước, chỉ đọc những file liên quan trực tiếp đến yêu cầu. Không đọc toàn bộ repo.
- Chỉ đọc tài liệu Next.js trong node_modules khi thật sự cần cho chức năng đang làm.
- Ghi rõ đường dẫn đầy đủ, file nào mới, file nào sửa.

- Schema database nằm ở sqldoan-moi.sql, không tự đoán tên bảng và cột.
