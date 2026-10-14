import { useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import { getSong, pickSong, subscribeSong, toggleSong, type SongId } from "@/lib/song";
import { tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";

type Part = {
  part: string;
  mood: [string, string];
  f: [string, string];
  img: string;
  pos: string;
  alt: [string, string];
  lines: [string[], string[]];
};

/** The story told through the song, one section at a time (design handoff, GL Cosmos). VI then EN. */
const STORY: Part[] = [
  {
    part: "Intro",
    mood: ["Thân mật, lơ lửng (intimate, floating)", "Soft, curious"],
    f: ["Woolsthorpe · 1665", "Woolsthorpe · 1665"],
    img: "newton-tree",
    pos: "60% 50%",
    alt: ["Newton dưới cây táo trong vườn đêm", "Newton under the apple tree in a night orchard"],
    lines: [
      ["Một quả táo rơi… trong vườn đêm,", "Vầng trăng lặng lẽ sáng bên thềm.", "Từ điều bé nhỏ vừa chạm đất,", "Một câu hỏi bay giữa trời xa."],
      ["An apple falls beneath the stars,", "A question travels near and far.", "From orchard skies to worlds we draw,", "Come feel the wonder, find the law."],
    ],
  },
  {
    part: "Pre-Chorus",
    mood: ["Dâng dần (gentle build)", "Gentle build"],
    f: ["F = G m₁m₂ / r²", "F = G m₁m₂ / r²"],
    img: "tu-board",
    pos: "70% 40%",
    alt: ["Thầy Tú bên bảng công thức", "Lecturer Tú beside the formula board"],
    lines: [
      ["Hai khối lượng cùng nhân lên,", "Chia bình phương khoảng cách đôi bên.", "Một dòng công thức trên trang giấy,", "Mở lối nhìn vào trời không tên."],
      ["Mass pulls mass across the night,", "Less space between, a stronger tide.", "A world of questions in our hands—", "Let’s build a model, understand."],
    ],
  },
  {
    part: "Verse 2",
    mood: ["Suy tư (reflective)", "Reflective"],
    f: ["Tᵢⱼ = G YᵢYⱼ / Dᵢⱼᵞ", "Tᵢⱼ = G YᵢYⱼ / Dᵢⱼᵞ"],
    img: "tinbergen-suit",
    pos: "40% 35%",
    alt: ["Tinbergen cầm bảng công thức thương mại", "Tinbergen holding the trade formula"],
    lines: [
      ["Năm một chín sáu hai, ngày ấy,", "Tinbergen nhìn những tuyến giao thương.", "Lấy tầm kinh tế thay khối lượng,", "Số mũ chẳng mặc nhiên là hai."],
      ["Nineteen sixty-two, a map, a pen,", "Tinbergen traced the links again.", "Not stars this time, but markets wide,", "With size and distance side by side."],
    ],
  },
  {
    part: "Pre-Chorus",
    mood: ["Dâng dần (gentle build)", "Gentle build"],
    f: ["PPML · FDI = 0", "PPML · FDI = 0"],
    img: "minhlong-apple",
    pos: "50% 40%",
    alt: ["Minh Long nâng quả táo vàng phát sáng", "Minh Long holding a glowing golden apple"],
    lines: [
      ["Dòng giao thương bằng không, giữ lại,", "Đừng để con số ấy trôi xa.", "Không lấy log từ giá trị ấy,", "P-P-M-L… vẫn đưa vào."],
      ["When trade is zero, let it stay,", "Don’t let the logs sweep it away.", "P-P-M-L keeps zeros in,", "Another place for us to begin."],
    ],
  },
  {
    part: "Bridge",
    mood: ["Lặng, treo lơ lửng (hushed, suspended)", "Warm, reflective"],
    f: ["β ≈ −0,38", "β ≈ −0.38"],
    img: "mekong-team",
    pos: "60% 50%",
    alt: ["Cả nhóm trên bến sông Hậu", "The team on the Hậu River landing"],
    lines: [
      ["Bên dòng sông Hậu mùa phù sa,", "Ta nhìn dòng vốn đến từ xa.", "Khoảng cách đâu chỉ là cây số,", "Còn bao điều ngăn lối người qua."],
      ["By the Hau River, dreams take flight,", "Can Tho classrooms glow with light.", "Distance lives beyond the miles—", "In rules and trust, in words and ties."],
    ],
  },
  {
    part: "Verse 3",
    mood: ["Ngày càng ngạc nhiên (growing wonder)", "Lift the energy"],
    f: ["γ̂ từ dữ liệu của bạn (your data)", "γ̂ from your data"],
    img: "lab-team",
    pos: "50% 45%",
    alt: ["Thầy trò dựng mô hình trong giảng đường", "Lecturer and students building models in the lecture hall"],
    lines: [
      ["Giảng đường Cần Thơ còn sáng đèn,", "Ngoài ô cửa, đêm xuống thật êm.", "Thầy trò dựng những mô hình nhỏ,", "Để những chân trời mở rộng thêm."],
      ["Build a little world and watch it move,", "Change one thing—what can we prove?", "Let a question lead the way,", "Try, compare, then try again."],
    ],
  },
  {
    part: "Final Chorus",
    mood: ["Rộng mở, xúc động (expansive)", "Bigger, uplifting"],
    f: ["Gravity Lab", "Gravity Lab"],
    img: "tu-minhlong",
    pos: "50% 40%",
    alt: ["Thầy Tú và Minh Long trò chuyện bên sông", "Lecturer Tú and Minh Long talking by the river"],
    lines: [
      ["Gravity Lab… mở trời xa,", "Từ khu vườn cũ đến cùng ta.", "Qua bao thế kỷ, câu hỏi ấy,", "Vẫn còn ngân giữa những ngân hà."],
      ["Gravity Lab, let your questions fly,", "From the world below to the stars up high.", "Gravity Lab, a world to explore—", "One small question opens one more door."],
    ],
  },
];

const TITLES: Record<SongId, string> = { vi: "Từ một quả táo rơi · Tiếng Việt", en: "From an Apple to the Stars · English" };

/** The song's story: seven illustrated sections with the lyrics in the current language, and both recordings. */
export function SongStory() {
  const { lang } = usePrefs();
  const L = lang === "vi" ? 0 : 1;
  const song = useSyncExternalStore(subscribeSong, getSong, getSong);
  const play = (id: SongId) => {
    if (song.id !== id) pickSong(id);
    toggleSong();
  };
  return (
    <section className="mx-auto max-w-5xl px-4 pt-10" aria-labelledby="song-story">
      <p className="kicker text-amber">{tr("Bài hát · Gravity Lab", "The song · Gravity Lab")}</p>
      <h3 id="song-story" className="mt-2 font-serif text-3xl leading-tight tracking-[-0.02em] sm:text-4xl">
        {tr("Từ quả táo rơi đến dòng vốn (capital flows).", "From a falling apple to capital flows.")}
      </h3>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {tr("Câu chuyện kể theo lời bài hát, từng đoạn một.", "The story told through the lyrics, one section at a time.")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["vi", "en"] as SongId[]).map((id) => {
          const on = song.playing && song.id === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => play(id)}
              aria-pressed={on}
              className={"inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold " + (on ? "cosmic-btn" : "noir-raise text-ink")}
            >
              {on ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
              {TITLES[id]}
            </button>
          );
        })}
      </div>
      <ol className="mt-5 grid gap-4 md:grid-cols-2">
        {STORY.map((s, i) => (
          <li key={i} className="noir-card overflow-hidden rounded-[26px]">
            <img
              src={`${import.meta.env.BASE_URL}scene/v2/${s.img}.webp`}
              alt={s.alt[L]}
              width={688}
              height={384}
              loading="lazy"
              style={{ objectPosition: s.pos }}
              className="aspect-[16/9] w-full bg-[#0a0b0d] object-cover"
            />
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="rounded-full bg-[#4fd1c5] px-2.5 py-0.5 font-semibold text-[#062a30]">{s.part}</span>
                <span className="text-muted">{s.mood[L]}</span>
                <span className="font-math text-sm text-teal">{s.f[L]}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">
                {s.lines[L].map((line, j) => (
                  <span key={j} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="noir-card mt-4 rounded-[26px] p-5 text-center">
        <p className="kicker text-amber">{tr("Lời nói · thì thầm (spoken)", "Spoken · whispered")}</p>
        <p className="mt-2 font-serif text-xl">
          {tr("Gravity Lab… Câu hỏi tiếp theo… Bắt đầu từ bạn.", "Gravity Lab… The next question starts with you.")}
        </p>
      </div>
      <p className="mt-3 text-xs text-muted">
        {tr(
          "Lời: nhóm tác giả Gravity Lab. Nhạc tạo bằng công cụ AI từ lời và mô tả phong cách của tác giả. Lời đầy đủ của cả hai bản nằm trong bảng Âm thanh.",
          "Lyrics by the Gravity Lab authors. Music generated with an AI tool from the authors’ lyrics and style description. The full lyrics of both versions are in the Sound panel.",
        )}
      </p>
    </section>
  );
}
