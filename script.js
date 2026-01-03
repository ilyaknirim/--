// Добавим в начало после объявления переменных
const instructionsElement = document.getElementById('instructions');
const pauseBtn = document.getElementById('pause-btn');
const pauseScreen = document.getElementById('pause-screen');
const soundToggleBtn = document.getElementById('sound-toggle');
const particleToggleBtn = document.getElementById('particle-toggle');

// Добавим переменные
let isPaused = false;
let soundEnabled = true;
let particlesEnabled = true;
let gameSpeed = 1;
let particles = [];

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
        this.life--;
        
        // Добавляем случайное движение для реализма
        this.velocityX += (Math.random() - 0.5) * 0.2;
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

// Добавим в функцию elephant.jump():
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

// Добавим в Bone.update(), после увеличения счета:
if (!this.passed && this.x + this.totalWidth < elephant.x) {
    this.passed = true;
    score++;
    scoreElement.textContent = score;

    // Эффект при получении очка
    if (particlesEnabled) {
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(
                bone.x + bone.totalWidth/2,
                bone.y,
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

// Добавим в функцию drawBackground(), перед рисованием солнца:
// Облака
for (let i = 0; i < 3; i++) {
    const cloudX = (canvas.width * i / 3 + Date.now() * 0.01) % (canvas.width + 200) - 100;
    const cloudY = 30 + Math.sin(Date.now() * 0.001 + i) * 10;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, 15, 0, Math.PI * 2);
    ctx.arc(cloudX + 10, cloudY - 5, 12, 0, Math.PI * 2);
    ctx.arc(cloudX + 20, cloudY, 15, 0, Math.PI * 2);
    ctx.fill();
}

// Добавим в gameLoop(), перед проверкой столкновения:
// Обновляем и рисуем частицы
if (particlesEnabled) {
    particles = particles.filter(particle => particle.isAlive());
    for (const particle of particles) {
        particle.update();
        particle.draw();
    }
}

// Добавим функцию паузы
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

// Добавим в startGame():
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

// Добавим обработчики для новых кнопок
pauseBtn.addEventListener('click', togglePause);

soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.textContent = soundEnabled ? '🔊 Звук' : '🔇 Звук';
});

particleToggleBtn.addEventListener('click', () => {
    particlesEnabled = !particlesEnabled;
    particleToggleBtn.textContent = particlesEnabled ? '✨ Эффекты' : '✨ Эффекты';
});

// Добавим в обработчик клавиатуры:
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