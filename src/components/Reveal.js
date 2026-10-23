'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Bọc một khối nội dung để nó trượt nhẹ lên và hiện dần khi cuộn tới.
 * delay (ms) dùng để các thẻ trong cùng một hàng xuất hiện lần lượt.
 * Hiệu ứng được định nghĩa trong globals.css (lớp .reveal) và tự tắt nếu người dùng chọn giảm chuyển động.
 */
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}
