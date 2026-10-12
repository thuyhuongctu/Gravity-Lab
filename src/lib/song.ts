import { getSound, setAmbient, subscribeSound } from "@/lib/sound";

/** The Gravity Lab theme song, streamed from public/music on demand. */
export const SONG = {
  title: "Từ một quả táo rơi",
  src: `${import.meta.env.BASE_URL}music/tu-mot-qua-tao-roi.mp3`,
};

export type SongState = { playing: boolean; time: number; duration: number };

let state: SongState = { playing: false, time: 0, duration: 0 };
const listeners = new Set<() => void>();
let el: HTMLAudioElement | null = null;

function set(next: Partial<SongState>) {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn());
}

function audio(): HTMLAudioElement {
  if (el) return el;
  el = new Audio(SONG.src);
  el.preload = "none";
  el.volume = getSound().volume;
  subscribeSound(() => {
    if (el) el.volume = getSound().volume;
  });
  el.addEventListener("play", () => set({ playing: true }));
  el.addEventListener("pause", () => set({ playing: false }));
  el.addEventListener("ended", () => set({ playing: false, time: 0 }));
  el.addEventListener("loadedmetadata", () => set({ duration: el?.duration ?? 0 }));
  el.addEventListener("timeupdate", () => set({ time: el?.currentTime ?? 0 }));
  return el;
}

