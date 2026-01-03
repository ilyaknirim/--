// Основные переменные
let game = {
    score: 0,
    bestScore: 0,
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    speed: 2,
    jumpHeight: 120, // Увеличенная высота прыжка
    jumpDuration: 500,
    gravity: 0.6, // Оптимальная гравитация
    jumpVelocity: 0,
    isJumping: false,
    maxJumpVelocity: -18, // Увеличенная начальная скорость
    groundY: 10,
    cacti: [] // Массив для хранения всех кактусов
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
    game.cacti = []; // Очищаем массив кактусов

    // Сброс позиции динозавра
    dino.style.bottom = game.groundY + 'px';
    dino.classList.remove('jumping');

    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    pauseScreen.style.display = 'none';

    updateScore();
    updateStatus('Игра началась! Прыгайте!');

    // Запуск движения
    cactus.style.animation = `moveLeft ${game.speed}s linear infinite`;
    cloud.style.animation = 'cloudMove 10s linear infinite';

    // Запуск анимаций динозавра
    const dinoLegs = dino.querySelectorAll('.dino-leg');
    const dinoArms = dino.querySelectorAll('.dino-arm');
    const dinoTail = dino.querySelector('.dino-tail');

    dinoLegs.forEach(leg => leg.style.animationPlayState = 'running');
    dinoArms.forEach(arm => arm.style.animationPlayState = 'running');
    dinoTail.style.animationPlayState = 'running';

    // Игровой цикл
    gameLoop();

    console.log('Игра начата');
}

// Пауза игры
function togglePause() {
    if (!game.isPlaying || game.isGameOver) return;

    game.isPaused = !game.isPaused;

    const dinoLegs = dino.querySelectorAll('.dino-leg');
    const dinoArms = dino.querySelectorAll('.dino-arm');
    const dinoTail = dino.querySelector('.dino-tail');

    if (game.isPaused) {
        pauseScreen.style.display = 'flex';
        cactus.style.animationPlayState = 'paused';
        cloud.style.animationPlayState = 'paused';

        // Пауза анимаций динозавра
        dinoLegs.forEach(leg => leg.style.animationPlayState = 'paused');
        dinoArms.forEach(arm => arm.style.animationPlayState = 'paused');
        dinoTail.style.animationPlayState = 'paused';

        updateStatus('Игра на паузе');
    } else {
        pauseScreen.style.display = 'none';
        cactus.style.animationPlayState = 'running';
        cloud.style.animationPlayState = 'running';

        // Возобновление анимаций динозавра
        if (!game.isJumping) {
            dinoLegs.forEach(leg => leg.style.animationPlayState = 'running');
            dinoArms.forEach(arm => arm.style.animationPlayState = 'running');
        }
        dinoTail.style.animationPlayState = 'running';

        updateStatus('Игра продолжается');
    }
}

function resumeGame() {
    game.isPaused = false;
    pauseScreen.style.display = 'none';
    cactus.style.animationPlayState = 'running';
    cloud.style.animationPlayState = 'running';

    // Возобновление анимаций динозавра
    const dinoLegs = dino.querySelectorAll('.dino-leg');
    const dinoArms = dino.querySelectorAll('.dino-arm');
    const dinoTail = dino.querySelector('.dino-tail');

    if (!game.isJumping) {
        dinoLegs.forEach(leg => leg.style.animationPlayState = 'running');
        dinoArms.forEach(arm => arm.style.animationPlayState = 'running');
    }
    dinoTail.style.animationPlayState = 'running';

    updateStatus('Игра продолжается');
}

// Улучшенный прыжок с физикой
function jump() {
    if (!game.isPlaying || game.isGameOver || game.isPaused || game.isJumping) return;

    game.isJumping = true;
    game.jumpVelocity = game.maxJumpVelocity;

    // Добавляем класс прыжка
    dino.classList.add('jumping');

    // Останавливаем анимации ног и рук при прыжке
    const dinoLegs = dino.querySelectorAll('.dino-leg');
    const dinoArms = dino.querySelectorAll('.dino-arm');

    dinoLegs.forEach(leg => leg.style.animationPlayState = 'paused');
    dinoArms.forEach(arm => arm.style.animationPlayState = 'paused');

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
        if (newBottom <= game.groundY) {
            newBottom = game.groundY;
            game.isJumping = false;
            dino.classList.remove('jumping');
            clearInterval(jumpInterval);

            // Возобновляем анимации ног и рук после приземления
            if (!game.isPaused) {
                dinoLegs.forEach(leg => leg.style.animationPlayState = 'running');
                dinoArms.forEach(arm => arm.style.animationPlayState = 'running');
            }
        }

        // Применяем новую позицию
        dino.style.bottom = newBottom + 'px';
    }, 16); // 60 FPS

    updateStatus('Прыжок!');
}

