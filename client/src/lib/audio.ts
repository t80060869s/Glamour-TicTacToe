// Простая утилита для воспроизведения звуков
// Громкость по умолчанию снижена, чтобы не пугать пользователя

// Определяем пути к файлам (они должны лежать в папке public/sounds/)
const SOUNDS = {
  click: "/sounds/click.mp3",
  win: "/sounds/win.mp3",
  lose: "/sounds/lose.mp3",
};

// Кэш для аудио-объектов, чтобы не загружать их каждый раз заново
const audioCache: Record<string, HTMLAudioElement> = {};

function preloadAudio(url: string) {
  if (!audioCache[url]) {
    const audio = new Audio(url);
    audio.volume = 0.4; // 40% громкости для деликатности
    audioCache[url] = audio;
  }
}

export const playSound = (type: "click" | "win" | "lose") => {
  const url = SOUNDS[type];

  try {
    // Если еще не загружен - создаем, иначе используем кэш
    let audio = audioCache[url];
    if (!audio) {
      audio = new Audio(url);
      // Настройка громкости под тип звука
      if (type === "click") audio.volume = 0.1; // Тихий клик
      if (type === "win") audio.volume = 0.7; // Чуть громче победа
      if (type === "lose") audio.volume = 0.3;
      audioCache[url] = audio;
    }

    // Сбрасываем время на 0, чтобы можно было быстро кликать подряд
    audio.currentTime = 0;
    audio.play().catch((e) => {
      // Браузеры запрещают автоплей без взаимодействия, но в игре мы кликаем, так что ок.
      // Игнорируем ошибки, если звука нет.
      console.warn("Audio play failed", e);
    });
  } catch (error) {
    console.error("Audio error", error);
  }
};

// Предзагрузка при импорте (опционально)
Object.values(SOUNDS).forEach(preloadAudio);
