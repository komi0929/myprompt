import Link from "next/link";

export default function Footer(): React.ReactElement {
  return (
    <footer className="mt-auto border-t border-slate-200/60 bg-white/60 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-6 py-5">
        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <Link href="/legal" className="hover:text-slate-600 transition-colors">
            利用規約
          </Link>
          <span className="text-slate-200">|</span>
          <Link href="/legal" className="hover:text-slate-600 transition-colors">
            プライバシーポリシー
          </Link>
          <span className="text-slate-200">|</span>
          <Link href="/legal" className="hover:text-slate-600 transition-colors">
            お問い合わせ
          </Link>
        </div>

        {/* Credit */}
        <div className="mt-3 flex flex-col items-center gap-1">
          <p className="text-[10px] text-slate-300">
            © {new Date().getFullYear()} 株式会社ヒトコト
          </p>
          <p className="text-[10px] text-slate-300">
            produced by{" "}
            <a
              href="https://mykanban.hitokoto.tech/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-500 hover:text-yellow-600 font-medium transition-colors"
            >
              komi
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
