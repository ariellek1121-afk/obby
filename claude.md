# 3D Obby Game - Project Context

## Project Overview
A 3D platformer game built with Three.js where players navigate through levels with platforms, walls, clickable ledges, and defeat obstacles. Features a full UI system, admin tools, and smooth camera controls.

**Current Status:** Fully functional with 3 levels, refactored into modular file structure.

---

## Technology Stack
- **Engine:** Three.js r128 (CDN loaded)
- **Language:** Vanilla JavaScript
- **Styling:** Plain CSS
- **Browser:** Modern browsers with WebGL support

---

## Project Structure

```
obby game/
├── index.html              # Entry point (clean HTML, ~130 lines)
├── css/
│   └── style.css          # All styles (~180 lines)
├── js/
│   ├── config.js          # Constants & level definitions
│   ├── game.js            # Core game logic
│   ├── ui.js              # UI/menu handlers
│   ├── admin.js           # Admin features
│   └── main.js            # Global state & animation loop
└── claude.md              # This file
```

### File Responsibilities

**config.js**
- Game constants: `MOVE_SPEED`, `GRAVITY`, `JUMP_FORCE`, `PLAYER_RADIUS`, `WALK_TO_SPEED`
- Level definitions array (3 levels)

**game.js**
- `init()` - Three.js scene, camera, renderer setup
- `createPlatform()` - Platform creation (with kill block support)
- `createLedge()` - Clickable ledge creation
- `createWall()` - Wall creation with attached ledges
- `gotoLedge()` - Ledge climbing FSM (approach → grab → climb)
- `loadLevel()` - Level loading & reset
- `checkCollisions()` - Platform collision detection & landing
- `showVictory()` - Victory state
- Event listeners: mouse, keyboard, wheel zoom

**ui.js**
- `setupUI()` - Initialize menu buttons & accessibility
- `startGame()` - Game startup
- `showPickLevel()` / `hidePickLevel()` - Level selection modal
- `setStartLevel()` - Set home screen start level
- `goToLevel()` - Teleport to selected level
- `restartGame()` / `restartToHome()` - Reset states
- `nextLevel()` - Progress to next level
- `showHowTo()` / `hideHowTo()` - Help overlay
- `leaveGame()` / `skipLevel()` - Bottom bar actions

**admin.js**
- `spawnBalloonsFromUI()` / `spawnBalloons()` / `createBalloon()` - Balloon system
- `toggleFly()` - Enable/disable flight mode
- `setFlySpeed()` - Adjust flight speed (1-600 units/sec)

**main.js**
- Global variables declaration (scene, camera, renderer, player, etc.)
- `animate()` - Main game loop (~250 lines)
  - Input handling & movement
  - Animation system (walking limbs, balloon wobble)
  - Ledge climbing state machine
  - Collision resolution
  - Camera positioning (3rd-person or 1st-person)
  - Balloon lifecycle management
- Event handler initialization
- `setupUI()` call on DOM load

---

## Game Features

### Core Mechanics
- **Movement:** WASD to walk, smooth directional movement
- **Jumping:** Space to jump with configurable force
- **Camera Control:** Right-click + mouse to rotate (pointer lock)
- **Collision:** Per-axis AABB against walls; platform landing with offset
- **Ledge Climbing:** Click ledges to auto-climb (approach → grab → climb FSM)
- **Kill Blocks:** Red platforms reset player to spawn

### UI/Menu System
- **Home Screen:** Gradient menu with Play, How to Play, Pick Level buttons
- **Victory Screen:** Rainbow animated background, string lights, confetti, Next Level button
- **How to Play:** Modal with complete controls documentation
- **Pick Level:** Modal to select start level or teleport mid-game
- **Bottom Action Bar:** Leave Game, Skip Level, Choose Level buttons (boxed container with blur)
- **Admin Panel:** Spawn balloons, toggle fly mode, adjust fly speed (top-right)

### Camera Modes
- **3rd-Person (Default):** 8 units right/behind player, 5 units up, relative to camera yaw/pitch
- **Mouse Wheel Zoom:** Scroll up to zoom in (2-20 unit range), scroll down to zoom out
- **1st-Person (firstPerson flag):** Locked to player head position; shows first-person arms

### Levels
- **Level 1:** Simple platform progression (7 platforms)
- **Level 2:** Platform progression with 2 red kill blocks to avoid (9 platforms)
- **Level 3:** 4 tall walls with diagonal clickable ledges requiring skill to climb
- **Level 4:** Pure red environment with vast red sky and ground; dark red brick in corner with realistic shadows; VHS distortion effect for atmospheric horror

