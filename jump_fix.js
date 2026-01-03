// Исправление физики прыжка для возможности перепрыгнуть кактус
function fixJumpPhysics() {
    // Добавляем переменные для физики
    game.gravity = 0.6; // Снижаем гравитацию для более высокого прыжка
    game.jumpVelocity = 0;
    game.isJumping = false;
    game.maxJumpVelocity = -18; // Увеличиваем начальную скорость прыжка
    game.groundY = 10; // Точка земли
    game.jumpHeight = 120; // Увеличиваем максимальную высоту прыжка

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

        // Физика прыжка с улучшенными параметрами
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
        }, 16); // 60 FPS для плавности

        updateStatus('Прыжок!');
    };

    // Улучшенная проверка столкновений с более щадящими хитбоксами
    window.checkCollision = function() {
        const dinoRect = dino.getBoundingClientRect();
        const cactusRect = cactus.getBoundingClientRect();

        // Создаем более щадящие хитбоксы для разных частей динозавра
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

        return (headCollision || bodyCollision || legsCollision) && !isInJumpApex;
    };
}

// Инициализация исправленной физики при загрузке страницы
document.addEventListener('DOMContentLoaded', fixJumpPhysics);
