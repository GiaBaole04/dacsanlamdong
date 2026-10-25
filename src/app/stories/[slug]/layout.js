import { pool } from "@/lib/db";

const SITE = "Đặc Sản Lâm Đồng";

// Tên tab trình duyệt = tiêu đề bài viết đang đọc
export async function generateMetadata({ params }) {
  const { slug } = await params;

  if (/^[a-z0-9-]{1,160}$/.test(String(slug))) {
    try {
      const [rows] = await pool.query(
        "SELECT title, excerpt FROM stories WHERE slug = ? AND is_published = 1",
        [slug]
      );

      if (rows[0]) {
        return { title: { absolute: `${rows[0].title} | ${SITE}` }, description: rows[0].excerpt || undefined };
      }
    } catch (error) {
      console.error("metadata câu chuyện:", error);
    }
  }

  return { title: { absolute: `Câu chuyện đặc sản | ${SITE}` } };
}

export default function Layout({ children }) {
  return children;
}
