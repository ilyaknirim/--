// Основные переменные
let game = {
    score: 0,
    bestScore: 0,
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    speed: 2,
    jumpHeight: 100,
    jumpDuration: 500,
    gravity: 0.5,
    jumpVelocity: 0,
    isJumping: false
};

// DOM элементы
const dino = document.getElementById('dino');
const cactus = document.getElementById('cactus');
const cloud = document.getElementById('cloud');
const gameArea = document.getElementById('game-area');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const scoreElement = document.getElementById('current-score');
const bestScoreElement = document.getElementById('best-score');
const finalScoreElement = document.getElementById('final-score');
const statusElement = document.getElementById('status');

// Инициализация Telegram
function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        // Установка темы
        if (tg.themeParams.bg_color) {
            document.body.style.backgroundColor = tg.themeParams.bg_color;
        }

        console.log('Telegram Web App инициализирован');
    }
}

// Загрузка сохраненных данных
function loadGameData() {
    const saved = localStorage.getItem('dinoGameData');
    if (saved) {
        const data = JSON.parse(saved);
        game.bestScore = data.bestScore || 0;
        updateBestScore();
    }
}

// Сохранение данных
function saveGameData() {
    const data = {
        bestScore: game.bestScore,
        lastPlayed: new Date().toISOString()
    };
    localStorage.setItem('dinoGameData', JSON.stringify(data));
}

// Обновление счета
function updateScore() {
    scoreElement.textContent = game.score;
}

function updateBestScore() {
    bestScoreElement.textContent = game.bestScore;
}

// Старт игры
function startGame() {
    if (game.isPlaying) return;

    game.isPlaying = true;
    game.isGameOver = false;
    game.score = 0;
    game.speed = 2;
    game.isJumping = false;
    game.jumpVelocity = 0;

    // Сброс позиции динозавра
    dino.style.bottom = '10px';
    dino.classList.remove('jumping');

    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    pauseScreen.style.display = 'none';

    updateScore();
    updateStatus('Игра началась! Прыгайте!');

    // Запуск движения
    cactus.style.animation = `moveLeft ${game.speed}s linear infinite`;
    cloud.style.animation = 'cloudMove 10s linear infinite';

    // Запуск анимации динозавра
    dino.querySelector('.dino-leg').style.animationPlayState = 'running';
    dino.querySelector('.dino-leg.back').style.animationPlayState = 'running';
    dino.querySelector('.dino-arm').style.animationPlayState = 'running';
    dino.querySelector('.dino-arm.left').style.animationPlayState = 'running';
    dino.querySelector('.dino-tail').style.animationPlayState = 'running';

    // Игровой цикл
    gameLoop();

    console.log('Игра начата');
}

// Пауза игры
function togglePause() {
    if (!game.isPlaying || game.isGameOver) return;

    game.isPaused = !game.isPaused;

    if (game.isPaused) {
        pauseScreen.style.display = 'flex';
        cactus.style.animationPlayState = 'paused';
        cloud.style.animationPlayState = 'paused';

        // Пауза анимаций динозавра
        dino.querySelector('.dino-leg').style.animationPlayState = 'paused';
        dino.querySelector('.dino-leg.back').style.animationPlayState = 'paused';
        dino.querySelector('.dino-arm').style.animationPlayState = 'paused';
        dino.querySelector('.dino-arm.left').style.animationPlayState = 'paused';
        dino.querySelector('.dino-tail').style.animationPlayState = 'paused';

        updateStatus('Игра на паузе');
    } else {
        pauseScreen.style.display = 'none';
        cactus.style.animationPlayState = 'running';
        cloud.style.animationPlayState = 'running';

        // Возобновление анимаций динозавра
        dino.querySelector('.dino-leg').style.animationPlayState = 'running';
        dino.querySelector('.dino-leg.back').style.animationPlayState = 'running';
        dino.querySelector('.dino-arm').style.animationPlayState = 'running';
        dino.querySelector('.dino-arm.left').style.animationPlayState = 'running';
        dino.querySelector('.dino-tail').style.animationPlayState = 'running';

        updateStatus('Игра продолжается');
    }
}

