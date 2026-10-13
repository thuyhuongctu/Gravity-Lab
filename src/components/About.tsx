import { tr } from "@/lib/prefs";

/** About the app and its author, and what the app does with the reader's data (nothing leaves the device). */
export function About() {
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
          <p className="kicker text-amber">{tr("Giới thiệu Gravity Lab (about)", "About Gravity Lab")}</p>
          <div className="mt-3 flex items-center gap-4">
            <img
              src={`${import.meta.env.BASE_URL}about/ctu.webp`}
              alt={tr("Logo Đại học Cần Thơ", "Can Tho University logo")}
              width={64}
              height={64}
              loading="lazy"
              className="size-16 shrink-0 rounded-2xl bg-white object-contain p-1"
            />
            <div className="min-w-0">
              <h3 id="about-h" className="font-serif text-2xl leading-tight">
                Thùy Hương · Je m'appelle Hương
              </h3>
              <p className="text-sm text-muted">{tr("Khoa Kinh tế, Đại học Cần Thơ · Việt Nam", "School of Economics, Can Tho University · Việt Nam")}</p>
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed">
            {tr(
              "Tôi xây dựng Gravity Lab để sinh viên kinh tế được nhìn thấy mô hình lực hấp dẫn (gravity model) — từ định luật Newton đến dòng vốn FDI vào Việt Nam (FDI inflows) — thay vì chỉ đọc về nó.",
              "I built Gravity Lab so economics students can see the gravity model — from Newton’s law to FDI inflows into Viet Nam — rather than only read about it.",
            )}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed">
            {tr(
              "Lumina, trợ giảng (teaching assistant) của bạn, được tạo hình từ tượng đất sét của tôi.",
              "Lumina, your teaching assistant, is modelled on my clay figurine.",
            )}
          </p>
          <p className="mt-2 text-sm text-muted">
            {tr("Cố vấn học thuật (academic advisor): PGS.TS. Phan Anh Tú", "Academic advisor: Assoc. Prof. Dr. Phan Anh Tu")}
          </p>
        </div>
        <div className="noir-card rounded-[26px] p-5 sm:p-6">
          <p id="privacy-h" className="kicker text-amber">{tr("Quyền riêng tư (privacy)", "Privacy")}</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed">
            {privacy.map(([vi, en]) => (
              <li key={en} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[7px] size-2 shrink-0 rounded-full bg-[#4fd1c5]" />
                <span>{tr(vi, en)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
