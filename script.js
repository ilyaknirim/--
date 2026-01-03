// Получаем элементы DOM
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gameOverElement = document.getElementById('game-over');
const startScreen = document.getElementById('start-screen');
const restartBtn = document.getElementById('restart-btn');
const scoreElement = document.getElementById('score-value');
const highScoreElement = document.getElementById('high-score-value');
const plus50Btn = document.getElementById('plus50-btn');
const instructionsElement = document.getElementById('instructions');
const pauseBtn = document.getElementById('pause-btn');
const pauseScreen = document.getElementById('pause-screen');
const resumeBtn = document.getElementById('resume-btn');
const soundToggleBtn = document.getElementById('sound-toggle');
const particleToggleBtn = document.getElementById('particle-toggle');
const soundTogglePauseBtn = document.getElementById('sound-toggle-pause');
const particleTogglePauseBtn = document.getElementById('particle-toggle-pause');

// Устанавливаем размер canvas
canvas.width = 800;
canvas.height = 400;

// Переменные игры
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('elephantGameHighScore') || 0;
let bones = [];
let boneTimer = 0;
let isPaused = false;
let soundEnabled = true;
let particlesEnabled = true;
let gameSpeed = 1;
let particles = [];

// Класс для слоника
class Elephant {
    constructor() {
        this.x = 100;
        this.y = canvas.height - 100 - 50;
        this.width = 50;
        this.height = 50;
        this.jumpPower = -12;
        this.jumpVelocity = 0;
        this.gravity = 0.6;
        this.jumping = false;
        this.grounded = true;
    }

    update() {
        if (this.jumping) {
            this.jumpVelocity += this.gravity;
            this.y += this.jumpVelocity;

            if (this.y >= canvas.height - 100 - this.height) {
                this.y = canvas.height - 100 - this.height;
                this.jumping = false;
                this.grounded = true;
                this.jumpVelocity = 0;

                // Эффект пыли при приземлении
                if (particlesEnabled) {
                    for (let i = 0; i < 8; i++) {
                        particles.push(new Particle(
                            this.x + this.width/2,
                            this.y + this.height,
                            '#F4A460',
                            (Math.random() - 0.5) * 2,
                            -Math.random() * 1,
                            Math.random() * 2 + 1,
                            20
                        ));
                    }
                }
            }
        }
    }

    jump() {
        if (!this.jumping && this.grounded) {
            this.jumpVelocity = this.jumpPower;
            this.jumping = true;
            this.grounded = false;

            // Эффект пыли при прыжке
            if (particlesEnabled) {
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(
                        this.x + this.width/2,
                        this.y + this.height,
                        '#F4A460',
                        (Math.random() - 0.5) * 3,
                        -Math.random() * 2,
                        Math.random() * 3 + 1,
                        30
                    ));
                }
            }
        }
    }

    draw() {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Глаза
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 15, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 35, this.y + 15, 3, 0, Math.PI * 2);
        ctx.fill();

        // Хобот
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 20, this.y + 30, 10, 15);
    }
}

// Класс для костей
class Bone {
    constructor() {
        this.width = 60;
        this.height = Math.random() * (canvas.height - 200 - 100) + 100;
        this.gap = 150;
        this.x = canvas.width;
        this.speed = 2;
        this.passed = false;
        this.totalWidth = this.width;
    }

    update() {
        this.x -= this.speed * gameSpeed;

        // Проверка прохождения
        if (!this.passed && this.x + this.totalWidth < elephant.x) {
            this.passed = true;
            score++;
            scoreElement.textContent = score;

            // Эффект при получении очка
            if (particlesEnabled) {
                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(
                        this.x + this.totalWidth/2,
                        this.y,
                        '#FFD700',
                        (Math.random() - 0.5) * 2,
                        -Math.random() * 3,
                        Math.random() * 2 + 1,
                        40
                    ));
                }
            }

            // Обновляем рекорд
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('elephantGameHighScore', highScore);

