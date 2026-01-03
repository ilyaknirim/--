
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const gameOverElement = document.getElementById('game-over');
    const startScreen = document.getElementById('start-screen');
    const restartBtn = document.getElementById('restart-btn');
    const scoreElement = document.getElementById('score-value');
    const highScoreElement = document.getElementById('high-score-value');

    // Устанавливаем размеры canvas
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Игровые переменные
    let gameStarted = false;
    let gameOver = false;
    let score = 0;
    let highScore = localStorage.getItem('elephantGameHighScore') || 0;
    highScoreElement.textContent = highScore;

    // Параметры слона
    const elephant = {
        x: 50,
        y: canvas.height - 100 - 60, // Начальная позиция на земле
        width: 60,
        height: 60,
        jumping: false,
        jumpVelocity: 0,
        gravity: 0.8,
        jumpPower: -15,
        grounded: true,
        color: '#8B4513', // Коричневый цвет для слона
        draw() {
            // Тело слона
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Голова слона
            ctx.fillRect(this.x + this.width - 20, this.y - 20, 30, 30);

            // Хобот
            ctx.beginPath();
            ctx.moveTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width + 20, this.y + 10);
            ctx.lineTo(this.x + this.width + 15, this.y + 20);
            ctx.lineTo(this.x + this.width, this.y + 15);
            ctx.closePath();
            ctx.fill();

            // Уши
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 20, this.y - 10);
            ctx.lineTo(this.x + this.width - 30, this.y - 30);
            ctx.lineTo(this.x + this.width - 10, this.y - 30);
            ctx.closePath();
            ctx.fill();

            // Ноги
            ctx.fillRect(this.x + 10, this.y + this.height, 10, 15);
            ctx.fillRect(this.x + 40, this.y + this.height, 10, 15);
        },
        update() {
            // Гравитация
            if (!this.grounded) {
                this.jumpVelocity += this.gravity;
            }

            this.y += this.jumpVelocity;

            // Проверка нахождения на земле
            const groundY = canvas.height - 100 - this.height;
            if (this.y >= groundY) {
                this.y = groundY;
                this.jumpVelocity = 0;
                this.grounded = true;
                this.jumping = false;
            } else {
                this.grounded = false;
            }
        },
        jump() {
            if (!this.jumping && this.grounded) {
                this.jumpVelocity = this.jumpPower;
                this.jumping = true;
                this.grounded = false;
            }
        }
    };

    // Кости препятствия
    class Bone {
        constructor() {
            this.width = 40; // Базовая ширина одной косточки
            this.boneCount = Math.floor(Math.random() * 3) + 1; // От 1 до 3 косточек
            this.totalWidth = this.width * this.boneCount;
            this.height = 20;
            this.x = canvas.width;
            this.y = canvas.height - 100 - this.height;
            this.speed = 5 + score / 100; // Увеличиваем скорость со временем
            this.color = '#F5F5DC'; // Бежевый цвет для костей
            this.passed = false;
        }

        draw() {
            ctx.fillStyle = this.color;

            // Рисуем несколько косточек подряд
            for (let i = 0; i < this.boneCount; i++) {
                const boneX = this.x + i * this.width;

                // Основная часть кости
                ctx.fillRect(boneX, this.y, this.width - 10, this.height);

                // Концы кости (округления)
                ctx.beginPath();
                ctx.arc(boneX, this.y + this.height / 2, this.height / 2, Math.PI / 2, Math.PI * 1.5);
                ctx.arc(boneX + this.width - 10, this.y + this.height / 2, this.height / 2, Math.PI * 1.5, Math.PI / 2);
                ctx.fill();
            }
        }

        update() {
            this.x -= this.speed;

            // Увеличиваем счет, когда слон перескакивает препятствие
            if (!this.passed && this.x + this.totalWidth < elephant.x) {
                this.passed = true;
                score++;
                scoreElement.textContent = score;

                // Обновляем рекорд
                if (score > highScore) {
                    highScore = score;
                    highScoreElement.textContent = highScore;
                    localStorage.setItem('elephantGameHighScore', highScore);
                }
            }
        }

        isOffScreen() {
            return this.x + this.totalWidth < 0;
        }
    }

    // Массив для хранения костей
    let bones = [];
    let boneTimer = 0;
    const boneInterval = 100; // Интервал появления новых костей

    // Рисуем фон (пустыня и закат)
    function drawBackground() {
        // Небо с закатом (уже задано в CSS)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Песок
        ctx.fillStyle = '#F4A460'; // Светло-оранжевый песок
        ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

        // Добавляем текстуру песка
        ctx.fillStyle = '#DEB887';
        for (let i = 0; i < canvas.width; i += 20) {
            for (let j = canvas.height - 100; j < canvas.height; j += 20) {
                if (Math.random() > 0.7) {
                    ctx.fillRect(i, j, 5, 5);
                }
            }
        }

        // Солнце на закате
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(canvas.width - 100, 50, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    // Проверка столкновения
    function checkCollision() {
        for (const bone of bones) {
            if (
                elephant.x < bone.x + bone.totalWidth &&
                elephant.x + elephant.width > bone.x &&
                elephant.y < bone.y + bone.height &&
                elephant.y + elephant.height > bone.y
            ) {
                return true;
            }
        }
        return false;
    }

    // Игровой цикл
    function gameLoop() {
        if (!gameStarted || gameOver) return;

        drawBackground();

        // Обновляем и рисуем слона
        elephant.update();
        elephant.draw();

        // Обновляем и рисуем кости
        boneTimer++;
        if (boneTimer >= boneInterval) {
            bones.push(new Bone());
            boneTimer = 0;
        }

        bones = bones.filter(bone => !bone.isOffScreen());

        for (const bone of bones) {
            bone.update();
            bone.draw();
        }

        // Проверка столкновения
        if (checkCollision()) {
            endGame();
            return;
        }

        requestAnimationFrame(gameLoop);
    }

    // Начало игры
    function startGame() {
        gameStarted = true;
        gameOver = false;
        score = 0;
        scoreElement.textContent = score;
        bones = [];
        boneTimer = 0;
        elephant.y = canvas.height - 100 - elephant.height;
        elephant.jumping = false;
        elephant.grounded = true;
        elephant.jumpVelocity = 0;
        startScreen.classList.add('hidden');
        gameOverElement.classList.add('hidden');
        gameLoop();
    }

    // Конец игры
    function endGame() {
        gameOver = true;
        gameOverElement.classList.remove('hidden');
    }

    // Обработчики событий
    restartBtn.addEventListener('click', startGame);

    // Обработка нажатий (для десктопа)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!gameStarted) {
                startGame();
            } else if (!gameOver) {
                elephant.jump();
            }
        }
    });
    
    // Обработка клика на начальном экране
    startScreen.addEventListener('click', (e) => {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        }
    });

    // Обработка касаний (для мобильных устройств)
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        } else if (!gameOver) {
            elephant.jump();
        }
    });
    
    // Обработка касаний для всего контейнера игры
    document.querySelector('.game-container').addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        } else if (!gameOver) {
            elephant.jump();
        }
    });

    // Для поддержки мыши на мобильных устройствах
    canvas.addEventListener('click', (e) => {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        } else if (!gameOver) {
            elephant.jump();
        }
    });

    // Инициализация
    drawBackground();
    elephant.draw();
});
