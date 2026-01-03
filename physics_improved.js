// Улучшенная физика прыжка и хитбоксы
function initImprovedPhysics() {
    // Добавляем переменные для физики
    game.gravity = 0.8; // Увеличенная гравитация для более реалистичного прыжка
    game.jumpVelocity = 0;
    game.isJumping = false;
    game.maxJumpVelocity = -15; // Увеличенная начальная скорость прыжка
    game.groundY = 10; // Точка земли

    // Заменяем стандартную функцию прыжка
    window.jump = function() {
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

        // Физика прыжка с улучшенной гравитацией
        const jumpInterval = setInterval(() => {
            if (!game.isJumping) {
                clearInterval(jumpInterval);
                return;
            }

            // Применяем гравитацию с ускорением
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
        }, 16); // Уменьшенный интервал для более плавной анимации (60 FPS)

        updateStatus('Прыжок!');
    };

    // Улучшенная проверка столкновений с точными хитбоксами
    window.checkCollision = function() {
        const dinoRect = dino.getBoundingClientRect();
        const cactusRect = cactus.getBoundingClientRect();

        // Создаем точные хитбоксы для разных частей динозавра
        const dinoHeadHitbox = {
            left: dinoRect.left + 15,
            right: dinoRect.right - 5,
            top: dinoRect.top,
            bottom: dinoRect.top + 15
        };

        const dinoBodyHitbox = {
            left: dinoRect.left + 5,
            right: dinoRect.right - 5,
            top: dinoRect.top + 10,
            bottom: dinoRect.bottom - 10
        };

        const dinoLegsHitbox = {
            left: dinoRect.left + 5,
            right: dinoRect.right - 5,
            top: dinoRect.bottom - 15,
            bottom: dinoRect.bottom
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
        return headCollision || bodyCollision || legsCollision;
    };

    // Улучшенное управление анимациями
    window.startGame = function() {
        if (game.isPlaying) return;

        game.isPlaying = true;
        game.isGameOver = false;
        game.score = 0;
        game.speed = 2;
        game.isJumping = false;
        game.jumpVelocity = 0;

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
    };

    // Улучшенная пауза
    window.togglePause = function() {
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
    };

    // Улучшенный конец игры
    window.endGame = function() {
        game.isPlaying = false;
        game.isGameOver = true;
        game.isJumping = false;

        // Остановка всех анимаций
        cactus.style.animation = 'none';
        cloud.style.animation = 'none';

        // Остановка анимаций динозавра
        const dinoLegs = dino.querySelectorAll('.dino-leg');
        const dinoArms = dino.querySelectorAll('.dino-arm');
        const dinoTail = dino.querySelector('.dino-tail');

        dinoLegs.forEach(leg => leg.style.animationPlayState = 'paused');
        dinoArms.forEach(arm => arm.style.animationPlayState = 'paused');
        dinoTail.style.animationPlayState = 'paused';

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
    };
}

// Инициализация улучшенной физики при загрузке страницы
document.addEventListener('DOMContentLoaded', initImprovedPhysics);
