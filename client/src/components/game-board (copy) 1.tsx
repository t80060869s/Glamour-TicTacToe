import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Circle, RotateCcw, Lock, Send, Sparkles } from "lucide-react";
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
// Замени на имя своего бота без @
const BOT_USERNAME = "tic_tac_glamour_bot";

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

  // Инициализация ID при загрузке
  useEffect(() => {
    let id = localStorage.getItem("tic_tac_player_id");
    if (!id) {
      id = nanoid();
      localStorage.setItem("tic_tac_player_id", id);
    }
    setPlayerId(id);
  }, []);

  // Проверка статуса (Опрашиваем, пока не подключится)
  const { data: playerStatus } = useQuery({
    queryKey: ["/api/player", playerId],
    enabled: !!playerId,
    refetchInterval: (query) => {
      const data = query.state.data as { isConnected: boolean } | undefined;
      // Если подключен - стоп поллинг, иначе каждые 2 сек
      return data?.isConnected ? false : 2000;
    },
  });

  const isConnected = playerStatus?.isConnected;

  // Показываем либо приветствие, либо игру
  if (!isConnected) {
    return <WelcomeScreen playerId={playerId} botUsername={BOT_USERNAME} />;
  }

  return <ActiveGame playerId={playerId} />;
}

// --- КОМПОНЕНТ ПРИВЕТСТВИЯ (VIP ВХОД) ---
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
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh]">
      <Card className="relative w-full p-8 bg-white/90 backdrop-blur-xl border-white/60 shadow-2xl rounded-3xl overflow-hidden text-center">
        {/* Декор фона */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#D4A5A5]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="bg-primary/5 p-4 rounded-full mb-2">
            <Lock className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-serif text-foreground">
              VIP Entrance
            </h2>
            <p className="text-muted-foreground font-light leading-relaxed">
              Вас приветствует Chic Gaming Collection. <br />
              Чтобы получить доступ к игре и выигрывать <br />
              эксклюзивные промокоды, активируйте ваш пропуск.
            </p>
          </div>

          <Button
            onClick={handleConnect}
            className="w-full py-6 text-lg rounded-full bg-[#229ED9] hover:bg-[#229ED9]/90 text-white shadow-lg shadow-blue-200/50 transition-all transform hover:scale-[1.02]"
          >
            <Send className="mr-2 h-5 w-5" /> Войти через Telegram
          </Button>

          <p className="text-xs text-muted-foreground/60">
            *Мы отправим ваш выигрыш в личные сообщения
          </p>
        </div>
      </Card>
    </div>
  );
}

// --- КОМПОНЕНТ АКТИВНОЙ ИГРЫ ---
function ActiveGame({ playerId }: { playerId: string }) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | "Draw" | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const { toast } = useToast();

  const checkWinner = (squares: Player[]) => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a];
      }
    }
    return squares.includes(null) ? null : "Draw";
  };

  const handleGameEnd = async (result: Player | "Draw") => {
    setWinner(result);

    if (result === "X") {
      // --- ПОБЕДА ---
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D4A5A5", "#FFD700", "#FFFFFF"],
      });

      const code = Math.floor(10000 + Math.random() * 90000).toString();
      setPromoCode(code);

      // Сразу отправляем в телеграм (ТЗ п.1)
      try {
        await apiRequest("POST", "/api/game/win", {
          storageId: playerId,
          promoCode: code,
        });
        toast({
          title: "Victory! 🥂",
          description: "Promo code sent to Telegram immediately.",
          duration: 3000,
        });
      } catch (e) {
        console.error(e);
      }
    } else if (result === "O") {
      // --- ПРОИГРЫШ ---
      // Сразу отправляем в телеграм (ТЗ п.3)
      try {
        await apiRequest("POST", "/api/game/loss", { storageId: playerId });
        toast({
          variant: "destructive",
          title: "Game Over",
          description: "Loss notification sent to Telegram.",
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      // Ничья
      toast({
        title: "It's a Draw!",
        description: "Try again.",
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
    if (result) {
      handleGameEnd(result);
    }
  };

  // AI Logic
  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        const available = board
          .map((val, idx) => (val === null ? idx : null))
          .filter((val) => val !== null) as number[];
        if (available.length === 0) return;

        let move = -1;
        // 1. Win, 2. Block, 3. Center, 4. Random
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
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, board]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setPromoCode(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4">
      {/* HEADER */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/60 rounded-full mb-3 shadow-sm border border-white/40">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            VIP Access Active
          </span>
        </div>
        <p className="text-foreground font-medium tracking-widest text-sm uppercase mb-2">
          {winner
            ? winner === "X"
              ? "You Won!"
              : winner === "O"
                ? "Computer Won"
                : "Draw"
            : isPlayerTurn
              ? "Your Turn"
              : "Computer Thinking..."}
        </p>
        <div className="h-1 w-12 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* BOARD */}
      <Card className="p-6 bg-white/80 backdrop-blur-md border-white/50 shadow-xl rounded-2xl w-full aspect-square flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="grid grid-cols-3 gap-3 w-full h-full relative z-10">
          {board.map((cell, index) => (
            <motion.button
              key={index}
              whileHover={{
                scale: cell ? 1 : 1.05,
                backgroundColor: "rgba(255,255,255,0.8)",
              }}
              whileTap={{ scale: cell ? 1 : 0.95 }}
              onClick={() => handlePlayerMove(index)}
              disabled={!!cell || !!winner || !isPlayerTurn}
              className="bg-white/50 border border-white/60 rounded-xl flex items-center justify-center text-4xl shadow-sm hover:shadow-md transition-all duration-300 disabled:cursor-not-allowed aspect-square"
            >
              <AnimatePresence>
                {cell === "X" && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-primary drop-shadow-sm"
                  >
                    <X size={48} strokeWidth={2.5} />
                  </motion.div>
                )}
                {cell === "O" && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-foreground/50 drop-shadow-sm"
                  >
                    <Circle size={42} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Play Again Button for Loss/Draw (ТЗ п.3) */}
      <AnimatePresence>
        {winner && !promoCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Button
              onClick={resetGame}
              size="lg"
              className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90 font-serif text-lg shadow-lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Dialog (ТЗ п.1 и 2) */}
      <Dialog open={!!promoCode} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md text-center bg-white/95 backdrop-blur-xl border-white/20"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-3xl font-serif text-primary mb-2">
              Congratulations!
            </DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground">
              You've won a special discount.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-secondary/30 p-4 rounded-xl border border-secondary/50">
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest">
                Your Promo Code
              </p>
              <p className="text-4xl font-mono font-bold tracking-wider text-foreground select-all">
                {promoCode}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">
              Code has been sent to your Telegram. ✨
            </p>
          </div>
          <div className="flex justify-center">
            {/* В ТЗ нет требования "Сыграть еще" при победе, но кнопка нужна чтобы закрыть окно. 
                Пусть будет "Claim" который просто закрывает модалку. */}
            <Button
              className="w-full rounded-full bg-primary hover:bg-primary/90 text-white"
              onClick={() => {
                setPromoCode(null);
                resetGame();
              }}
            >
              Close & Play Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
