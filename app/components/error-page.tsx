import { Link } from "react-router";
import { ArrowLeft, WarningCircle, HandSoap, Gear } from "@phosphor-icons/react";

export function ErrorPage({ status, message }: { status: number; message: string }) {
  const config = {
    404: {
      title: "Halaman Hilang.",
      desc: "Mungkin sudah dihapus atau kamu salah mengetik URL.",
      icon: <WarningCircle size={48} weight="duotone" className="text-gray-500" />,
    },
    403: {
      title: "Akses Ditolak.",
      desc: "Kamu tidak punya izin untuk melihat halaman rahasia ini.",
      icon: <HandSoap size={48} weight="duotone" className="text-rose-500" />,
    },
    500: {
      title: "Sistem Error.",
      desc: "Ada masalah di server kami. Coba muat ulang nanti.",
      icon: <Gear size={48} weight="duotone" className="text-blue-500" />,
    },
  }[status as 404 | 403 | 500] || {
    title: "Oops!",
    desc: "Terjadi kesalahan yang tidak terduga.",
    icon: <WarningCircle size={48} weight="duotone" />,
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/10">{config.icon}</div>

      <h1 className="text-6xl md:text-8xl font-medium tracking-tighter text-white mb-4">{status}</h1>

      <h2 className="text-2xl md:text-3xl font-medium text-gray-200 mb-4 italic">{config.title}</h2>

      <p className="text-gray-500 max-w-[40ch] leading-relaxed mb-10">{message || config.desc}</p>

      <Link to="/" className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium transition-transform hover:scale-105 active:scale-95">
        <ArrowLeft weight="bold" /> Kembali ke Beranda
      </Link>
    </div>
  );
}
