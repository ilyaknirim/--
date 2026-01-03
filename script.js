
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
        jumpPower: -18, // Увеличенная сила прыжка для преодоления 3 косточек
        grounded: true,
        color: '#8B4513', // Коричневый цвет для слона
        draw() {
            // Основной цвет слона
            ctx.fillStyle = this.color;
            
            // Тело слона (более детализированное)
            ctx.beginPath();
            ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Голова слона (круглая)
            ctx.beginPath();
            ctx.arc(this.x + this.width - 15, this.y - 15, 18, 0, Math.PI * 2);
            ctx.fill();
            
            // Хобот (S-образный)
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 5, this.y);
            ctx.quadraticCurveTo(this.x + this.width + 10, this.y + 10, this.x + this.width + 5, this.y + 25);
            ctx.stroke();
            
            // Глаза
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + this.width - 18, this.y - 20, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(this.x + this.width - 18, this.y - 20, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Уши (большие и детализированные)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(this.x + this.width - 25, this.y - 25, 8, 15, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.x + this.width - 5, this.y - 25, 8, 15, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Ноги (детализированные)
            const legWidth = 12;
            const legHeight = 20;
            
            // Передние ноги
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(this.x + 15, this.y + this.height, legWidth/2, legHeight/2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.x + 15, this.y + this.height + 10, legWidth/2 - 2, legHeight/3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Задние ноги
            ctx.beginPath();
            ctx.ellipse(this.x + 45, this.y + this.height, legWidth/2, legHeight/2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.x + 45, this.y + this.height + 10, legWidth/2 - 2, legHeight/3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Хвост
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height/2);
            ctx.quadraticCurveTo(this.x - 15, this.y + this.height/2 - 5, this.x - 10, this.y + this.height/2 - 15);
            ctx.stroke();
            
            // Кисточка на хвосте
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y + this.height/2 - 15, 4, 0, Math.PI * 2);
            ctx.fill();
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
            // Основной цвет костей
            ctx.fillStyle = this.color;
            ctx.strokeStyle = '#E6D7C3'; // Более темный оттенок для контура
            ctx.lineWidth = 1;

            // Рисуем несколько косточек подряд
            for (let i = 0; i < this.boneCount; i++) {
                const boneX = this.x + i * this.width;
                
                // Центральная часть кости (утолщенная посередине)
                ctx.beginPath();
                ctx.moveTo(boneX + 5, this.y + this.height * 0.7);
                ctx.quadraticCurveTo(boneX + this.width/2 - 5, this.y + this.height * 0.3, boneX + this.width - 15, this.y + this.height * 0.7);
                ctx.lineTo(boneX + this.width - 15, this.y + this.height * 0.9);
                ctx.quadraticCurveTo(boneX + this.width/2 - 5, this.y + this.height * 0.5, boneX + 5, this.y + this.height * 0.9);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                // Левый сустав кости
                ctx.beginPath();
                ctx.ellipse(boneX + 5, this.y + this.height/2, this.height * 0.4, this.height * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Правый сустав кости
                ctx.beginPath();
                ctx.ellipse(boneX + this.width - 15, this.y + this.height/2, this.height * 0.4, this.height * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Добавляем текстуру и трещины для реалистичности
                ctx.strokeStyle = '#D2B48C'; // Более темный цвет для трещин
                ctx.lineWidth = 0.5;
                
                // Несколько случайных трещин
                if (Math.random() > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(boneX + 8, this.y + this.height * 0.5);
                    ctx.lineTo(boneX + 12, this.y + this.height * 0.6);
                    ctx.stroke();
                }
                
                if (Math.random() > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(boneX + this.width/2, this.y + this.height * 0.4);
                    ctx.lineTo(boneX + this.width/2 + 3, this.y + this.height * 0.5);
                    ctx.stroke();
                }
                
                if (Math.random() > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(boneX + this.width - 18, this.y + this.height * 0.5);
                    ctx.lineTo(boneX + this.width - 14, this.y + this.height * 0.6);
                    ctx.stroke();
                }
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
    restartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        startGame();
    });

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
