/**
 * Knowledge base for the offline teaching assistant. Every answer restates material
 * already in the app or in a cited source; nothing is generated at run time.
 * `see` opens a room (and FDI panel) from the answer.
 */

export type TutorRoom = "story" | "cast" | "orbit" | "trade" | "lab";
export type TutorPanel = "coef" | "sim" | "ppml" | "data";

export type Entry = {
  id: string;
  q: { vi: string; en: string };
  /** Extra words people use for this topic, either language, diacritics optional. */
  keys: string;
  a: { vi: string; en: string };
  cite: string[];
  see?: { room: TutorRoom; panel?: TutorPanel; vi: string; en: string };
};

export const KB: Entry[] = [
  {
    id: "newton-law",
    q: { vi: "Định luật vạn vật hấp dẫn của Newton là gì?", en: "What is Newton's law of universal gravitation?" },
    keys: "newton luc hap dan force gravity F = G m1 m2 / r^2 binh phuong khoang cach inverse square principia 1687 qua tao apple mat trang moon",
    a: {
      vi: "Hai vật có khối lượng hút nhau với lực F = G·m₁m₂/r²: tỷ lệ với tích hai khối lượng và nghịch với bình phương khoảng cách. Newton công bố trong Principia (1687); cùng một lực kéo quả táo rơi và giữ Mặt Trăng trên quỹ đạo.",
      en: "Two masses attract with force F = G·m₁m₂/r²: proportional to the product of the masses and inversely proportional to the square of the distance. Newton published it in the Principia (1687); the same force pulls the apple down and keeps the Moon in orbit.",
    },
    cite: ["Newton (1687/1999)"],
    see: { room: "orbit", vi: "Mở phòng Quỹ đạo", en: "Open the Orbit room" },
  },
  {
    id: "big-g",
    q: { vi: "Hằng số hấp dẫn G bằng bao nhiêu và ai đo được?", en: "What is the gravitational constant G and who measured it?" },
    keys: "hang so G gravitational constant cavendish 1798 codata 6.674 do mat do trai dat density earth",
    a: {
      vi: "Theo CODATA 2022, G = 6,67430 × 10⁻¹¹ m³ kg⁻¹ s⁻² (Mohr và cộng sự, 2025). Năm 1798 Cavendish dùng cân xoắn đo mật độ Trái Đất; từ đó suy ra được G. Newton không công bố giá trị của G.",
      en: "CODATA 2022 gives G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻² (Mohr et al., 2025). In 1798 Cavendish used a torsion balance to measure the density of the Earth, from which G follows. Newton did not publish a value for G.",
    },
    cite: ["Cavendish (1798)", "Mohr et al. (2025)"],
  },
  {
    id: "kepler",
    q: { vi: "Định luật Kepler thứ ba nói gì, và vì sao quỹ đạo gần thì kêu cao hơn?", en: "What does Kepler's third law say, and why do inner orbits sound higher?" },
    keys: "kepler dinh luat thu ba third law chu ky period quy dao am thanh sonification cao do pitch hanh tinh planet",
    a: {
      vi: "Bình phương chu kỳ quỹ đạo tỷ lệ với lập phương bán kính quỹ đạo, nên vật càng gần càng quay nhanh. Trong phòng Quỹ đạo, cao độ mỗi vật tỷ lệ với tốc độ góc của nó, nên quỹ đạo gần kêu cao hơn (Kepler, 1619/1997).",
      en: "The square of the orbital period is proportional to the cube of the orbit's radius, so closer bodies go round faster. In the Orbit room each body's pitch follows its angular speed, so inner orbits sound higher (Kepler, 1619/1997).",
    },
    cite: ["Kepler (1619/1997)"],
    see: { room: "orbit", vi: "Mở phòng Quỹ đạo", en: "Open the Orbit room" },
  },
  {
    id: "tinbergen",
    q: { vi: "Tinbergen đưa mô hình trọng lực vào thương mại như thế nào?", en: "How did Tinbergen bring gravity into trade?" },
    keys: "tinbergen 1962 thuong mai trade GDP quy mo kinh te size gamma uoc luong estimated nobel 1969 frisch 1903 1994 ha lan dutch",
    a: {
      vi: "Tinbergen (1962) thay khối lượng bằng quy mô kinh tế (GDP) và để số mũ của khoảng cách được ước lượng thay vì khóa ở 2: T = G·YᵢYⱼ/Dᵞ. Thương mại song phương tăng theo quy mô hai nước và giảm theo khoảng cách. Tinbergen (1903–1994) là nhà kinh tế học Hà Lan; năm 1969 ông cùng Ragnar Frisch nhận giải Nobel Kinh tế đầu tiên.",
      en: "Tinbergen (1962) replaced mass with economic size (GDP) and let the distance exponent be estimated rather than fixed at 2: T = G·YᵢYⱼ/Dᵞ. Bilateral trade rises with the size of the two economies and falls with distance. Tinbergen (1903–1994) was a Dutch economist; in 1969 he shared the first Nobel Memorial Prize in Economic Sciences with Ragnar Frisch.",
    },
    cite: ["Tinbergen (1962)"],
    see: { room: "trade", vi: "Mở phòng Thương mại", en: "Open the Trade room" },
  },
  {
    id: "log-linear",
    q: { vi: "Vì sao lấy log hai vế của phương trình trọng lực?", en: "Why take logs of the gravity equation?" },
    keys: "log linear tuyen tinh hoa ln logarit OLS hoi quy regression he so do co elasticity",
    a: {
      vi: "Lấy log biến tích thành tổng: ln T = β₀ + β₁ ln Yᵢ + β₂ ln Yⱼ − γ ln D + ε, nên ước lượng được bằng OLS và mỗi hệ số đọc như một độ co giãn. Cái giá: log của 0 không xác định, và khi phương sai thay đổi thì OLS trên log bị chệch (Santos Silva & Tenreyro, 2006).",
      en: "Logs turn the product into a sum: ln T = β₀ + β₁ ln Yᵢ + β₂ ln Yⱼ − γ ln D + ε, so OLS can estimate it and each coefficient reads as an elasticity. The cost: the log of zero is undefined, and under heteroskedasticity OLS on logs is biased (Santos Silva & Tenreyro, 2006).",
    },
    cite: ["Tinbergen (1962)", "Santos Silva & Tenreyro (2006)"],
  },
  {
    id: "elasticity",
    q: { vi: "Đọc hệ số khoảng cách β = −0,38 như thế nào?", en: "How do I read a distance coefficient of β = −0.38?" },
    keys: "doc he so interpret coefficient do co gian elasticity 10% xa hon farther 3.6% 1.1 mu beta -0.38 phan tram percent",
    a: {
      vi: "β là độ co giãn: xa hơn 1% đi kèm FDI thay đổi khoảng β%. Với mức thay đổi lớn hơn, dùng công thức chính xác (1,1)^β − 1: xa hơn 10% thì FDI thấp hơn khoảng 1,1^(−0,38) − 1 ≈ −3,6%. Đây là liên hệ trung bình, chưa phải kết quả cho một cặp nước cụ thể.",
      en: "β is an elasticity: 1% farther goes with roughly β% change in FDI. For bigger changes use the exact form (1.1)^β − 1: 10% farther gives about 1.1^(−0.38) − 1 ≈ −3.6% FDI. It is an average association, not a result for a particular pair of countries.",
    },
    cite: ["Phan & Do (2019)"],
    see: { room: "lab", panel: "sim", vi: "Mở Tác động", en: "Open Impact" },
  },
  {
    id: "dummy-effect",
    q: { vi: "Đọc hệ số của biến giả (như FTA, RTA) ra phần trăm thế nào?", en: "How do I turn a dummy coefficient (FTA, RTA) into a percentage?" },
    keys: "bien gia dummy indicator fta rta hiep dinh thuong mai agreement e mu exp phan tram percent (e^b - 1) x 100",
    a: {
      vi: "Với biến giả, tác động phần trăm là (e^β − 1) × 100. Ví dụ hệ số RTA 0,557 trong Yotov và cộng sự (2016) nghĩa là thương mại cao hơn khoảng (e^0,557 − 1) × 100 ≈ 75%. Trong mô hình 8 của Phan và Do (2019), hệ số FTA 1,01 cho mức ngắn hạn khoảng +174,6%.",
      en: "For a dummy, the percentage effect is (e^β − 1) × 100. For example, an RTA coefficient of 0.557 in Yotov et al. (2016) means trade about (e^0.557 − 1) × 100 ≈ 75% higher. In Model 8 of Phan and Do (2019), the FTA coefficient of 1.01 gives about +174.6% in the short run.",
    },
    cite: ["Yotov et al. (2016)", "Phan & Do (2019)"],
  },
  {
    id: "phan-do-2019",
    q: { vi: "Bài Phan và Do (2019) tìm ra điều gì?", en: "What did Phan and Do (2019) find?" },
    keys: "ket qua results findings tim ra phan do 2019 phan anh tu do thuy huong fdi viet nam vietnam 16 doi tac partners 2006 2015 khoang cach dia ly geographic distance -0.38 mo hinh 8 model random effects hieu ung ngau nhien",
    a: {
      vi: "Bài dùng 16 nước đối tác, giai đoạn 2006–2015, tám mô hình hiệu ứng ngẫu nhiên. Khoảng cách địa lý chưa có ý nghĩa ở mô hình 3 (−0,14) nhưng từ mô hình 4 trở đi giữ quanh −0,38 và có ý nghĩa. Ở mô hình 8: vốn FDI năm trước 0,45, FTA 1,01, khoảng cách kinh tế 0,33, đều có ý nghĩa thống kê.",
      en: "The paper uses 16 partner countries over 2006–2015 and eight random-effects models. Geographic distance is not significant in Model 3 (−0.14) but from Model 4 on it holds near −0.38 and is significant. In Model 8: last year's FDI 0.45, FTA 1.01, economic distance 0.33, all statistically significant.",
    },
    cite: ["Phan & Do (2019)"],
    see: { room: "lab", panel: "coef", vi: "Mở Hệ số 2019", en: "Open 2019 coefficients" },
  },
  {
    id: "fta-long-run",
    q: { vi: "Vì sao tác động dài hạn của FTA lớn hơn ngắn hạn?", en: "Why is the long-run FTA effect larger than the short-run one?" },
    keys: "dai han ngan han long run short run fta 527 174 von nam truoc lagged fdi 0.45 1 - 0.45 dong dynamic",
    a: {
      vi: "Mô hình có FDI năm trước với hệ số 0,45: vốn hôm nay kéo theo vốn năm sau. Tác động dài hạn của FTA là hệ số chia cho (1 − 0,45): 1,01/0,55 ≈ 1,84, tức khoảng +527,4%, so với khoảng +174,6% ở năm đầu (Phan & Do, 2019, mô hình 8).",
      en: "The model includes last year's FDI with a coefficient of 0.45: capital today pulls in capital next year. The long-run FTA effect is the coefficient divided by (1 − 0.45): 1.01/0.55 ≈ 1.84, about +527.4%, against about +174.6% in the first year (Phan & Do, 2019, Model 8).",
    },
    cite: ["Phan & Do (2019)"],
    see: { room: "lab", panel: "sim", vi: "Mở Tác động", en: "Open Impact" },
  },
  {
    id: "ppml",
    q: { vi: "PPML là gì và vì sao nên dùng thay OLS?", en: "What is PPML and why use it instead of OLS?" },
    keys: "ppml poisson pseudo maximum likelihood ols so 0 zero flows phuong sai thay doi heteroskedasticity jensen santos silva tenreyro log of gravity",
    a: {
      vi: "PPML ước lượng mô hình ở dạng nhân, trên giá trị gốc chứ không trên log. Nó giữ được các quan sát bằng 0 mà OLS trên log phải bỏ, và vẫn nhất quán khi phương sai thay đổi; còn OLS trên log khi đó cho hệ số chệch, không nhất quán (Santos Silva & Tenreyro, 2006). Sách của WTO/UNCTAD khuyến nghị dùng PPML (Yotov và cộng sự, 2016).",
      en: "PPML estimates the model in multiplicative form, on levels rather than logs. It keeps the zero observations that OLS on logs must drop, and stays consistent under heteroskedasticity, where OLS on logs gives biased, inconsistent coefficients (Santos Silva & Tenreyro, 2006). The WTO/UNCTAD guide recommends PPML (Yotov et al., 2016).",
    },
    cite: ["Santos Silva & Tenreyro (2006)", "Yotov et al. (2016)"],
    see: { room: "lab", panel: "ppml", vi: "Mở Vì sao PPML", en: "Open Why PPML" },
  },
  {
    id: "zeros",
    q: { vi: "Xử lý các năm FDI bằng 0 thế nào? Cộng thêm 1 trước khi lấy log có được không?", en: "How should zero FDI years be handled? Can I add 1 before taking logs?" },
    keys: "so 0 zero cong 1 add one log(0) bo quan sat drop tobit heckman ppml",
    a: {
      vi: "Bỏ quan sát bằng 0 chỉ đúng khi các số 0 xuất hiện ngẫu nhiên. Cộng một hằng số nhỏ rồi lấy log là cách vá tùy tiện: kết quả phụ thuộc đơn vị đo và hệ số không còn là độ co giãn. Cách gọn nhất là PPML trên giá trị gốc (Bacchetta và cộng sự, 2012; Yotov và cộng sự, 2016).",
      en: "Dropping zeros is only correct if they occur at random. Adding a small constant before logs is an arbitrary patch: results depend on the units and the coefficients stop being elasticities. The simplest fix is PPML on levels (Bacchetta et al., 2012; Yotov et al., 2016).",
    },
    cite: ["Bacchetta et al. (2012)", "Yotov et al. (2016)"],
    see: { room: "lab", panel: "ppml", vi: "Mở Vì sao PPML", en: "Open Why PPML" },
  },
  {
    id: "mrt",
    q: { vi: "Lực cản đa phương là gì?", en: "What is multilateral resistance?" },
    keys: "luc can da phuong multilateral resistance anderson van wincoop 2003 gravitas pi P chi phi thuong mai tuong doi relative trade costs",
    a: {
      vi: "Thương mại giữa hai nước không chỉ phụ thuộc chi phí giữa hai nước đó mà còn phụ thuộc chi phí của mỗi nước với mọi nước còn lại. Anderson và van Wincoop (2003) gọi đó là lực cản đa phương Πᵢ và Pⱼ: Xᵢⱼ = (YᵢYⱼ/Y)·(tᵢⱼ/ΠᵢPⱼ)^(1−σ). Bỏ qua chúng là sai lầm “huy chương vàng”.",
      en: "Trade between two countries depends not only on the costs between them but on each country's costs with everyone else. Anderson and van Wincoop (2003) call these multilateral resistance terms Πᵢ and Pⱼ: Xᵢⱼ = (YᵢYⱼ/Y)·(tᵢⱼ/ΠᵢPⱼ)^(1−σ). Leaving them out is the “gold medal” mistake.",
    },
    cite: ["Anderson & van Wincoop (2003)", "Bacchetta et al. (2012)"],
  },
  {
    id: "medals",
    q: { vi: "Ba “huy chương” sai lầm khi ước lượng mô hình trọng lực là gì?", en: "What are the three “medal” mistakes in gravity estimation?" },
    keys: "huy chuong vang bac dong gold silver bronze medal mistake sai lam baldwin taglioni wto unctad practical guide",
    a: {
      vi: "Vàng: dùng GDP mà bỏ quên lực cản đa phương, vốn tương quan với chi phí thương mại nên hệ số bị chệch. Bạc: lấy trung bình hai chiều thương mại thay vì để riêng từng chiều. Đồng: giảm phát bằng chỉ số giá của Mỹ. Đưa hiệu ứng cố định nước xuất khẩu và nhập khẩu vào là tránh được vàng, và khi đó cũng không mắc đồng (Bacchetta và cộng sự, 2012).",
      en: "Gold: using GDP while omitting multilateral resistance, which is correlated with trade costs and biases the estimates. Silver: averaging the two directions of trade instead of keeping each. Bronze: deflating by the US price index. Exporter and importer fixed effects avoid the gold mistake, and then the bronze one cannot happen (Bacchetta et al., 2012).",
    },
    cite: ["Bacchetta et al. (2012)"],
    see: { room: "story", vi: "Mở Câu chuyện, chương 2012", en: "Open the Story, 2012 chapter" },
  },
  {
    id: "fixed-effects",
    q: { vi: "Nên dùng hiệu ứng cố định nào trong mô hình trọng lực?", en: "Which fixed effects should a gravity model use?" },
    keys: "hieu ung co dinh fixed effects exporter importer time year pair cap nuoc structural gravity yotov khuyen nghi recommendations panel du lieu bang",
    a: {
      vi: "Với dữ liệu bảng, Yotov và cộng sự (2016) khuyến nghị: hiệu ứng cố định nước xuất khẩu–năm và nước nhập khẩu–năm để kiểm soát lực cản đa phương (chúng hấp thụ luôn GDP), cộng hiệu ứng cố định theo cặp nước để kiểm soát mọi chi phí song phương không đổi theo thời gian và tính nội sinh của hiệp định thương mại. Ước lượng bằng PPML, sai số chuẩn cụm theo cặp.",
      en: "With panel data, Yotov et al. (2016) recommend exporter-year and importer-year fixed effects to control for multilateral resistance (they also absorb GDP), plus country-pair fixed effects for all time-invariant bilateral costs and the endogeneity of trade agreements. Estimate with PPML and cluster standard errors by pair.",
    },
    cite: ["Yotov et al. (2016)"],
    see: { room: "story", vi: "Mở Câu chuyện, chương 2016", en: "Open the Story, 2016 chapter" },
  },
  {
    id: "pair-fe-distance",
    q: { vi: "Vì sao có hiệu ứng cố định theo cặp thì không ước lượng được khoảng cách?", en: "Why can't distance be estimated with pair fixed effects?" },
    keys: "khoang cach khong doi theo thoi gian time invariant distance absorbed hap thu cong tuyen collinearity pair fixed effects hai buoc two stage majumdar basu",
    a: {
      vi: "Khoảng cách không đổi theo thời gian nên trùng hoàn toàn với hiệu ứng cố định theo cặp (cộng tuyến hoàn hảo) và bị hấp thụ. Muốn có hệ số khoảng cách, có thể hồi quy các hiệu ứng cố định theo cặp đã ước lượng lên khoảng cách ở bước thứ hai (Yotov và cộng sự, 2016). Majumdar và Basu (2023) gặp đúng vấn đề này.",
      en: "Distance does not change over time, so it is perfectly collinear with pair fixed effects and is absorbed. To get a distance coefficient, regress the estimated pair fixed effects on distance in a second step (Yotov et al., 2016). Majumdar and Basu (2023) run into exactly this.",
    },
    cite: ["Yotov et al. (2016)", "Majumdar & Basu (2023)"],
  },
  {
    id: "distance-puzzle",
    q: { vi: "“Câu đố khoảng cách” là gì và được giải thế nào?", en: "What is the “distance puzzle” and how is it solved?" },
    keys: "cau do khoang cach distance puzzle toan cau hoa globalisation thuong mai noi dia intra national trade 7.95 10.97 1986 2006",
    a: {
      vi: "Toàn cầu hóa lẽ ra làm khoảng cách bớt quan trọng, nhưng OLS chỉ với thương mại quốc tế cho thấy tác động của khoảng cách mạnh lên 7,95% từ 1986 đến 2006. Khi thêm thương mại nội địa và dùng PPML, tác động ấy giảm 10,97%: câu đố được giải (Yotov và cộng sự, 2016, Bảng 2; 69 nước, hàng chế tạo).",
      en: "Globalisation should make distance matter less, yet OLS on international trade alone shows the distance effect growing by 7.95% from 1986 to 2006. With intra-national trade and PPML it falls by 10.97%: the puzzle is solved (Yotov et al., 2016, Table 2; 69 countries, manufacturing).",
    },
    cite: ["Yotov et al. (2016)"],
    see: { room: "story", vi: "Mở Câu chuyện, chương 2016", en: "Open the Story, 2016 chapter" },
  },
  {
    id: "disdier-head",
    q: { vi: "Hệ số khoảng cách của thương mại thường bằng bao nhiêu?", en: "How large is the usual distance coefficient for trade?" },
    keys: "disdier head 2008 meta analysis phan tich tong hop distance elasticity 0.9 -1 trung binh average",
    a: {
      vi: "Phân tích tổng hợp của Disdier và Head (2008) trên 1.467 ước lượng từ 103 bài cho thấy hệ số khoảng cách của thương mại trung bình gần 0,9 (về độ lớn); giá trị chuẩn thường dùng là −1. Với FDI vào Việt Nam, Phan và Do (2019) tìm được khoảng −0,38, nhỏ hơn nhiều.",
      en: "Disdier and Head's (2008) meta-analysis of 1,467 estimates from 103 papers puts the trade distance coefficient near 0.9 in size on average; −1 is the usual benchmark. For FDI into Vietnam, Phan and Do (2019) find about −0.38, much smaller.",
    },
    cite: ["Disdier & Head (2008)", "Yotov et al. (2016)", "Phan & Do (2019)"],
  },
  {
    id: "xuan-xing",
    q: { vi: "Dữ liệu Xuan và Xing (2008) trong app dùng để làm gì?", en: "What is the Xuan and Xing (2008) data used for in the app?" },
    keys: "xuan xing 2008 du lieu mau sample data fdi thuc hien realised 1990 2004 nam bang 0 zero years",
    a: {
      vi: "Xuan và Xing (2008) công bố FDI thực hiện vào Việt Nam theo nước nguồn, 1990–2004. App dùng bảng này làm dữ liệu mẫu: có nhiều năm bằng 0, nên thấy rõ OLS trên log phải bỏ quan sát còn PPML giữ cả mẫu. Bấm “Nạp bảng Xuan & Xing” trong mục Dữ liệu của bạn.",
      en: "Xuan and Xing (2008) report realised FDI into Vietnam by source country, 1990–2004. The app uses this table as sample data: it has many zero years, so you can see OLS on logs dropping observations while PPML keeps the whole sample. Press “Load the Xuan & Xing table” under Your data.",
    },
    cite: ["Xuan & Xing (2008)"],
    see: { room: "lab", panel: "data", vi: "Mở Dữ liệu của bạn", en: "Open Your data" },
  },
  {
    id: "upload",
    q: { vi: "Tải dữ liệu của mình lên để ước lượng thế nào?", en: "How do I upload my own data to estimate?" },
    keys: "tai len upload csv du lieu cua ban your data mau template stata export delimited cot column uoc luong estimate quoc gia nam country year",
    a: {
      vi: "Vào FDI → Dữ liệu của bạn. Chuẩn bị tệp CSV (dấu phẩy hoặc chấm phẩy), mỗi dòng một cặp nước–năm; có thể tải mẫu bằng nút “Tải tệp mẫu”. Chọn biến phụ thuộc, cột nước, cột năm, các biến giải thích rồi bấm Ước lượng. Nếu FDI ở dạng mức, app chạy cả OLS trên log và PPML. Tệp chỉ được đọc trên máy của bạn, không gửi đi đâu.",
      en: "Go to FDI → Your data. Prepare a CSV file (comma or semicolon), one row per country–year pair; “Download template” gives a sample. Choose the dependent variable, country column, year column and explanatory variables, then press Estimate. If FDI is in levels, the app runs both OLS on logs and PPML. The file is read only on your device and sent nowhere.",
    },
    cite: [],
    see: { room: "lab", panel: "data", vi: "Mở Dữ liệu của bạn", en: "Open Your data" },
  },
  {
    id: "stars",
    q: { vi: "Dấu sao và số trong ngoặc ở bảng kết quả nghĩa là gì?", en: "What do the stars and the numbers in brackets mean in the results table?" },
    keys: "dau sao stars p value y nghia thong ke significance sai so chuan standard error ngoac parentheses cum cluster robust",
    a: {
      vi: "Số trong ngoặc là sai số chuẩn. Dấu sao theo p-value hai phía: * p < 0,10; ** p < 0,05; *** p < 0,01. Nên dùng sai số chuẩn vững, và với dữ liệu bảng thì cụm theo nước hoặc theo cặp (Bacchetta và cộng sự, 2012; Yotov và cộng sự, 2016).",
      en: "The numbers in brackets are standard errors. Stars follow two-sided p-values: * p < 0.10; ** p < 0.05; *** p < 0.01. Use robust standard errors, and with panel data cluster them by country or by pair (Bacchetta et al., 2012; Yotov et al., 2016).",
    },
    cite: ["Bacchetta et al. (2012)", "Yotov et al. (2016)"],
  },
  {
    id: "majumdar",
    q: { vi: "Tỷ giá bất định ảnh hưởng thế nào đến thương mại trong mô hình trọng lực?", en: "How does exchange-rate uncertainty affect trade in a gravity model?" },
    keys: "ty gia bat dinh exchange rate uncertainty volatility majumdar basu 2023 an do india saarc rer ty gia thuc",
    a: {
      vi: "Majumdar và Basu (2023) thêm chỉ số bất định tỷ giá (độ lệch chuẩn của thay đổi log tỷ giá thực) vào phương trình trọng lực cho thương mại của Ấn Độ, 2000–2018. Bất định làm giảm thương mại nguyên liệu nông nghiệp với các nước SAARC, nhưng đi kèm thương mại lớn hơn với năm đối tác lớn, nơi thị trường phòng ngừa rủi ro phát triển hơn.",
      en: "Majumdar and Basu (2023) add an exchange-rate uncertainty index (the standard deviation of changes in the log real exchange rate) to the gravity equation for India's trade, 2000–2018. Uncertainty reduces trade in agricultural raw materials with SAARC partners but goes with more trade with the top five partners, where hedging markets are deeper.",
    },
    cite: ["Majumdar & Basu (2023)"],
    see: { room: "story", vi: "Mở Câu chuyện, chương 2023", en: "Open the Story, 2023 chapter" },
  },
  {
    id: "fdi-quality",
    q: { vi: "FDI vào Việt Nam tăng có nghĩa là Việt Nam giữ lại nhiều giá trị hơn không?", en: "Does more FDI mean Vietnam keeps more value?" },
    keys: "chat luong fdi quality quantity gia tri gia tang noi dia nuoc ngoai domestic foreign value added dva fva tiva oecd pathak hinrich 0.79 0.64",
    a: {
      vi: "Chưa chắc. Theo số liệu OECD TiVA do Pathak (2026) tổng hợp, 2017–2022 giá trị gia tăng nội địa trong xuất khẩu của Việt Nam tăng 50,6% nhưng giá trị gia tăng nước ngoài tăng 86,3%, nên tỷ lệ nội địa/nước ngoài giảm từ 0,79 xuống 0,64. Mô hình trọng lực giải thích vốn đến bao nhiêu, không cho biết giá trị giữ lại bao nhiêu.",
      en: "Not necessarily. In OECD TiVA data compiled by Pathak (2026), the domestic value added in Vietnam's exports rose 50.6% over 2017–2022 but foreign value added rose 86.3%, so the domestic-to-foreign ratio fell from 0.79 to 0.64. The gravity model explains how much capital arrives, not how much value is kept.",
    },
    cite: ["Pathak (2026)"],
    see: { room: "story", vi: "Mở Câu chuyện, chương 2025–2026", en: "Open the Story, 2025–2026 chapter" },
  },
  {
    id: "fdi-2025",
    q: { vi: "FDI đăng ký vào Việt Nam năm 2025 là bao nhiêu và từ đâu?", en: "How much FDI was registered in Vietnam in 2025, and from where?" },
    keys: "fdi 2025 dang ky registered 12.4 ty usd singapore trung quoc china hong kong pwc nguon von source thuc hien disbursed",
    a: {
      vi: "Chín tháng đầu năm 2025, vốn FDI đăng ký mới khoảng 12,4 tỷ USD, giảm khoảng 8,6% so với cùng kỳ; Singapore khoảng 28%, Trung Quốc 23%, Hồng Kông 9% (PwC Việt Nam, 2025). Đây là vốn đăng ký, không phải vốn thực hiện, nên không dùng thay cho số liệu FDI thực hiện trong hồi quy.",
      en: "In the first nine months of 2025, newly registered FDI was about USD 12.4 billion, down about 8.6% year on year; Singapore about 28%, China 23%, Hong Kong 9% (PwC Vietnam, 2025). These are registered, not disbursed, figures, so they should not stand in for realised FDI in a regression.",
    },
    cite: ["PwC Vietnam (2025)"],
  },
  {
    id: "rooms",
    q: { vi: "App có những phòng nào và nên học theo thứ tự nào?", en: "What rooms does the app have, and in what order should I use them?" },
    keys: "phong room huong dan guide bat dau start thu tu order cau chuyen story nhan vat cast quy dao orbit thuong mai trade fdi",
    a: {
      vi: "Câu chuyện: dòng thời gian từ 1665 đến nay. Nhân vật: mỗi bạn giữ một con số của bài học. Quỹ đạo: mô phỏng lực hấp dẫn Newton. Thương mại: mô hình Tinbergen trên bản đồ thế giới, mặt phẳng hoặc quả cầu. FDI: hệ số 2019, mô phỏng tác động, vì sao PPML, và ước lượng trên dữ liệu của bạn. Nên đi theo đúng thứ tự đó: bầu trời trước, rồi mới đến vốn.",
      en: "Story: a timeline from 1665 to today. Cast: each character holds one number of the lesson. Orbit: Newtonian gravity simulator. Trade: Tinbergen's model on a world map, a plane or a globe. FDI: the 2019 coefficients, the impact simulator, why PPML, and estimation on your data. Go in that order: the sky first, then capital.",
    },
    cite: [],
    see: { room: "story", vi: "Mở Câu chuyện", en: "Open the Story" },
  },
  {
    id: "gravity-overview",
    q: { vi: "Mô hình trọng lực trong kinh tế là gì?", en: "What is the gravity model in economics?" },
    keys: "mo hinh trong luc gravity model tong quan overview kinh te economics y tuong idea thuong mai fdi dong von",
    a: {
      vi: "Mô hình trọng lực mượn dạng định luật Newton: dòng chảy giữa hai nước (thương mại hoặc FDI) tăng theo quy mô kinh tế của hai nước và giảm theo khoảng cách cùng các chi phí khác. Tinbergen (1962) đưa nó vào thương mại; Anderson và van Wincoop (2003) bổ sung lực cản đa phương; ngày nay thường ước lượng bằng PPML với hiệu ứng cố định (Yotov và cộng sự, 2016). App đi đúng chặng đường đó: Quỹ đạo → Thương mại → FDI.",
      en: "The gravity model borrows the form of Newton's law: the flow between two countries (trade or FDI) rises with their economic size and falls with distance and other costs. Tinbergen (1962) brought it to trade; Anderson and van Wincoop (2003) added multilateral resistance; today it is usually estimated by PPML with fixed effects (Yotov et al., 2016). The app follows that path: Orbit → Trade → FDI.",
    },
    cite: ["Tinbergen (1962)", "Anderson & van Wincoop (2003)", "Yotov et al. (2016)"],
    see: { room: "story", vi: "Mở Câu chuyện", en: "Open the Story" },
  },
  {
    id: "ols",
    q: { vi: "OLS là gì và dùng trong mô hình trọng lực thế nào?", en: "What is OLS and how is it used in gravity models?" },
    keys: "ols binh phuong nho nhat thong thuong ordinary least squares hoi quy tuyen tinh linear regression log",
    a: {
      vi: "OLS (bình phương nhỏ nhất thông thường) chọn hệ số sao cho tổng bình phương sai số nhỏ nhất. Với mô hình trọng lực, OLS chạy trên dạng log, nên phải bỏ các quan sát bằng 0 và cho hệ số chệch khi phương sai thay đổi (Santos Silva & Tenreyro, 2006). Trong mục Dữ liệu của bạn, app chạy OLS trên log song song với PPML để bạn so sánh.",
      en: "OLS (ordinary least squares) picks the coefficients that minimise the sum of squared errors. For gravity it runs on the log form, so it must drop zero observations and gives biased coefficients under heteroskedasticity (Santos Silva & Tenreyro, 2006). Under Your data, the app runs OLS on logs side by side with PPML so you can compare.",
    },
    cite: ["Santos Silva & Tenreyro (2006)"],
    see: { room: "lab", panel: "data", vi: "Mở Dữ liệu của bạn", en: "Open Your data" },
  },
  {
    id: "re-fe",
    q: { vi: "Hiệu ứng ngẫu nhiên và hiệu ứng cố định khác nhau thế nào? Kiểm định Hausman để làm gì?", en: "How do random and fixed effects differ, and what is the Hausman test for?" },
    keys: "hieu ung ngau nhien random effects rem hieu ung co dinh fixed effects fem hausman kiem dinh test du lieu bang panel khong doi theo thoi gian",
    a: {
      vi: "Hiệu ứng cố định cho mỗi nước (hoặc cặp nước) một hằng số riêng, nên loại được mọi yếu tố không đổi theo thời gian, nhưng vì thế không ước lượng được các biến không đổi như khoảng cách. Hiệu ứng ngẫu nhiên giữ được các biến đó, với giả định phần riêng của mỗi nước không tương quan với các biến giải thích. Kiểm định Hausman so sánh hai cách để xem giả định ấy có đứng được không (Bacchetta và cộng sự, 2012). Phan và Do (2019) dùng hiệu ứng ngẫu nhiên, nhờ vậy ước lượng được hệ số khoảng cách.",
      en: "Fixed effects give each country (or pair) its own constant, removing everything that does not change over time, which is why time-invariant variables such as distance cannot be estimated. Random effects keep those variables, assuming each country's own component is uncorrelated with the regressors. The Hausman test compares the two to check that assumption (Bacchetta et al., 2012). Phan and Do (2019) use random effects, which is how they estimate a distance coefficient.",
    },
    cite: ["Bacchetta et al. (2012)", "Phan & Do (2019)"],
  },
  {
    id: "r2",
    q: { vi: "R² và pseudo-R² trong bảng kết quả nghĩa là gì?", en: "What do R² and pseudo-R² in the results table mean?" },
    keys: "rsquared r2 pseudo muc do giai thich goodness of fit tuong quan correlation",
    a: {
      vi: "Với OLS, R² là tỷ lệ biến động của log FDI được mô hình giải thích. Với PPML, app báo pseudo-R²: bình phương hệ số tương quan giữa FDI thực tế và FDI dự báo. Hai con số không so sánh trực tiếp được, và R² cao không có nghĩa dạng hàm đúng: Yotov và cộng sự (2016) dùng kiểm định RESET, và chỉ PPML qua được kiểm định này trong dữ liệu của họ.",
      en: "For OLS, R² is the share of the variation in log FDI that the model explains. For PPML, the app reports a pseudo-R²: the squared correlation between actual and predicted FDI. The two are not directly comparable, and a high R² does not mean the functional form is right: Yotov et al. (2016) use the RESET test, and only PPML passes it in their data.",
    },
    cite: ["Santos Silva & Tenreyro (2006)", "Yotov et al. (2016)"],
  },
  {
    id: "pd-variables",
    q: { vi: "Những biến khác trong mô hình 8 của Phan và Do (2019) có ý nghĩa thống kê không?", en: "Are the other variables in Phan and Do's (2019) Model 8 significant?" },
    keys: "khoang cach the che institutional van hoa cultural kinh te economic do mo thuong mai openness tham nhung corruption kinh nghiem experience quy mo thi truong market size gdp bien kiem soat controls",
    a: {
      vi: "Ở mô hình 8 (Phan & Do, 2019): khoảng cách kinh tế 0,33 và kinh nghiệm quốc tế 0,11 có ý nghĩa ở mức 5%; độ mở thương mại 2,89 cũng có ý nghĩa ở mức 5%. Khoảng cách thể chế (0,12), khoảng cách văn hóa (0,03), quy mô thị trường Việt Nam (−0,87), quy mô thị trường đối tác (−0,25) và tham nhũng (−1,54) không có ý nghĩa thống kê. Xem đầy đủ trong Hệ số 2019.",
      en: "In Model 8 (Phan & Do, 2019): economic distance 0.33 and international experience 0.11 are significant at 5%; trade openness 2.89 is also significant at 5%. Institutional distance (0.12), cultural distance (0.03), Vietnam's market size (−0.87), the partner's market size (−0.25) and corruption (−1.54) are not statistically significant. See the full table under 2019 coefficients.",
    },
    cite: ["Phan & Do (2019)"],
    see: { room: "lab", panel: "coef", vi: "Mở Hệ số 2019", en: "Open 2019 coefficients" },
  },
  {
    id: "orbit-room",
    q: { vi: "Dùng phòng Quỹ đạo thế nào?", en: "How do I use the Orbit room?" },
    keys: "phong quy dao orbit room dung cach su dung phong vat the them hanh tinh add planet keo drag launch toc do time scale vet trails hop nhat merge nay bounce boi canh scene",
    a: {
      vi: "Chạm chỗ trống rồi kéo để phóng một thiên thể; kéo một thiên thể có sẵn để đặt vận tốc. Vạch “vòng” ứng với quỹ đạo tròn, vạch “thoát” là rời hệ. Ở bảng bên chọn khối lượng khi phóng, tỷ lệ thời gian, bối cảnh có sẵn (như hệ sao đôi, trợ lực hấp dẫn), bật vệt, theo tâm, và chọn hợp nhất hay nảy khi va chạm.",
      en: "Touch empty space and drag to launch a body; drag an existing body to set its velocity. The “circular” tick gives a circular orbit, the “escape” tick leaves the system. In the side panel choose the launch mass, the time scale, a ready-made scene (such as a binary star or a gravity assist), trails, follow, and merge or bounce on collision.",
    },
    cite: [],
    see: { room: "orbit", vi: "Mở phòng Quỹ đạo", en: "Open the Orbit room" },
  },
  {
    id: "trade-room",
    q: { vi: "Dùng phòng Thương mại thế nào?", en: "How do I use the Trade room?" },
    keys: "phong thuong mai trade room ban do the gioi world map mat phang plane qua cau globe nen kinh te economy goc dong chay origin keo pan thu phong zoom gamma so mu",
    a: {
      vi: "Phòng Thương mại có ba cách xem: bản đồ thế giới (mặc định), mặt phẳng và quả cầu. Trên bản đồ, kéo để di chuyển, chụm hoặc cuộn để thu phóng; chạm một nền kinh tế để lấy đó làm gốc dòng chảy. Trên mặt phẳng, kéo một nền kinh tế để đổi khoảng cách. Thanh số mũ khoảng cách γ cho thấy dòng chảy thay đổi thế nào khi γ không còn khóa ở 2.",
      en: "The Trade room has three views: a world map (the default), a plane and a globe. On the map, drag to pan and pinch or scroll to zoom; tap an economy to make it the origin of the flows. On the plane, drag an economy to change distances. The distance exponent γ slider shows how the flows change once γ is no longer fixed at 2.",
    },
    cite: ["Tinbergen (1962)"],
    see: { room: "trade", vi: "Mở phòng Thương mại", en: "Open the Trade room" },
  },
  {
    id: "song",
    q: { vi: "App có bài hát không, nghe ở đâu?", en: "Does the app have a song, and where can I hear it?" },
    keys: "bai hat song nhac music am thanh sound tu mot qua tao roi from an apple to the stars loi lyrics nghe listen",
    a: {
      vi: "Có. Bấm nút nốt nhạc trên thanh đầu trang để mở bảng âm thanh. Bài hát có hai bản: “Từ một quả táo rơi” (tiếng Việt) và “Gravity Lab — From an Apple to the Stars” (tiếng Anh), kèm lời. Bảng này còn có nhạc nền không gian, âm thanh quỹ đạo và tần số các hành tinh.",
      en: "Yes. Press the music-note button in the header to open the sound panel. The song comes in two versions, “Từ một quả táo rơi” (Vietnamese) and “Gravity Lab — From an Apple to the Stars” (English), with lyrics. The panel also has the space ambience, orbit sonification and the planetary frequencies.",
    },
    cite: [],
  },
  {
    id: "newton-bio",
    q: { vi: "Newton sinh và mất năm nào?", en: "When was Newton born and when did he die?" },
    keys: "newton sinh mat nam nao born died tieu su biography 1642 1643 1727 woolsthorpe london dich hach plague cambridge",
    a: {
      vi: "Isaac Newton sinh ngày 25/12/1642 theo lịch cũ (4/1/1643 theo lịch mới) ở Woolsthorpe, Anh, và mất ngày 31/3/1727 ở London. Những năm dịch hạch 1665–1666, khi Cambridge đóng cửa, ông về quê và hình thành ý tưởng lực giảm theo bình phương khoảng cách (Westfall, 1980).",
      en: "Isaac Newton was born on 25 December 1642 Old Style (4 January 1643 New Style) in Woolsthorpe, England, and died on 31 March 1727 in London. In the plague years 1665–1666, with Cambridge closed, he worked at home and arrived at a force falling with the square of the distance (Westfall, 1980).",
    },
    cite: ["Westfall (1980)"],
    see: { room: "story", vi: "Mở Câu chuyện", en: "Open the Story" },
  },
  {
    id: "cite-app",
    q: { vi: "Trích dẫn Gravity Lab thế nào?", en: "How do I cite Gravity Lab?" },
    keys: "trich dan cite citation doi zenodo apa phien ban version tac gia authors",
    a: {
      vi: "Phan, A. T., & Do, T. H. (2026). Gravity Lab: A browser-based gravity-model laboratory for FDI into Vietnam [Computer software]. Zenodo. DOI chung cho mọi phiên bản: 10.5281/zenodo.23307832. Nên ghi phiên bản đã dùng; trích dẫn đầy đủ có ở cuối mỗi phòng.",
      en: "Phan, A. T., & Do, T. H. (2026). Gravity Lab: A browser-based gravity-model laboratory for FDI into Vietnam [Computer software]. Zenodo. Concept DOI for all versions: 10.5281/zenodo.23307832. Cite the version you used; the full citation is at the end of each room.",
    },
    cite: [],
  },
];
