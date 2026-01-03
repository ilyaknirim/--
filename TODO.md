# TODO: Improve Dino Game Jump and Hitboxes

## Step 1: Add isJumping variable to prevent double jumps ✅
- Add game.isJumping = false to game object ✅
- Set to true when jumping starts ✅
- Set to false when jump animation ends ✅
- Check in jump() function ✅

## Step 2: Improve hitboxes to be more accurate ✅
- Define custom hitbox rectangles for dino and cactus ✅
- Use smaller hitboxes that match visual elements better ✅
- Update checkCollision() function ✅

## Step 3: Add physics-based jumping ✅
- Remove CSS animation for jumping ✅
- Add gravity and jump velocity variables ✅
- Implement physics in gameLoop() ✅
- Update dino position based on physics ✅

## Step 4: Fix collision detection for multiple cacti
- Store all cacti in an array
- Check collision with all active cacti
- Properly manage cactus lifecycle
