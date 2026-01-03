document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Установка темы в соответствии с темой Telegram
    if (tg.themeParams.bg_color) {
        document.body.style.backgroundColor = tg.themeParams.bg_color;
    }

    const dino = document.querySelector('.dino');
    const cactus = document.querySelector('.cactus');
    const cloud = document.querySelector('.cloud');
    const scoreElement = document.querySelector('.score');
    const gameOverElement = document.querySelector('.game-over');
    const startScreen = document.querySelector('.start-screen');
    const gameArea = document.querySelector('.game-area');

    let score = 0;
    let isJumping = false;
    let isGameOver = false;
    let gameStarted = false;
    let cactusSpeed = 2;
    let cloudSpeed = 1;

    // Начало игры
    function startGame() {
        if (!gameStarted) {
            gameStarted = true;
            startScreen.style.display = 'none';
            score = 0;
            isGameOver = false;
            scoreElement.textContent = score;
            cactus.classList.add('move-left');
            cloud.classList.add('cloud-move');
            gameLoop();
        }
    }

    // Прыжок динозавра
    function jump() {
        if (!isJumping && gameStarted && !isGameOver) {
            isJumping = true;
            dino.classList.add('jump-animation');

            setTimeout(() => {
                dino.classList.remove('jump-animation');
                isJumping = false;
            }, 500);
        }
    }

    // Проверка столкновения
    function checkCollision() {
        const dinoRect = dino.getBoundingClientRect();
        const cactusRect = cactus.getBoundingClientRect();

        return !(
            dinoRect.right < cactusRect.left || 
            dinoRect.left > cactusRect.right || 
            dinoRect.bottom < cactusRect.top || 
            dinoRect.top > cactusRect.bottom
        );
    }

    // Обновление игры
    function gameLoop() {
        if (!gameStarted || isGameOver) return;

        // Проверка столкновения
        if (checkCollision()) {
            endGame();
            return;
        }

        // Увеличение счета
        score++;
        scoreElement.textContent = Math.floor(score / 10);

        // Увеличение скорости каждые 100 очков
        if (score % 1000 === 0) {
            cactusSpeed += 0.5;
            cactus.style.animationDuration = `${2 / cactusSpeed}s`;
        }

        requestAnimationFrame(gameLoop);
    }

    // Конец игры
    function endGame() {
        isGameOver = true;
        gameStarted = false;
        cactus.classList.remove('move-left');
        cloud.classList.remove('cloud-move');
        gameOverElement.style.display = 'block';

        // Отправка результата в Telegram
        sendScoreToTelegram();

        setTimeout(() => {
            gameOverElement.style.display = 'none';
            startScreen.style.display = 'block';
            cactusSpeed = 2;
            cactus.style.animationDuration = '2s';
        }, 2000);
    }

    // Обработчики событий для управления тапами
    gameArea.addEventListener('click', () => {
        if (!gameStarted) {
            startGame();
        } else {
            jump();
        }
    });

    // Поддержка клавиатуры для десктопа
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!gameStarted) {
                startGame();
            } else {
                jump();
            }
        }
    });

    // Поддержка касаний для мобильных устройств
    gameArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        } else {
            jump();
        }
    });

    // Дополнительная обработка касаний для более отзывчивого управления
    gameArea.addEventListener('touchend', (e) => {
        e.preventDefault();
    });

    // Отправка результата в Telegram при завершении игры
    function sendScoreToTelegram() {
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const data = {
                score: Math.floor(score / 10),
                user: tg.initDataUnsafe.user
            };

            // Здесь можно добавить код для отправки данных на ваш сервер
            console.log('Game score:', data);
        }
    }

    // Предотвращение двойного нажатия для масштабирования на мобильных
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Добавление новых кактусов и облаков
    setInterval(() => {
        if (gameStarted && !isGameOver) {
            const newCactus = cactus.cloneNode(true);
            newCactus.style.right = '-25px';
            newCactus.classList.add('move-left');
            newCactus.style.animationDuration = `${2 / cactusSpeed}s`;
            gameArea.appendChild(newCactus);

            setTimeout(() => {
                newCactus.remove();
            }, 2000 / cactusSpeed);
        }
    }, 2000);

    setInterval(() => {
        if (gameStarted && !isGameOver) {
            const newCloud = cloud.cloneNode(true);
            newCloud.style.right = '-40px';
            newCloud.style.top = `${Math.random() * 50}px`;
            newCloud.classList.add('cloud-move');
            newCloud.style.animationDuration = `${10 / cloudSpeed}s`;
            gameArea.appendChild(newCloud);

            setTimeout(() => {
                newCloud.remove();
            }, 10000 / cloudSpeed);
        }
    }, 5000);
});