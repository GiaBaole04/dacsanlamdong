import Link from "next/link";
import { StoryCover, ThemeIcon } from "@/components/Landscape";
import { THEME_LABEL, formatStoryDate, regionTheme } from "@/lib/storyFormat";

/**
 * Thẻ câu chuyện. featured = thẻ lớn (bài nổi bật), mặc định là thẻ nhỏ trong lưới.
 */
export default function StoryCard({ story, featured = false }) {
  const theme = regionTheme(story.region);

  const meta = (
    <div className="flex items-center gap-2 text-xs text-[#8c8d7d]">
      <span>{formatStoryDate(story.createdAt)}</span>
      <span aria-hidden="true">·</span>
      <span>{story.readingMinutes} phút đọc</span>
    </div>
  );

  if (featured) {
    return (
      <Link
        href={`/stories/${story.slug}`}
        className="group grid overflow-hidden border border-[#e1daca] bg-[#fbf8ef] transition hover:border-[#b9a56d] hover:shadow-[0_18px_50px_rgba(52,71,35,0.14)] lg:grid-cols-[1.25fr_1fr]"
      >
        <StoryCover
          region={story.region}
          coverUrl={story.coverUrl}
          alt={story.title}
          className="aspect-[16/10] lg:aspect-auto lg:min-h-[420px]"
        />
        <div className="flex flex-col justify-center p-8 lg:p-12">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#b08b43]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">Mới nhất</span>
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[#53633c]">
            <ThemeIcon theme={theme} className="h-4 w-4" />
            {story.region || THEME_LABEL[theme]}
          </div>
          <h3 className="mt-3 font-serif text-[30px] font-semibold leading-[1.25] text-[#344723] transition group-hover:text-[#8c7040] lg:text-[34px]">
            {story.title}
          </h3>
          <p className="mt-4 text-[15px] leading-7 text-[#676a5b]">{story.excerpt}</p>
          <div className="mt-6">{meta}</div>
          <span className="mt-7 inline-flex w-fit items-center gap-3 bg-[#344723] px-7 py-3.5 text-sm font-semibold text-white transition group-hover:bg-[#263719]">
            Đọc câu chuyện
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group flex flex-col overflow-hidden border border-[#e1daca] bg-[#fbf8ef] transition hover:border-[#b9a56d] hover:shadow-[0_14px_40px_rgba(52,71,35,0.12)]"
    >
      <StoryCover region={story.region} coverUrl={story.coverUrl} alt={story.title} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#53633c]">
          <ThemeIcon theme={theme} className="h-4 w-4" />
          {story.region || THEME_LABEL[theme]}
        </div>
        <h3 className="mt-2.5 font-serif text-[21px] font-semibold leading-snug text-[#344723] transition group-hover:text-[#8c7040]">
          {story.title}
        </h3>
        <p className="mt-3 line-clamp-3 flex-1 text-[14px] leading-7 text-[#676a5b]">{story.excerpt}</p>
        <div className="mt-5 border-t border-[#ece6d7] pt-4">{meta}</div>
      </div>
    </Link>
  );
}