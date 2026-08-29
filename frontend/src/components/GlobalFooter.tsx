import { Heart } from "lucide-react";

interface GlobalFooterProps {
  children?: React.ReactNode;
}

export function GlobalFooter({ children }: GlobalFooterProps) {
  return (
    <footer className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center px-4 md:px-6 py-3 flex-shrink-0 border-t border-[var(--brand-border)] text-xs">
      <div className="flex items-center gap-1.5 mb-2 sm:mb-0">
        <span className="text-[var(--brand-muted)]">Hecho con</span>
        <Heart size={13} className="text-red-400 fill-red-400/20" />
        <span className="text-[var(--brand-muted)]">por Equipo Babel</span>
      </div>
      <div className="flex items-center gap-4">
        {children}
        <div className="text-[var(--brand-muted)] opacity-70">
          MVP Snapshot 0.0.1
        </div>
      </div>
    </footer>
  );
}
