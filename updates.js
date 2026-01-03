// Обновления для script.js

// 1. Обновляем объект game
game.jumpHeight = 120; // Увеличенная высота прыжка
game.gravity = 0.6; // Оптимальная гравитация
game.jumpVelocity = 0;
game.isJumping = false;
game.maxJumpVelocity = -18; // Увеличенная начальная скорость
game.groundY = 10;
game.cacti = []; // Массив для хранения всех кактусов

// 2. Заменяем функцию jump()
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

// 3. Заменяем функцию checkCollision()
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

// 4. Добавляем функцию manageCacti()
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

// 5. Обновляем функцию startGame()
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

// 6. Обновляем функцию gameLoop()
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

// 7. Обновляем функцию endGame()
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

// 8. Обновляем функцию restartGame()
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