function resumeGame() {
    game.isPaused = false;
    pauseScreen.style.display = 'none';
    cactus.style.animationPlayState = 'running';
    cloud.style.animationPlayState = 'running';

    // Возобновление анимаций динозавра
    dino.querySelector('.dino-leg').style.animationPlayState = 'running';
    dino.querySelector('.dino-leg.back').style.animationPlayState = 'running';
    dino.querySelector('.dino-arm').style.animationPlayState = 'running';
    dino.querySelector('.dino-arm.left').style.animationPlayState = 'running';
    dino.querySelector('.dino-tail').style.animationPlayState = 'running';

    updateStatus('Игра продолжается');
}

// Прыжок с улучшенной физикой
function jump() {
    if (!game.isPlaying || game.isGameOver || game.isPaused || game.isJumping) return;

    game.isJumping = true;
    game.jumpVelocity = -12; // Начальная скорость прыжка

    // Добавляем класс прыжка
    dino.classList.add('jumping');

    // Останавливаем анимации ног и рук при прыжке
    dino.querySelector('.dino-leg').style.animationPlayState = 'paused';
    dino.querySelector('.dino-leg.back').style.animationPlayState = 'paused';
    dino.querySelector('.dino-arm').style.animationPlayState = 'paused';
    dino.querySelector('.dino-arm.left').style.animationPlayState = 'paused';

    // Физика прыжка
    const jumpInterval = setInterval(() => {
        if (!game.isJumping) {
            clearInterval(jumpInterval);
            return;
        }

        // Применяем гравитацию
        game.jumpVelocity += game.gravity;

        // Получаем текущую позицию динозавра
        const currentBottom = parseInt(window.getComputedStyle(dino).bottom);

        // Вычисляем новую позицию
        let newBottom = currentBottom + game.jumpVelocity;

        // Ограничиваем максимальную высоту прыжка
        if (newBottom > game.jumpHeight) {
            newBottom = game.jumpHeight;
            game.jumpVelocity = 0;
        }

        // Проверяем, приземлился ли динозавр
        if (newBottom <= 10) {
            newBottom = 10;
            game.isJumping = false;
            dino.classList.remove('jumping');
            clearInterval(jumpInterval);

            // Возобновляем анимации ног и рук после приземления
            if (!game.isPaused) {
                dino.querySelector('.dino-leg').style.animationPlayState = 'running';
                dino.querySelector('.dino-leg.back').style.animationPlayState = 'running';
                dino.querySelector('.dino-arm').style.animationPlayState = 'running';
                dino.querySelector('.dino-arm.left').style.animationPlayState = 'running';
            }
        }

        // Применяем новую позицию
        dino.style.bottom = newBottom + 'px';
    }, 20);

    updateStatus('Прыжок!');
}

// Проверка столкновения с улучшенным хитбоксом
function checkCollision() {
    const dinoRect = dino.getBoundingClientRect();
    const cactusRect = cactus.getBoundingClientRect();

    // Создаем более точную область столкновения для динозавра
    const dinoHitbox = {
        left: dinoRect.left + 10,
        right: dinoRect.right - 10,
        top: dinoRect.top + 10,
        bottom: dinoRect.bottom - 5
    };

    // Проверка коллизии с учетом хитбокса
    const collision = !(
        dinoHitbox.right < cactusRect.left ||
        dinoHitbox.left > cactusRect.right ||
        dinoHitbox.bottom < cactusRect.top ||
        dinoHitbox.top > cactusRect.bottom
    );

    return collision;
}

// Игровой цикл
function gameLoop() {
    if (!game.isPlaying || game.isGameOver || game.isPaused) return;

    // Проверка столкновения
    if (checkCollision()) {
        endGame();
        return;
    }

    // Увеличение счета
    game.score++;
    updateScore();

    // Увеличение скорости каждые 100 очков
    if (game.score % 100 === 0) {
        game.speed = Math.max(0.5, game.speed - 0.1);
        cactus.style.animationDuration = `${game.speed}s`;
        updateStatus(`Скорость увеличена! ${game.speed.toFixed(1)}x`);
    }

    // Следующий кадр
    requestAnimationFrame(gameLoop);
}

