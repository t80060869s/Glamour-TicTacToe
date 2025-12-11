import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Circle,
  RotateCcw,
  Lock,
  Send,
  Sparkles,
  Crown,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";

type Player = "X" | "O" | null;

// --- КОНФИГУРАЦИЯ ---
const BOT_USERNAME = "tic_tac_glamour_bot"; // Твой бот

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function GameBoard() {
  const [playerId, setPlayerId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem("tic_tac_player_id");
    if (!id) {
      id = nanoid();
      localStorage.setItem("tic_tac_player_id", id);
    }
    setPlayerId(id);
  }, []);

  const { data: playerStatus } = useQuery({
    queryKey: ["/api/player", playerId],
    enabled: !!playerId,
    refetchInterval: (query) => {
      const data = query.state.data as { isConnected: boolean } | undefined;
      return data?.isConnected ? false : 2000;
    },
  });

  const isConnected = playerStatus?.isConnected;

  if (!isConnected) {
    return <WelcomeScreen playerId={playerId} botUsername={BOT_USERNAME} />;
  }

  return <ActiveGame playerId={playerId} />;
}

// --- ЭКРАН ВХОДА (VIP ENTRANCE) ---
function WelcomeScreen({
  playerId,
  botUsername,
}: {
  playerId: string;
  botUsername: string;
}) {
  const handleConnect = () => {
    window.open(
      `https://t.me/${botUsername}?start=connect_${playerId}`,
      "_blank",
    );
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[40vh]">
      <Card className="relative w-full p-8 bg-white/80 backdrop-blur-xl border-white/60 shadow-2xl rounded-[2rem] overflow-hidden text-center">
        {/* Декор */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#D4A5A5]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="bg-primary/5 p-4 rounded-full mb-1 ring-1 ring-primary/20">
            <Crown className="w-8 h-8 text-primary" strokeWidth={1} />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-serif text-foreground tracking-tight">
              Вход в VIP-клуб
            </h2>
            <div className="w-12 h-0.5 bg-primary/30 mx-auto rounded-full" />
            <p className="text-muted-foreground font-light leading-relaxed text-sm md:text-base">
              Рады приветствовать вас. <br />
              Для доступа к игре и получения <br />
              <span className="font-medium text-foreground">
                привилегированных промокодов
              </span>
              , <br />
              пожалуйста, активируйте пропуск.
            </p>
          </div>

          <Button
            onClick={handleConnect}
            className="w-full py-6 text-sm sm:text-base md:text-lg rounded-full bg-[#229ED9] hover:bg-[#229ED9]/90 text-white shadow-lg shadow-blue-200/40 transition-all transform hover:scale-[1.02] font-medium tracking-normal px-2"
          >
            <Send className="mr-3 h-5 w-5" /> Войти через Telegram
          </Button>

          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
            *Мы отправим подарок в личные сообщения
          </p>
        </div>
      </Card>
    </div>
  );
}

// --- АКТИВНАЯ ИГРА ---
function ActiveGame({ playerId }: { playerId: string }) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | "Draw" | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const { toast } = useToast();

  const checkWinner = (squares: Player[]) => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c])
        return squares[a];
    }
    return squares.includes(null) ? null : "Draw";
  };

  const handleGameEnd = async (result: Player | "Draw") => {
    setWinner(result);

    if (result === "X") {
      // --- ПОБЕДА ---
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#D4A5A5", "#FFD700", "#FFFFFF"],
        ticks: 200,
      });

      const candidateCode = Math.floor(
        10000 + Math.random() * 90000,
      ).toString();

      try {
        const res = await apiRequest("POST", "/api/game/win", {
          storageId: playerId,
          promoCode: candidateCode,
        });
        const data = await res.json();
        setPromoCode(data.promoCode);
      } catch (e) {
        console.error(e);
      }
    } else if (result === "O") {
      // --- ПРОИГРЫШ ---
      try {
        await apiRequest("POST", "/api/game/loss", { storageId: playerId });
        toast({
          variant: "destructive", // Красный стиль для ошибки/проигрыша
          title: "Увы, в этот раз ИИ сильнее",
          description: "Не расстраивайтесь, удача скоро улыбнется вам! 🤍",
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      toast({
        title: "Ничья — Искусство Равновесия",
        description: "Попробуйте еще раз, победа близка.",
      });
    }
  };

  const handlePlayerMove = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;
    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsPlayerTurn(false);
    const result = checkWinner(newBoard);
    if (result) handleGameEnd(result);
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        const available = board
          .map((val, idx) => (val === null ? idx : null))
          .filter((val) => val !== null) as number[];
        if (available.length === 0) return;
        let move = -1;
        // AI Logic
        for (const idx of available) {
          const t = [...board];
          t[idx] = "O";
          if (checkWinner(t) === "O") {
            move = idx;
            break;
          }
        }
        if (move === -1) {
          for (const idx of available) {
            const t = [...board];
            t[idx] = "X";
            if (checkWinner(t) === "X") {
              move = idx;
              break;
            }
          }
        }
        if (move === -1 && board[4] === null) move = 4;
        if (move === -1)
          move = available[Math.floor(Math.random() * available.length)];

        const newBoard = [...board];
        newBoard[move] = "O";
        setBoard(newBoard);
        setIsPlayerTurn(true);
        const result = checkWinner(newBoard);
        if (result) handleGameEnd(result);
      }, 700); // Чуть увеличил задержку для "естественности" раздумий
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, board]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setPromoCode(null);
  };

  // --- ТЕКСТЫ СТАТУСОВ ---
  const getStatusText = () => {
    if (winner === "X") return "Блестящая победа!";
    if (winner === "O") return "ИИ одержал верх";
    if (winner === "Draw") return "Ничья";
    if (isPlayerTurn) return "Ваш ход";
    return "ИИ размышляет...";
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4">
      {/* Header Status */}
      <div className="mb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 rounded-full shadow-sm border border-white/40 backdrop-blur-sm">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            VIP Access Active
          </span>
        </div>

        <div>
          <p className="text-foreground font-medium tracking-[0.15em] text-sm uppercase mb-2 animate-in fade-in duration-500">
            {getStatusText()}
          </p>
          <div className="h-0.5 w-12 bg-primary/40 mx-auto rounded-full"></div>
        </div>
      </div>

      {/* Board */}
      <Card className="p-6 bg-white/70 backdrop-blur-xl border-white/50 shadow-2xl rounded-[2rem] w-full aspect-square flex items-center justify-center relative overflow-hidden ring-1 ring-white/60">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/30 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="grid grid-cols-3 gap-3 w-full h-full relative z-10">
          {board.map((cell, index) => (
            <motion.button
              key={index}
              whileHover={{
                scale: cell ? 1 : 1.03,
                backgroundColor: "rgba(255,255,255,0.9)",
              }}
              whileTap={{ scale: cell ? 1 : 0.97 }}
              onClick={() => handlePlayerMove(index)}
              disabled={!!cell || !!winner || !isPlayerTurn}
              className="bg-white/40 border border-white/60 rounded-2xl flex items-center justify-center text-4xl shadow-sm hover:shadow-md transition-all duration-300 disabled:cursor-not-allowed aspect-square relative group"
            >
              <AnimatePresence>
                {cell === "X" && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    className="text-primary drop-shadow-sm"
                  >
                    <X size={52} strokeWidth={2} />
                  </motion.div>
                )}
                {cell === "O" && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-foreground/40 drop-shadow-sm"
                  >
                    <Circle size={44} strokeWidth={2} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Try Again Button */}
      <AnimatePresence>
        {winner && winner !== "X" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Button
              onClick={resetGame}
              size="lg"
              className="rounded-full px-10 py-6 bg-foreground text-background hover:bg-foreground/90 font-serif text-lg shadow-xl tracking-wide"
            >
              <RotateCcw className="mr-3 h-5 w-5" /> Сыграть ещё раз
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WINNER DIALOG */}
      <Dialog open={!!promoCode} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md bg-white/95 backdrop-blur-2xl border-white/40 shadow-2xl p-0 gap-0 overflow-hidden rounded-[2rem] [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Header Background */}
          <div className="bg-[#fcf8f8] p-8 pb-4 flex flex-col items-center text-center border-b border-border/40">
            <div className="bg-primary/10 p-3 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-primary" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-3xl font-serif text-foreground mb-2 text-center tracking-tight">
              Поздравляем!
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground text-center font-light">
              Вы выиграли эксклюзивный комплимент.
            </DialogDescription>
          </div>

          <div className="p-8 pt-6 text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 via-primary/5 to-secondary/20 blur-xl opacity-50" />
              <div className="relative bg-white/80 p-6 rounded-2xl border border-primary/10 shadow-inner">
                <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-[0.25em]">
                  Ваш промокод
                </p>
                <p className="text-4xl font-mono font-bold tracking-widest text-primary select-all">
                  {promoCode}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/70 italic flex items-center justify-center gap-2">
              <Send className="w-3 h-3" /> Код отправлен в Telegram
            </p>

            <Button
              className="w-full py-6 rounded-full bg-primary hover:bg-primary/90 text-white font-medium tracking-wide shadow-lg shadow-primary/20 transition-all text-lg"
              onClick={() => {
                setPromoCode(null);
                resetGame();
              }}
            >
              Забрать и Играть Снова
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
