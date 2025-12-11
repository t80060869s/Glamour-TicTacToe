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
        <header className="mb-8 text-center space-y-2">
          <div className="inline-block px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-white/40 mb-4">
            <span className="text-xs font-medium tracking-[0.2em] text-foreground/60 uppercase">
              Exclusive Game
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-medium text-foreground tracking-tight drop-shadow-sm">
            Tic <span className="text-primary italic">Tac</span> Toe
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto font-light">
            Challenge our AI to win an exclusive discount code.
          </p>
        </header>

        <main className="w-full max-w-md">
          <GameBoard />
        </main>

        <footer className="mt-16 text-center text-sm text-muted-foreground/60 font-light">
          <p>© 2025 Chic Gaming Collection. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