// Улучшенная проверка столкновений с точными хитбоксами
function checkCollision() {
    const dinoRect = dino.getBoundingClientRect();

    // Проверяем столкновение со всеми кактусами
    for (let i = 0; i < game.cacti.length; i++) {
        const cactusElement = game.cacti[i];
        if (!cactusElement || !cactusElement.parentNode) continue;

        const cactusRect = cactusElement.getBoundingClientRect();

        // Создаем точные хитбоксы для разных частей динозавра
        const dinoHeadHitbox = {
            left: dinoRect.left + 18,
            right: dinoRect.right - 8,
            top: dinoRect.top + 5,
            bottom: dinoRect.top + 18
        };

        const dinoBodyHitbox = {
            left: dinoRect.left + 8,
            right: dinoRect.right - 8,
            top: dinoRect.top + 15,
            bottom: dinoRect.bottom - 15
        };

        const dinoLegsHitbox = {
            left: dinoRect.left + 8,
            right: dinoRect.right - 8,
            top: dinoRect.bottom - 18,
            bottom: dinoRect.bottom - 5
        };

        // Проверка коллизии для каждой части динозавра
        const headCollision = !(
            dinoHeadHitbox.right < cactusRect.left ||
            dinoHeadHitbox.left > cactusRect.right ||
            dinoHeadHitbox.bottom < cactusRect.top ||
            dinoHeadHitbox.top > cactusRect.bottom
        );

        const bodyCollision = !(
            dinoBodyHitbox.right < cactusRect.left ||
            dinoBodyHitbox.left > cactusRect.right ||
            dinoBodyHitbox.bottom < cactusRect.top ||
            dinoBodyHitbox.top > cactusRect.bottom
        );

        const legsCollision = !(
            dinoLegsHitbox.right < cactusRect.left ||
            dinoLegsHitbox.left > cactusRect.right ||
            dinoLegsHitbox.bottom < cactusRect.top ||
            dinoLegsHitbox.top > cactusRect.bottom
        );

        // Столкновение происходит, если любая часть динозавра касается кактуса
        // Но только если динозавр не находится в верхней точке прыжка
        const currentBottom = parseInt(window.getComputedStyle(dino).bottom);
        const isInJumpApex = currentBottom >= game.jumpHeight - 20;

        if ((headCollision || bodyCollision || legsCollision) && !isInJumpApex) {
            return true; // Столкновение обнаружено
        }
    }

    return false; // Столкновений нет
}

// Управление кактусами
function manageCacti() {
    // Добавляем новый кактус в массив, если его там еще нет
    if (game.cacti.indexOf(cactus) === -1) {
        game.cacti.push(cactus);
    }

    // Создаем новые кактусы периодически
    if (Math.random() > 0.98 && game.cacti.length < 3) {
        const newCactus = cactus.cloneNode(true);
        newCactus.id = 'cactus-' + Date.now();
        newCactus.style.right = '-40px';
        newCactus.style.animation = `moveLeft ${game.speed}s linear infinite`;
        gameArea.appendChild(newCactus);
        game.cacti.push(newCactus);

        // Удаляем кактус после того, он уйдет за экран
        setTimeout(() => {
            if (newCactus.parentNode) {
                gameArea.removeChild(newCactus);
                const index = game.cacti.indexOf(newCactus);
                if (index > -1) {
                    game.cacti.splice(index, 1);
                }
            }
        }, game.speed * 1000 + 500);
    }
}

// Игровой цикл
function gameLoop() {
    if (!game.isPlaying || game.isGameOver || game.isPaused) return;

    // Управление кактусами
    manageCacti();

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

        // Обновляем скорость всех кактусов
        game.cacti.forEach(cactusElement => {
            if (cactusElement && cactusElement.parentNode) {
                cactusElement.style.animationDuration = `${game.speed}s`;
            }
        });

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
    game.cacti.forEach(cactusElement => {
        if (cactusElement && cactusElement.parentNode) {
            cactusElement.style.animationPlayState = 'paused';
        }
    });
    cloud.style.animationPlayState = 'paused';

    // Остановка анимаций динозавра
    const dinoLegs = dino.querySelectorAll('.dino-leg');
    const dinoArms = dino.querySelectorAll('.dino-arm');
    const dinoTail = dino.querySelector('.dino-tail');

    dinoLegs.forEach(leg => leg.style.animationPlayState = 'paused');
    dinoArms.forEach(arm => arm.style.animationPlayState = 'paused');
    dinoTail.style.animationPlayState = 'paused');

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
    // Удаляем все кактусы кроме основного
    game.cacti.forEach(cactusElement => {
        if (cactusElement && cactusElement.id !== 'cactus' && cactusElement.parentNode) {
            gameArea.removeChild(cactusElement);
        }
    });

    // Сброс массива кактусов
    game.cacti = [];

    // Сброс положения основного кактуса
    cactus.style.right = '-40px';
    cactus.style.animation = 'none';

    // Сброс положения облака
    cloud.style.right = '-60px';
    cloud.style.animation = 'none';

    // Сброс позиции динозавра
    dino.style.bottom = game.groundY + 'px';
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

    // Удаляем все кактусы кроме основного
    game.cacti.forEach(cactusElement => {
        if (cactusElement && cactusElement.id !== 'cactus' && cactusElement.parentNode) {
            gameArea.removeChild(cactusElement);
        }
    });

    // Сброс массива кактусов
    game.cacti = [];

    // Сброс положения объектов
    cactus.style.right = '-40px';
    cactus.style.animation = 'none';
    cloud.style.right = '-60px';
    cloud.style.animation = 'none';

    // Сброс позиции динозавра
    dino.style.bottom = game.groundY + 'px';
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
});

// Экспорт функций для HTML
window.startGame = startGame;
window.jump = jump;
window.togglePause = togglePause;
window.restartGame = restartGame;
window.resumeGame = resumeGame;
window.showStartScreen = showStartScreen;
