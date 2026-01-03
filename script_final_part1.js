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