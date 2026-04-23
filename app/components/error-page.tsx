import { Link } from "react-router";

export function ErrorPage({ status, message }: { status: number; message: string }) {
  const config = {
    404: {
      title: "Halaman Hilang.",
      desc: "Mungkin sudah dihapus atau kamu salah mengetik URL.",
    },
    403: {
      title: "Akses Ditolak.",
      desc: "Kamu tidak punya izin untuk melihat halaman rahasia ini.",
    },
    500: {
      title: "Sistem Error.",
      desc: "Ada masalah di server kami. Coba muat ulang nanti.",
    },
  }[status as 404 | 403 | 500] || {
    title: "Terjadi Kesalahan.",
    desc: "Sistem mendeteksi kesalahan yang tidak terduga.",
  };

  return (
    <div className="flex flex-col items-start justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-lg">
      <div className="flex items-baseline gap-4 mb-6">
        <h1 className="text-5xl md:text-7xl font-medium tracking-tighter text-white">{status}</h1>
        <div className="h-8 md:h-10 w-[1px] bg-white/20 hidden md:block"></div>
        <h2 className="text-xl md:text-3xl font-medium text-gray-300 tracking-tight">{config.title}</h2>
      </div>

      <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-10">{message || config.desc}</p>

      <Link to="/" className="text-xs font-mono tracking-widest uppercase text-gray-400 hover:text-white border-b border-transparent hover:border-white/50 transition-all pb-1">
        ← Kembali ke Beranda
      </Link>
    </div>
  );
}
