const SOUNDS = {
  click: "/sounds/click.mp3",
  win: "/sounds/win.mp3",
  lose: "/sounds/lose.mp3",
};

// Настройки громкости вынесем отдельно для удобства (1.0 = 100%)
const VOLUMES = {
  click: 0.2,
  win: 1.0,
  lose: 0.6,
};

const audioCache: Record<string, HTMLAudioElement> = {};

// Функция предзагрузки
function preloadAudio(url: string) {
  if (!audioCache[url]) {
    const audio = new Audio(url);
    // Важно: на мобильных браузерах фактическая загрузка может не начаться
    // до первого взаимодействия, но мы хотя бы создадим объект в памяти.
    audio.preload = "auto";
    audioCache[url] = audio;
  }
}

// Запускаем предзагрузку сразу при импорте файла
Object.values(SOUNDS).forEach(preloadAudio);

export const playSound = (type: keyof typeof SOUNDS) => {
  const url = SOUNDS[type];
  const volume = VOLUMES[type];

  try {
    let audio = audioCache[url];

    // Страховка: если вдруг предзагрузка не сработала
    if (!audio) {
      audio = new Audio(url);
      audioCache[url] = audio;
    }

    // Устанавливаем громкость ПЕРЕД КАЖДЫМ воспроизведением
    // Это решает проблему с кэшированием громкости
    audio.volume = volume;

    // Сброс на начало (для быстрых кликов)
    audio.currentTime = 0;

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        // Ошибки автоплея (DOMException) игнорируем,
        // так как это стандартное поведение браузеров, если нет взаимодействия
        // console.warn("Audio play suppressed:", e);
      });
    }
  } catch (error) {
    console.error("Audio system error", error);
  }
};
