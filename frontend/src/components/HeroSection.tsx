import Image from 'next/image';

export default function HeroSection() {
    return (
        <header className="flex flex-col md:flex-row items-center justify-between gap-10 mb-16 min-h-[60vh]">
            <div className="flex-1 space-y-6">
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white mb-4">
                    Lorem ipsum dolor sit amet
                </h1>
                <p className="text-base md:text-lg text-slate-300 mb-6">
                    Lorem ipsum dolor sit amet consectetur adipiscing elit lacinia, fusce accumsan mus laoreet congue cum posuere, blandit maecenas nostra morbi id ac eleifend. Lacus vulputate quam class commodo nibh mattis facilisi dictum curae.
                </p>
                <button 
                    onClick={() => document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="inline-block px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-[var(--background)] shadow-[0_4px_15px_rgba(20,184,166,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(20,184,166,0.4)] transition-all duration-300"
                >
                    Comenzar Análisis
                </button>
            </div>
            <div className="flex-1 flex justify-center">
                <div className="relative w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-[pulse_6s_ease-in-out_infinite]">
                    <Image 
                        src="/finance_ai_hero.jpg" 
                        alt="Finance AI abstract illustration"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </div>
        </header>
    );
}
