import { parseStoryContent, tokenizeInline } from "@/lib/storyFormat";

function Inline({ text }) {
  return tokenizeInline(text).map((part, i) =>
    part.type === "link" ? (
      <a
        key={i}
        href={part.value}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="break-all text-[#8c7040] underline decoration-[#d9c58a] underline-offset-4 transition hover:text-[#344723]"
      >
        {part.value}
      </a>
    ) : (
      <span key={i}>{part.value}</span>
    )
  );
}

/**
 * Hiển thị nội dung bài viết (cú pháp: ## tiêu đề phụ, > trích dẫn, - danh sách, https://... liên kết).
 * Mọi thứ hiển thị bằng React nên nội dung do người dùng nhập luôn được thoát ký tự an toàn.
 * Mục "Nguồn tham khảo" ở cuối được trình bày riêng, nhỏ và nhẹ hơn.
 */
export default function StoryContent({ content }) {
  const blocks = parseStoryContent(content);
  const sourceIndex = blocks.findIndex((b) => b.type === "h2" && /^ngu[oồ]n tham kh[aả]o$/i.test(b.text));
  const main = sourceIndex === -1 ? blocks : blocks.slice(0, sourceIndex);
  const sources = sourceIndex === -1 ? [] : blocks.slice(sourceIndex + 1);

  return (
    <div className="story-content">
      {main.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2 key={index} className="mb-4 mt-12 font-serif text-[26px] font-semibold leading-snug text-[#344723]">
              <span className="mb-3 block h-px w-10 bg-[#b08b43]" />
              {block.text}
            </h2>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={index}
              className="my-9 border-l-[3px] border-[#b08b43] bg-[#f1eadb] px-7 py-6 font-serif text-[21px] font-medium italic leading-[1.6] text-[#344723]"
            >
              <Inline text={block.text} />
            </blockquote>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={index} className="my-6 space-y-3">
              {block.items.map((item, i) => (
                <li key={i} className="flex gap-3 text-[16px] leading-8 text-[#4d513e]">
                  <span className="mt-[13px] h-2 w-2 flex-shrink-0 rotate-45 bg-[#b08b43]" aria-hidden="true" />
                  <span>
                    <Inline text={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        const isLead = index === 0;

        return (
          <p
            key={index}
            className={
              isLead
                ? "mb-6 font-serif text-[21px] leading-[1.75] text-[#3c4130]"
                : "my-5 text-[16.5px] leading-[1.95] text-[#4d513e]"
            }
          >
            <Inline text={block.text} />
          </p>
        );
      })}

      {sources.length > 0 && (
        <aside className="mt-14 border-t border-[#e1daca] pt-7" aria-label="Nguồn tham khảo">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c7040]">Nguồn tham khảo</h2>
          <ul className="mt-4 space-y-2.5">
            {sources.flatMap((block) => (block.type === "ul" ? block.items : [block.text])).map((item, i) => (
              <li key={i} className="text-[13px] leading-6 text-[#7a7d6b]">
                <Inline text={item} />
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}