import { Terminal } from 'lucide-react';

export default function About() {
  return (
    <section className="py-20 bg-surface-dim relative border-y border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="border border-outline-variant/30 bg-surface-container p-8 md:p-12 relative overflow-hidden laser-scan-effect">
          <div className="max-w-3xl space-y-4">
            <span className="font-mono text-xs text-primary-container uppercase tracking-widest block font-semibold">
              Sứ mệnh Cuộc thi
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight font-sans">
              KIẾN TẠO SỰ SÁNG TẠO
            </h2>
            <p className="text-on-surface-variant text-base leading-relaxed font-sans">
              SEAL Hackathon là cuộc thi lập trình hàng đầu tại Đại học FPT, quy tụ những tài năng công nghệ xuất sắc nhất để giải quyết các thách thức thực tế thông qua sự sáng tạo và dòng code. Chúng tôi chuẩn bị nền tảng, bạn lập trình giải pháp. Trong vòng 48 giờ đầy thử thách, các đội thi sẽ biến các ý tưởng trừu tượng thành các sản phẩm thực tế định hình tương lai.
            </p>
          </div>
          <div className="absolute top-6 right-6 text-primary-container/20 hidden lg:block">
            <Terminal size={72} />
          </div>
        </div>
      </div>
    </section>
  );
}