// Конец игры
function endGame() {
    game.isPlaying = false;
    game.isGameOver = true;
    game.isJumping = false;

    // Остановка всех анимаций
    cactus.style.animation = 'none';
    cloud.style.animation = 'none';

    // Остановка анимаций динозавра
    dino.querySelector('.dino-leg').style.animationPlayState = 'paused';
    dino.querySelector('.dino-leg.back').style.animationPlayState = 'paused';
    dino.querySelector('.dino-arm').style.animationPlayState = 'paused';
    dino.querySelector('.dino-arm.left').style.animationPlayState = 'paused';
    dino.querySelector('.dino-tail').style.animationPlayState = 'paused';

    // Обновление рекорда
    if (game.score > game.bestScore) {
        game.bestScore = game.score;
        updateBestScore();
        saveGameData();
        updateStatus('🎉 Новый рекорд!');
    }

    // Показ экрана конца игры
    finalScoreElement.textContent = game.score;
    gameOverScreen.style.display = 'flex';

    console.log(`Игра окончена. Счет: ${game.score}`);
}

// Рестарт игры
function restartGame() {
    // Сброс положения кактуса
    cactus.style.right = '-40px';
    cactus.style.animation = 'none';

    // Сброс положения облака
    cloud.style.right = '-60px';
    cloud.style.animation = 'none';

    // Сброс позиции динозавра
    dino.style.bottom = '10px';
    dino.classList.remove('jumping');

    // Скрытие экранов
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    pauseScreen.style.display = 'none';

    // Запуск новой игры
    setTimeout(() => {
        startGame();
    }, 100);
}

// Показать стартовый экран
function showStartScreen() {
    gameOverScreen.style.display = 'none';
    pauseScreen.style.display = 'none';
    startScreen.style.display = 'flex';

    // Сброс положения объектов
    cactus.style.right = '-40px';
    cactus.style.animation = 'none';
    cloud.style.right = '-60px';
    cloud.style.animation = 'none';

    // Сброс позиции динозавра
    dino.style.bottom = '10px';
    dino.classList.remove('jumping');

    game.isPlaying = false;
    game.isGameOver = false;
    game.isPaused = false;
    game.isJumping = false;

    updateStatus('Готов к игре!');
}

// Обновление статуса
function updateStatus(text) {
    statusElement.textContent = text;
}

// Обработчики событий
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!game.isPlaying && !game.isGameOver) {
            startGame();
        } else if (game.isPlaying && !game.isGameOver) {
            jump();
        } else if (game.isGameOver) {
            restartGame();
        }
    } else if (e.code === 'Escape') {
        e.preventDefault();
        togglePause();
    }
});

gameArea.addEventListener('click', function() {
    if (!game.isPlaying && !game.isGameOver) {
        startGame();
    } else if (game.isPlaying && !game.isGameOver) {
        jump();
    }
});

// Для мобильных устройств
gameArea.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (!game.isPlaying && !game.isGameOver) {
        startGame();
    } else if (game.isPlaying && !game.isGameOver) {
        jump();
    }
}, { passive: false });

// Инициализация при загрузке
window.addEventListener('load', function() {
    initTelegram();
    loadGameData();
    updateStatus('Нажмите "Начать игру"');
    console.log('Игра загружена и готова!');

    // Добавляем анимацию моргания глаз
    setInterval(() => {
        if (!game.isGameOver) {
            const eye = dino.querySelector('.dino-eye');
            eye.style.height = '1px';
            setTimeout(() => {
                eye.style.height = '10px';
            }, 150);
        }
    }, 4000);
});

// Автогенерация кактусов (опционально)
setInterval(function() {
    if (game.isPlaying && !game.isGameOver && !game.isPaused) {
        // Можно добавить больше кактусов
        if (Math.random() > 0.7) {
            const newCactus = cactus.cloneNode(true);
            newCactus.style.right = '-40px';
            newCactus.style.animation = `moveLeft ${game.speed}s linear infinite`;
            gameArea.appendChild(newCactus);

            // Удаление через время
            setTimeout(() => {
                if (newCactus.parentNode) {
                    newCactus.remove();
                }
            }, game.speed * 1000);
        }
    }
}, 1500);

// Экспорт функций для HTML
window.startGame = startGame;
window.jump = jump;
window.togglePause = togglePause;
window.restartGame = restartGame;
window.resumeGame = resumeGame;
window.showStartScreen = showStartScreen;
