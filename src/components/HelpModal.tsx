import React from 'react';
import { X, Lightbulb, Smartphone, ShieldCheck, Flame, Download } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Panduan Rahasia Algoritma Facebook Page 2026</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-blue-200 mb-1">
                1. Kenapa Rasio 4:5 (1080x1350) Merupakan Raja Feed FB Mobile?
              </h4>
              <p>
                Lebih dari 94% pengguna Facebook mengakses via smartphone. Rasio 4:5 mengisi 80% layar vertikal pengguna saat scrolling, membuat pengguna menghabiskan waktu pandang (dwell time) lebih lama dibandingkan foto 1:1 atau 16:9. Algoritma Facebook mengukur dwell time sebagai sinyal minat utama untuk melipatgandakan jangkauan organik.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3">
            <Flame className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-purple-200 mb-1">
                2. Algoritma Komentar &amp; CTA Interaktif
              </h4>
              <p>
                Di Facebook, 1 komentar bernilai bobot distribusi 5x lebih tinggi daripada 1 like jempol. Generator caption AI kami dirancang khusus menyertakan hook yang memicu rasa penasaran serta pertanyaan pancingan di akhir teks, memaksa audiens untuk mengetikkan pendapat mereka di kolom komentar.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-200 mb-1">
                3. Filter Standar Komunitas Facebook
              </h4>
              <p>
                Pelanggaran seperti konten terlalu vulgar, kekerasan, atau clickbait palsu dapat menyebabkan status halaman terkena &apos;Page Quality Yellow / Red Flag&apos; atau shadowban. Fitur moderasi otomatis menyaring gambar berisiko tinggi sebelum dipublikasikan.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Download className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-slate-200 mb-1">
                4. File manifest.csv di Dalam ZIP
              </h4>
              <p>
                File ZIP hasil unduhan memisahkan foto ke dalam folder rasio masing-masing (contoh: <code>4x5/</code>, <code>1x1/</code>). File <code>manifest.csv</code> menyertakan nama file, skor viralitas, caption bahasa Indonesia &amp; Inggris, dan hashtag yang siap diimpor ke Meta Business Suite atau tool penjadwalan.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-teal-200 mb-1">
                5. 100% Free Tier &amp; Proteksi Anti-Rate Limit 429
              </h4>
              <p>
                Aplikasi ini 100% bebas biaya: menggunakan <strong>Gemini 3.8 Flash</strong> untuk teks/prompt dan <strong>Pollinations AI</strong> untuk visual tanpa model berbayar. Antrean dilengkapi jeda 5 detik otomatis antar-request agar aman dari batasan rate limit (429) Free Tier, serta tombol &apos;Coba Lagi&apos; yang ramah pengguna jika terjadi kendala jaringan.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
          >
            Paham, Mari Mulai!
          </button>
        </div>
      </div>
    </div>
  );
};
