import { tr } from "@/lib/prefs";
import { forPlay } from "@/lib/play-app";

/** About the app and its two authors, and what the app does with the reader's data (nothing leaves the device). */
export function About() {
  const base = import.meta.env.BASE_URL;
  const authors: Array<{
    face: string;
    name: [string, string];
    role: [string, string];
    orcid: string;
  }> = [
    {
      face: "cast/v2/tu-face.webp",
      name: ["PGS.TS. Phan Anh Tú", "Assoc. Prof. Phan Anh Tu"],
      role: [
        "Thiết kế nghiên cứu và đặc tả mô hình trọng lực (Phan & Do, 2019)",
        "Research design and the gravity-model specifications (Phan & Do, 2019)",
      ],
      orcid: "0000-0003-0667-3137",
    },
    {
      face: "cast/v2/huong-face.webp",
      name: ["NCS. Đỗ Thùy Hương", "Do Thuy Huong, PhD candidate"],
      role: [
        "Thiết kế, phát triển ứng dụng, học liệu và bảo trì",
        "Application design and development, teaching materials and maintenance",
      ],
      orcid: "0000-0002-7711-2487",
    },
  ];
  const privacy: Array<[string, string]> = [
    [
      "Không tài khoản, không theo dõi (analytics), không cookie. App chạy hoàn toàn trên trình duyệt của bạn.",
      "No account, no analytics, no cookies. The app runs entirely in your browser.",
    ],
    [
      "Dữ liệu bạn nạp vào phòng thí nghiệm (CSV) được xử lý ngay trên thiết bị và không bao giờ được tải lên máy chủ.",
      "Data you load into the lab (CSV) is processed on your device and is never uploaded to a server.",
    ],
    [
      "Lumina trả lời từ các tài liệu có sẵn trong app; câu hỏi của bạn không được gửi đi đâu và không được lưu lại.",
      "Lumina answers from the references built into the app; your questions are not sent anywhere and are not stored.",
    ],
    [
      "Chỉ các lựa chọn giao diện (ngôn ngữ, theme, âm lượng, đã xem giới thiệu) được ghi trong bộ nhớ trình duyệt; xóa dữ liệu trang là xóa hết.",
      "Only interface choices (language, theme, volume, onboarding seen) are kept in browser storage; clearing the site data removes everything.",
    ],
    [
      "Sau lần mở đầu, app có thể cài lên màn hình chính và chạy ngoại tuyến (offline).",
      "After the first visit the app can be installed on the home screen and used offline.",
    ],
  ];
  return (
    <section className="mx-auto max-w-5xl px-4 pt-10" aria-labelledby="about-h">
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="noir-card rounded-[26px] p-5 sm:p-6">
          <p className="kicker text-amber">
            {tr("Giới thiệu Gravity Lab (about)", "About Gravity Lab")}
          </p>
          <h3 id="about-h" className="sr-only">
            {tr("Tác giả", "Authors")}
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {authors.map((a) => (
              <li key={a.orcid} className="flex items-center gap-3">
                <img
                  src={`${base}${a.face}`}
                  alt=""
                  width={52}
                  height={52}
                  loading="lazy"
                  className="size-13 shrink-0 rounded-full bg-[#f1e8de] object-cover shadow-[0_0_0_2px_rgba(79,209,197,0.55)]"
                />
                <div className="min-w-0">
                  <p className="font-serif text-base leading-tight">{tr(a.name[0], a.name[1])}</p>
                  <p className="text-xs text-muted">{tr(a.role[0], a.role[1])}</p>
                  <a
                    className="text-xs text-muted underline decoration-line underline-offset-2"
                    href={`https://orcid.org/${a.orcid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ORCID {a.orcid}
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">
            {forPlay(
              tr("Cần Thơ · Việt Nam", "Can Tho · Việt Nam"),
              tr("Khoa Kinh tế, Đại học Cần Thơ · Việt Nam", "School of Economics, Can Tho University · Việt Nam"),
            )}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed">
            {tr(
              "Chúng tôi xây dựng Gravity Lab để sinh viên kinh tế được nhìn thấy mô hình lực hấp dẫn (gravity model) — từ định luật Newton đến dòng vốn FDI vào Việt Nam (FDI inflows) — thay vì chỉ đọc về nó.",
              "We built Gravity Lab so economics students can see the gravity model — from Newton’s law to FDI inflows into Viet Nam — rather than only read about it.",
            )}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed">
            {tr(
              "Lumina, trợ giảng (teaching assistant) của bạn, được tạo hình từ tượng đất sét của Thùy Hương.",
              "Lumina, your teaching assistant, is modelled on Thuy Huong’s clay figurine.",
            )}
          </p>
        </div>
        <div className="noir-card rounded-[26px] p-5 sm:p-6">
          <p id="privacy-h" className="kicker text-amber">
            {tr("Quyền riêng tư (privacy)", "Privacy")}
          </p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed">
            {privacy.map(([vi, en]) => (
              <li key={en} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-[7px] size-2 shrink-0 rounded-full bg-[#4fd1c5]"
                />
                <span>{tr(vi, en)}</span>
              </li>
            ))}
          </ul>
          <a
            href={`${import.meta.env.BASE_URL}privacy/`}
            className="mt-3 inline-block text-sm font-semibold text-teal underline-offset-2 hover:underline"
          >
            {tr("Trang chính sách quyền riêng tư đầy đủ →", "Full privacy policy page →")}
          </a>
        </div>
      </div>
    </section>
  );
}
