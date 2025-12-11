import { GameBoard } from "@/components/game-board";
import generatedImage from "@assets/generated_images/soft_abstract_watercolor_background.png";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${generatedImage})` }}
      />

      {/* Soft Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/20 via-transparent to-white/60 pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        <header className="mb-8 text-center space-y-4">
          <div className="inline-block px-4 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm mb-2">
            <span className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-foreground/70 uppercase">
              Exclusive Collection
            </span>
          </div>

          {/* Stylized Russian Title */}
          <h1 className="text-4xl md:text-6xl font-serif font-medium text-foreground tracking-tight drop-shadow-sm flex flex-col md:block items-center gap-2">
            <span>Крестики</span>
            <span className="text-primary italic font-light mx-3 text-5xl md:text-7xl">
              &
            </span>
            <span>Нолики</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-md mx-auto font-light leading-relaxed">
            Бросьте вызов искусственному интеллекту{" "}
            <br className="hidden md:block" />и выиграйте{" "}
            <span className="text-foreground font-medium">
              эксклюзивный комплимент
            </span>
            .
          </p>
        </header>

        <main className="w-full max-w-md">
          <GameBoard />
        </main>

        <footer className="mt-16 text-center text-xs text-muted-foreground/50 font-light tracking-wide uppercase">
          <p>© 2025 Chic Gaming Collection. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