export function subscribeSong(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSong(): SongState {
  return state;
}

/** Play or pause. The space ambience is switched off so the two do not clash. */
export function toggleSong() {
  const a = audio();
  if (a.paused) {
    if (getSound().ambient) setAmbient(false);
    void a.play().catch(() => set({ playing: false }));
  } else {
    a.pause();
  }
}

export function seekSong(seconds: number) {
  const a = audio();
  a.currentTime = seconds;
  set({ time: seconds });
}

/** 312.8 → "5:12". */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export type Stanza = { vi: string; en: string; lines: string[] };

/** Lyrics as sung (Vietnamese version). */
export const LYRICS_VI: Stanza[] = [
  {
    vi: "Mở đầu",
    en: "Intro",
    lines: [
      "Một quả táo rơi… trong vườn đêm,",
      "Vầng trăng lặng lẽ sáng bên thềm.",
      "Từ điều bé nhỏ vừa chạm đất,",
      "Một câu hỏi bay giữa trời xa.",
    ],
  },
  {
    vi: "Đoạn 1",
    en: "Verse 1",
    lines: [
      "Năm ấy, dịch về, trường khép cửa,",
      "Newton về lại chốn quê nhà.",
      "Nhìn quả táo rơi bên vườn cũ,",
      "Nhìn vầng trăng sáng giữa bao la.",
      "",
      "Điều gì đưa táo về mặt đất?",
      "Điều gì giữ trăng giữa tầng không?",
      "Có chăng một lực không nhìn thấy,",
      "Nối trời xa với những chờ mong?",
    ],
  },
  {
    vi: "Tiền điệp khúc",
    en: "Pre-chorus",
    lines: [
      "Hai khối lượng cùng nhân lên,",
      "Chia bình phương khoảng cách đôi bên.",
      "Một dòng công thức trên trang giấy,",
      "Mở lối nhìn vào trời không tên.",
    ],
  },
  {
    vi: "Điệp khúc",
    en: "Chorus",
    lines: [
      "Gravity Lab… mở trời xa,",
      "Một câu hỏi nhỏ dẫn lối ta.",
      "Giữa ngàn tinh tú, mình lặng nghe,",
      "Những điều chưa biết đang gọi về.",
      "",
      "Từ quả táo rơi đến dòng vốn,",
      "Qua bao biên giới, bao đại dương.",
      "Tìm trong dữ liệu bao kết nối,",
      "Từ điều rất nhỏ… đến muôn phương.",
    ],
  },
  {
    vi: "Đoạn 2",
    en: "Verse 2",
    lines: [
      "Năm một chín sáu hai, ngày ấy,",
      "Tinbergen nhìn những tuyến giao thương.",
      "Lấy tầm kinh tế thay khối lượng,",
      "Theo những thị trường qua đại dương.",
      "",
      "Hai nền kinh tế, hai miền đất,",
      "Những dòng trao đổi nối gần xa.",
      "Số mũ chẳng mặc nhiên là hai,",
      "Để cho dữ liệu kể lời ra.",
    ],
  },
  {
    vi: "Tiền điệp khúc",
    en: "Pre-chorus",
    lines: [
      "Dòng giao thương bằng không, giữ lại,",
      "Đừng để con số ấy trôi xa.",
      "Không lấy log từ giá trị ấy,",
      "P-P-M-L… vẫn đưa vào.",
    ],
  },
  {
    vi: "Điệp khúc",
    en: "Chorus",
    lines: [
      "Gravity Lab… mở trời xa,",
      "Một câu hỏi nhỏ dẫn lối ta.",
      "Giữa ngàn tinh tú, mình lặng nghe,",
      "Những điều chưa biết đang gọi về.",
      "",
      "Từ quả táo rơi đến dòng vốn,",
      "Qua bao biên giới, bao đại dương.",
      "Tìm trong dữ liệu bao kết nối,",
      "Từ điều rất nhỏ… đến muôn phương.",
    ],
  },
  {
    vi: "Nhịp cầu",
    en: "Bridge",
    lines: [
      "Bên dòng sông Hậu mùa phù sa,",
      "Ta nhìn dòng vốn đến từ xa.",
      "Khoảng cách đâu chỉ là cây số,",
      "Còn bao điều ngăn lối người qua.",
      "",
      "Thể chế, niềm tin và văn hóa,",
      "Những nhịp cầu chưa hiện thành tên.",
      "Dẫu khác điều lòng ta mong đợi,",
      "Vẫn nghe bằng chứng, chẳng lãng quên.",
    ],
  },
  {
    vi: "Đoạn 3",
    en: "Verse 3",
    lines: [
      "Giảng đường Cần Thơ còn sáng đèn,",
      "Ngoài ô cửa, đêm xuống thật êm.",
      "Thầy trò dựng những mô hình nhỏ,",
      "Để những chân trời mở rộng thêm.",
      "",
      "Một hành tinh sáng trên màn hình,",
      "Gợi bao câu hỏi giữa lặng thinh.",
      "Thử rồi quan sát, cùng so sánh,",
      "Từng bước hiểu thêm thế giới mình.",
    ],
  },
  {
    vi: "Điệp khúc cuối",
    en: "Final chorus",
    lines: [
      "Gravity Lab… mở trời xa,",
      "Từ khu vườn cũ đến cùng ta.",
      "Qua bao thế kỷ, câu hỏi ấy,",
      "Vẫn còn ngân giữa những ngân hà.",
      "",
      "Từ quả táo rơi đến dòng vốn,",
      "Từ miền xa thẳm đến quê hương.",
      "Ta mang câu hỏi vào thế giới,",
      "Mở thêm một lối… đến muôn phương.",
    ],
  },
  {
    vi: "Kết",
    en: "Outro",
    lines: [
      "Một quả táo rơi… đêm lặng yên,",
      "Một niềm háo hức vừa thắp lên.",
      "Từ trời Cần Thơ nhìn xa mãi,",
      "Bao điều chưa biết vẫn chưa tên.",
      "",
      "Nhạc dần tan giữa trời sao,",
      "Câu hỏi còn theo những khát khao.",
      "Gravity Lab… mình bước tiếp,",
      "Một quả táo nhỏ… một trời sao.",
    ],
  },
  {
    vi: "Lời thì thầm",
    en: "Spoken",
    lines: ["Gravity Lab…", "Câu hỏi tiếp theo…", "Bắt đầu từ bạn."],
  },
];