### Admin Features
- **Balloons:** Spawn 1-50 floating balloons with upward motion and wobble (10-sec lifetime)
- **Fly Mode:** Toggle to enable flight (Space = ascend, Shift = descend)
- **Fly Speed:** Adjustable 1-600 units/sec slider

### Animations
- **Walking:** Limb swing synchronized to movement speed
- **Ledge Climbing:** Arm poses during approach/grab phases
- **Balloons:** Sine-wave wobble in X/Z, upward drift, rotation
- **Victory:** Rainbow gradient animation, bulb glow, confetti fall

---

## Important Variables & State

### Global State (main.js)
```javascript
let scene, camera, renderer;           // Three.js objects
let player;                            // Player group (head, torso, arms, legs)
let velocityY = 0;                     // Vertical velocity for gravity
let canJump = false;                   // Jump availability
let keys = {};                         // Active key states
let yaw, pitch;                        // Camera angles
let platforms = [];                    // All platforms/ledges
let walls = [];                        // All walls
let ledges = [];                       // Clickable ledges
let balloons = [];                     // Active balloons
let gameWon = false;                   // Victory state
let flyEnabled = false;                // Flight mode
let flySpeed = 60;                     // Flight speed
let levelIndex = 1;                    // Current level (1-3)
let cameraDistance = 8;                // 3rd-person distance (zoom)
let walkTarget = null;                 // Ledge climb target (FSM state)
let firstPerson = false;               // 1st-person mode flag
```

### Player Collision Info
```javascript
player.userData.onLedge         // Current ledge player stands on
player.userData.onLedgeTime     // Time standing on ledge
```

### Platform/Ledge Data
```javascript
userData.isKill              // Kill block flag
userData.isLedge             // Ledge flag
userData.isWall              // Wall flag
userData.halfX, halfZ, halfY // Size half-extents (collision)
userData.standOffset         // Y offset when standing on surface
userData.parentWall          // Reference to parent wall (for ledges)
```

---

## Controls Summary

| Action | Controls |
|--------|----------|
| Move | W/A/S/D |
| Jump | Space |
| Rotate Camera | Right-click + Mouse |
| Zoom In | Scroll Up |
| Zoom Out | Scroll Down |
| Climb Ledge | Left-click on ledge |
| Fly (Admin) | Toggle button → Space (up) / Shift (down) |

---

## Level Data Format

Each level is an array of platform definitions:
```javascript
{
  x: 0,
  y: 0,
  z: 0,
  color: 0x222222,
  isKill: false  // Optional; red platform if true
}
```

Level 3 is procedurally generated: 4 walls with 3 diagonal ledges each + vertical ledges.

---

## Known Behaviors & Notes

1. **Collision Snapping:** Player snaps down to platform top when landing (velocityY ≤ 0)
2. **Kill Blocks:** Instantly reset player to spawn (0, 5, 0)
3. **Ledge Climbing:** Requires click; auto-walks to approach point, grabs for ~450ms, then climbs
4. **Wall Blocking:** Per-axis collision check prevents walking through walls; nudges player clear when blocked
5. **Camera Follow:** Always centered on player; zoom changes distance dynamically
6. **Balloon Lifetime:** 10 seconds; removed if above player + 80 units
7. **Victory Condition:** Landing on final platform in level triggers victory screen
8. **Fly Mode:** Disables gravity; applies upward/downward velocity from Space/Shift
9. **Shadows:** Level 4 features dynamic shadow mapping with 4096x4096 resolution; dark brick casts realistic shadows
10. **VHS Effect:** Level 4 includes animated VHS distortion overlay with scan lines and noise for atmospheric effect

---

## Development Notes

### To Add Features
1. Copy relevant state declarations (if needed) into `main.js`
2. Implement logic in appropriate module (game, ui, admin)
3. Expose functions to `window` scope if they need HTML onclick handlers
4. Test across all levels

### Module Load Order (Critical)
1. `config.js` (constants, levels)
2. `game.js` (game logic, init)
3. `ui.js` (menu handlers)
4. `admin.js` (admin features)
5. `main.js` (state, animate, init calls)

### Potential Improvements
- Save/load game state
- Leaderboard system
- More levels
- Mobile touch controls
- Sound effects & music
- Particle effects
- More player customization
- Checkpoint system

---

## Last Updated
March 3, 2026 - Added Level 4 with red environment, dark brick with shadows, and VHS effect. Implemented shadow mapping system with 4096x4096 PCF shadows.