                // Эффект нового рекорда
                if (particlesEnabled) {
                    for (let i = 0; i < 15; i++) {
                        particles.push(new Particle(
                            canvas.width - 50,
                            30,
                            '#FF0000',
                            (Math.random() - 0.5) * 4,
                            -Math.random() * 4,
                            Math.random() * 3 + 2,
                            60
                        ));
                    }
                }
            }

            // Увеличиваем сложность каждые 10 очков
            if (score % 10 === 0) {
                gameSpeed += 0.1;
                // Эффект повышения уровня
                if (particlesEnabled) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }

            // Проверяем, достигнут ли конец игры (50 очков)
            if (score >= 50) {
                endGameWithNuclearExplosion();
            }
        }
    }

    draw() {
        ctx.fillStyle = '#FFF';
        // Верхняя кость
        ctx.fillRect(this.x, 0, this.width, this.height);
        // Нижняя кость
        ctx.fillRect(this.x, this.height + this.gap, this.width, canvas.height - this.height - this.gap - 100);
    }
}

// Класс для частиц эффектов
class Particle {
    constructor(x, y, color, velocityX, velocityY, size, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.1; // гравитация

        // Добавляем случайное движение для реализма
        this.velocityX += (Math.random() - 0.5) * 0.2;
        this.life--;
    }

