'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Con số chạy từ 0 lên giá trị `to` khi cuộn tới (dùng cho các số liệu nổi bật).
 */
export default function CountUp({ to, duration = 1500, suffix = '', className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(0);

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
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startTime = performance.now();
    let raf;

    function tick(now) {
      const progress = reduce ? 1 : Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, to, duration]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString('vi-VN')}
      {suffix}
    </span>
  );
}
