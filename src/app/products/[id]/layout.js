import { pool } from "@/lib/db";

const SITE = "Đặc Sản Lâm Đồng";

// Tên tab trình duyệt = tên sản phẩm đang xem
export async function generateMetadata({ params }) {
  const { id } = await params;
  const productId = Number(id);

  if (Number.isInteger(productId) && productId > 0) {
    try {
      const [rows] = await pool.query(
        "SELECT name, description FROM products WHERE id = ? AND is_active = 1",
        [productId]
      );

      if (rows[0]) {
        return { title: { absolute: `${rows[0].name} | ${SITE}` }, description: rows[0].description || undefined };
      }
    } catch (error) {
      console.error("metadata sản phẩm:", error);
    }
  }

  return { title: { absolute: `Sản phẩm | ${SITE}` } };
}

export default function Layout({ children }) {
  return children;
}
