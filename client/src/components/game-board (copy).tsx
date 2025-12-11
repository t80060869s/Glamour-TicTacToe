import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Circle, RotateCcw, Send } from "lucide-react";
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
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is X
  const [winner, setWinner] = useState<Player | "Draw" | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);

  // Новые стейты для Телеграма
  const [playerId, setPlayerId] = useState<string>("");
  const { toast } = useToast();

  // Инициализация ID игрока
  useEffect(() => {
    let id = localStorage.getItem("tic_tac_player_id");
    if (!id) {
      id = nanoid();
      localStorage.setItem("tic_tac_player_id", id);
    }
    setPlayerId(id);
  }, []);

  // Опрос статуса подключения (каждые 2 сек, если есть ID)
  const { data: playerStatus } = useQuery({
    queryKey: ["/api/player", playerId],
    enabled: !!playerId,
    // refetchInterval: 2000, // Поллинг для авто-обновления статуса
    // Если уже подключен (isConnected == true), то false (не опрашивать).
    // Иначе опрашивать раз в 3000мс (3 секунды).
    refetchInterval: (query) => {
      const data = query.state.data as { isConnected: boolean } | undefined;
      return data?.isConnected ? false : 3000;
    },
  });

  const isConnected = playerStatus?.isConnected;
  const botUsername = "tic_tac_glamour_bot"; // ЗАМЕНИТЬ НА РЕАЛЬНЫЙ ЮЗЕРНЕЙМ БЕЗ @

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

  const computerMove = () => {
    // Simple AI: 1. Win, 2. Block, 3. Center, 4. Random
    const available = board
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null) as number[];

    if (available.length === 0) return;

    let move = -1;

    // 1. Try to win
    for (const idx of available) {
      const tempBoard = [...board];
      tempBoard[idx] = "O";
      if (checkWinner(tempBoard) === "O") {
        move = idx;
        break;
      }
    }

    // 2. Block player
    if (move === -1) {
      for (const idx of available) {
        const tempBoard = [...board];
        tempBoard[idx] = "X";
        if (checkWinner(tempBoard) === "X") {
          move = idx;
          break;
        }
      }
    }

    // 3. Take center
    if (move === -1 && board[4] === null) {
      move = 4;
    }

    // 4. Random
    if (move === -1) {
      move = available[Math.floor(Math.random() * available.length)];
    }

    const newBoard = [...board];
    newBoard[move] = "O";
    setBoard(newBoard);
    setIsPlayerTurn(true);

    const result = checkWinner(newBoard);
    if (result) {
      handleGameEnd(result);
    }
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(computerMove, 600);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner]);

  const handleGameEnd = async (result: Player | "Draw") => {
    setWinner(result);

    if (result === "X") {
      // Player Won
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D4A5A5", "#FFD700", "#FFFFFF"],
      });
      const code = Math.floor(10000 + Math.random() * 90000).toString();
      setPromoCode(code);

      // Simulate Telegram
      console.log(`Sending to Telegram: Win! Promo code issued: ${code}`);
      // Отправляем на сервер
      await apiRequest("POST", "/api/game/win", {
        storageId: playerId,
        promoCode: code,
      });

      if (isConnected) {
        toast({
          title: "Victory!",
          description: "Promo code sent to your Telegram! ✨",
          duration: 3000,
        });
      }
    } else if (result === "O") {
      // Player Lost
      console.log("Sending to Telegram: Lost");
      if (isConnected) {
        await apiRequest("POST", "/api/game/loss", { storageId: playerId });
        toast({
          variant: "destructive",
          title: "Oh no!",
          description: "Loss notification sent to Telegram.",
        });
      }
    } else {
      toast({
        title: "It's a Draw!",
        description: "Try again to win a discount.",
      });
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setPromoCode(null);
  };

  // Обработчик кнопки Телеграм
  const handleConnectTelegram = () => {
    // Открываем бота с параметром для связки
    window.open(
      `https://t.me/${botUsername}?start=connect_${playerId}`,
      "_blank",
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4">
      <div className="mb-8 text-center">
        <p className="text-muted-foreground font-medium tracking-widest text-sm uppercase mb-2">
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

      <Card className="p-6 bg-white/80 backdrop-blur-md border-white/50 shadow-xl rounded-2xl w-full aspect-square flex items-center justify-center relative overflow-hidden">
        {/* Decorative background elements */}
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
              data-testid={`cell-${index}`}
            >
              <AnimatePresence>
                {cell === "X" && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="text-primary drop-shadow-sm"
                  >
                    <X size={48} strokeWidth={2.5} />
                  </motion.div>
                )}
                {cell === "O" && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
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

      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8"
          >
            <Button
              onClick={resetGame}
              size="lg"
              className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90 font-serif text-lg shadow-lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Play Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={!!promoCode}
        onOpenChange={(open) => !open && setPromoCode(null)}
      >
        <DialogContent className="sm:max-w-md text-center bg-white/95 backdrop-blur-xl border-white/20">
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
          </div>
          <div className="flex justify-center">
            {/* Логика кнопок: Если не подключен, предлагаем подключить. Если подключен - просто играть снова */}
            {!isConnected ? (
              <Button
                className="w-full rounded-full bg-[#229ED9] hover:bg-[#229ED9]/90 text-white shadow-md transition-all"
                onClick={handleConnectTelegram}
              >
                <Send className="mr-2 h-4 w-4" /> Save in Telegram
              </Button>
            ) : (
              <div className="text-sm text-primary font-medium italic mb-2">
                Code sent to Telegram! ✨
              </div>
            )}

            <Button
              variant={isConnected ? "default" : "outline"}
              className={`w-full rounded-full ${isConnected ? "bg-primary text-white" : "border-primary/20 text-muted-foreground hover:bg-secondary/50"}`}
              onClick={() => {
                setPromoCode(null);
                resetGame();
              }}
            >
              {isConnected ? "Play Again" : "Claim & Play Again"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