    draw() {
        const opacity = this.life / this.maxLife;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isAlive() {
        return this.life > 0;
    }
}

// Создаем слоника
const elephant = new Elephant();

// Функции игры
function startGame() {
    gameStarted = true;
    gameOver = false;
    isPaused = false;
    score = 0;
    gameSpeed = 1;
    scoreElement.textContent = score;
    bones = [];
    particles = [];
    boneTimer = 0;
    elephant.y = canvas.height - 100 - elephant.height;
    elephant.jumping = false;
    elephant.grounded = true;
    elephant.jumpVelocity = 0;
    startScreen.classList.add('hidden');
    gameOverElement.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    instructionsElement.classList.add('hidden');
    gameLoop();
}

function gameLoop() {
    if (gameOver || isPaused) return;

    // Рисуем фон
    drawBackground();

    // Обновляем и рисуем частицы
    if (particlesEnabled) {
        particles = particles.filter(particle => particle.isAlive());
        for (const particle of particles) {
            particle.update();
            particle.draw();
        }
    }

    // Обновляем слоника
    elephant.update();
    elephant.draw();

    // Создаем новые кости
    boneTimer++;
    if (boneTimer >= 100) {
        bones.push(new Bone());
        boneTimer = 0;
    }

    // Обновляем и рисуем кости
    for (let i = bones.length - 1; i >= 0; i--) {
        const bone = bones[i];
        bone.update();
        bone.draw();

        // Проверка столкновения
        if (elephant.x < bone.x + bone.width &&
            elephant.x + elephant.width > bone.x &&
            (elephant.y < bone.height || elephant.y + elephant.height > bone.height + bone.gap)) {
            endGame();
        }

        // Удаляем кости, которые ушли за экран
        if (bone.x + bone.width < 0) {
            bones.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

// Функция drawDesertBackground() удалена, используется drawBackground() для ледникового периода

function endGame() {
    gameOver = true;
    gameOverElement.classList.remove('hidden');
}

function endGameWithNuclearExplosion() {
    gameOver = true;

    // Показываем экран конца игры
    gameOverElement.classList.remove('hidden');
    const gameOverText = document.querySelector('.game-over-text');

    // Случайный финальный текст о мамонтах
    const endings = [
        'КОНЕЦ ИГРЫ: МАМОНТЫ ВЕРНУЛИСЬ ДОМОЙ!',
        'КОНЕЦ ИГРЫ: ЭПОХА МАМОНТОВ НАЧАЛАСЬ!',
        'КОНЕЦ ИГРЫ: ЛЕДНИКОВЫЙ ПЕРИОД ВОЗВРАЩАЕТСЯ!',
        'КОНЕЦ ИГРЫ: МАМОНТЫ СПАСЕНЫ ОТ ВЫМИРАНИЯ!'
    ];

    gameOverText.textContent = endings[Math.floor(Math.random() * endings.length)];

    // Запускаем кат-сцену с возвращением мамонтов
    playMammothReturnCutscene();
}

function playMammothReturnCutscene() {
    let animationFrame = 0;
    const totalFrames = 300;

    function animateMammothReturn() {
        // Рисуем фон ледникового периода
        drawBackground();

        // Рисуем мамонтёнка
        elephant.draw();

        // Рисуем кости
        for (const bone of bones) {
            bone.draw();
        }

        // Анимация появления других мамонтов
        if (animationFrame > 50) {
            // Первый мамонт
            ctx.fillStyle = '#8B7355';
            ctx.beginPath();
            ctx.arc(100 + animationFrame * 2, canvas.height - 150, 30, 0, Math.PI * 2);
            ctx.fill();

            // Второй мамонт
            ctx.beginPath();
            ctx.arc(canvas.width - 100 - animationFrame * 2, canvas.height - 150, 30, 0, Math.PI * 2);
            ctx.fill();
        }

        // Анимация снега
        if (animationFrame > 100) {
            for (let i = 0; i < 50; i++) {
                const snowX = Math.random() * canvas.width;
                const snowY = Math.random() * canvas.height;
                const snowSize = Math.random() * 3 + 1;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(snowX, snowY, snowSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Анимация северного сияния
        if (animationFrame > 150) {
            ctx.save();
            ctx.globalAlpha = 0.3;

            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
            gradient.addColorStop(0, `rgba(0, 255, 0, ${0.5 + Math.sin(animationFrame * 0.05) * 0.2})`);
            gradient.addColorStop(0.5, `rgba(0, 200, 100, ${0.3 + Math.sin(animationFrame * 0.05) * 0.1})`);
            gradient.addColorStop(1, `rgba(0, 150, 200, ${0.1 + Math.sin(animationFrame * 0.05) * 0.05})`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);

            for (let x = 0; x <= canvas.width; x += 10) {
                const y = Math.sin(x * 0.01 + animationFrame * 0.02) * 50 + Math.sin(x * 0.02 + animationFrame * 0.03) * 30 + 100;
                ctx.lineTo(x, y);
            }

            ctx.lineTo(canvas.width, 0);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        // Увеличиваем счетчик кадров
        animationFrame++;

        // Продолжаем анимацию, если не достигли конца
        if (animationFrame < totalFrames) {
            requestAnimationFrame(animateMammothReturn);
        }
    }

    // Запускаем анимацию
    animateMammothReturn();
}

function drawBackground() {
    // Небо ледникового периода
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Градиент для неба ледникового периода
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#B0E0E6'); // Светло-голубой
    skyGradient.addColorStop(0.5, '#87CEEB'); // Небесно-голубой
    skyGradient.addColorStop(1, '#E0F6FF'); // Бледно-голубой
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Снежные горы на заднем плане
    drawSnowyMountains();

    // Снег
    ctx.fillStyle = '#FFFFFF'; // Белый снег
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // Добавляем текстуру снега
    ctx.fillStyle = '#F0F8FF';
    for (let i = 0; i < canvas.width; i += 15) {
        for (let j = canvas.height - 100; j < canvas.height; j += 15) {
            if (Math.random() > 0.6) {
                ctx.beginPath();
                ctx.arc(i, j, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Солнце ледникового периода
    ctx.fillStyle = '#FFFACD'; // Лимонно-кремовый
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 50, 30, 0, Math.PI * 2);
    ctx.fill();

    // Добавляем северное сияние
    drawAurora();
}

function drawAurora() {
    ctx.save();
    ctx.globalAlpha = 0.3;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0.5)');
    gradient.addColorStop(0.5, 'rgba(0, 200, 100, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 150, 200, 0.1)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);

    for (let x = 0; x <= canvas.width; x += 10) {
        const y = Math.sin(x * 0.01) * 50 + Math.sin(x * 0.02) * 30 + 100;
        ctx.lineTo(x, y);
    }

    ctx.lineTo(canvas.width, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawSnowyMountains() {
    ctx.fillStyle = '#F0F8FF';

    // Первая гора
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 100);
    ctx.lineTo(150, canvas.height - 250);
    ctx.lineTo(300, canvas.height - 100);
    ctx.closePath();
    ctx.fill();

    // Вторая гора
    ctx.beginPath();
    ctx.moveTo(200, canvas.height - 100);
    ctx.lineTo(400, canvas.height - 300);
    ctx.lineTo(600, canvas.height - 100);
    ctx.closePath();
    ctx.fill();

    // Третья гора
    ctx.beginPath();
    ctx.moveTo(500, canvas.height - 100);
    ctx.lineTo(700, canvas.height - 280);
    ctx.lineTo(900, canvas.height - 100);
    ctx.closePath();
    ctx.fill();

    // Добавляем снежные шапки
    ctx.fillStyle = '#FFFFFF';

    // Снежная шапка на первой горе
    ctx.beginPath();
    ctx.moveTo(100, canvas.height - 200);
    ctx.lineTo(150, canvas.height - 250);
    ctx.lineTo(200, canvas.height - 200);
    ctx.closePath();
    ctx.fill();

    // Снежная шапка на второй горе
    ctx.beginPath();
    ctx.moveTo(350, canvas.height - 250);
    ctx.lineTo(400, canvas.height - 300);
    ctx.lineTo(450, canvas.height - 250);
    ctx.closePath();
    ctx.fill();

    // Снежная шапка на третьей горе
    ctx.beginPath();
    ctx.moveTo(650, canvas.height - 230);
    ctx.lineTo(700, canvas.height - 280);
    ctx.lineTo(750, canvas.height - 230);
    ctx.closePath();
    ctx.fill();
}

function togglePause() {
    if (!gameStarted || gameOver) return;

    isPaused = !isPaused;
    if (isPaused) {
        pauseScreen.classList.remove('hidden');
    } else {
        pauseScreen.classList.add('hidden');
        gameLoop();
    }
}

// Обработчики событий
restartBtn.addEventListener('click', startGame);

plus50Btn.addEventListener('click', () => {
    score += 50;
    scoreElement.textContent = score;
    if (score >= 50) {
        endGameWithNuclearExplosion();
    }
});

pauseBtn.addEventListener('click', togglePause);

resumeBtn.addEventListener('click', togglePause);

soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.textContent = soundEnabled ? '🔊 Звук' : '🔇 Звук';
});

particleToggleBtn.addEventListener('click', () => {
    particlesEnabled = !particlesEnabled;
    particleToggleBtn.textContent = particlesEnabled ? '✨ Эффекты' : '✨ Эффекты';
});

soundTogglePauseBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundTogglePauseBtn.textContent = soundEnabled ? '🔊 Звук' : '🔇 Звук';
});

particleTogglePauseBtn.addEventListener('click', () => {
    particlesEnabled = !particlesEnabled;
    particleTogglePauseBtn.textContent = particlesEnabled ? '✨ Эффекты' : '✨ Эффекты';
});

// Обработчики для клика и касания по экрану
canvas.addEventListener('click', (e) => {
    if (!gameStarted) {
        startGame();
    } else if (!gameOver && !isPaused) {
        elephant.jump();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameStarted) {
        startGame();
    } else if (!gameOver && !isPaused) {
        elephant.jump();
    }
});

// Обработчик клавиатуры
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        } else if (!gameOver && !isPaused) {
            elephant.jump();
        }
    }

    // Пауза по клавише P
    if (e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
    }

    // Перезапуск по R
    if (e.code === 'KeyR') {
        e.preventDefault();
        startGame();
    }
});

// Инициализация рекорда
highScoreElement.textContent = highScore;
