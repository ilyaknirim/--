// Основные переменные
let game = {
    score: 0,
    bestScore: 0,
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    speed: 2,
    jumpHeight: 100,
    jumpDuration: 500
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
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    pauseScreen.style.display = 'none';
    
    updateScore();
    updateStatus('Игра началась! Прыгайте!');
    
    // Запуск движения
    cactus.style.animation = `moveLeft ${game.speed}s linear infinite`;
    cloud.style.animation = 'cloudMove 10s linear infinite';
    
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
        updateStatus('Игра на паузе');
    } else {
        pauseScreen.style.display = 'none';
        cactus.style.animationPlayState = 'running';
        cloud.style.animationPlayState = 'running';
        updateStatus('Игра продолжается');
    }
}

function resumeGame() {
    game.isPaused = false;
    pauseScreen.style.display = 'none';
    cactus.style.animationPlayState = 'running';
    cloud.style.animationPlayState = 'running';
    updateStatus('Игра продолжается');
}

// Прыжок
function jump() {
    if (!game.isPlaying || game.isGameOver || game.isPaused) return;
    
    // Добавляем класс прыжка
    dino.classList.add('jumping');
    
    // Убираем класс через время прыжка
    setTimeout(() => {
        dino.classList.remove('jumping');
    }, game.jumpDuration);
    
    updateStatus('Прыжок!');
}

// Проверка столкновения
function checkCollision() {
    const dinoRect = dino.getBoundingClientRect();
    const cactusRect = cactus.getBoundingClientRect();
    
    // Упрощенная проверка коллизии
    const collision = !(
        dinoRect.right < cactusRect.left ||
        dinoRect.left > cactusRect.right ||
        dinoRect.bottom < cactusRect.top ||
        dinoRect.top > cactusRect.bottom
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
    
    // Остановка анимаций
    cactus.style.animation = 'none';
    cloud.style.animation = 'none';
    
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
    
    game.isPlaying = false;
    game.isGameOver = false;
    game.isPaused = false;
    
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