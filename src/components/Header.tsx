import Link from 'next/link';

export default function Header() {
    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-10 py-3">
            <div className="max-w-[1280px] mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4 text-gray-900">
                    <div className="size-8 text-[#137fec] flex items-center justify-center bg-[#137fec]/10 rounded-lg">
                        <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
                        AI 설문 마법사
                    </h2>
                </Link>
                <nav className="hidden md:flex gap-6">
                    <Link
                        className="text-sm font-medium text-gray-500 hover:text-[#137fec] transition-colors"
                        href="/"
                    >
                        대시보드
                    </Link>
                    <Link
                        className="text-sm font-medium text-gray-500 hover:text-[#137fec] transition-colors"
                        href="/create"
                    >
                        설문 생성
                    </Link>
                </nav>
            </div>
        </header>
    );
}
