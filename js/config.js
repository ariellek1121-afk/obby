// Game constants
const MOVE_SPEED = 6;
const GRAVITY = 20;
const JUMP_FORCE = 12;
const PLAYER_RADIUS = 0.35;
const WALK_TO_SPEED = 6;

// Level definitions
const levels = [
  [
    {x:0,y:0,z:0,color:0x222222},
    {x:8,y:0,z:6,color:0xff4444},
    {x:16,y:0,z:12,color:0x44ff44},
    {x:24,y:0,z:18,color:0x4444ff},
    {x:32,y:0,z:24,color:0xffff44},
    {x:40,y:0,z:30,color:0xff44ff},
    {x:48,y:0,z:36,color:0x800080}
  ],
  [
    {x:0,y:0,z:0,color:0x222222},
    {x:8,y:0,z:6,color:0xff4444},
    {x:12,y:0,z:9,color:0xff0000, isKill:true},
    {x:16,y:0,z:12,color:0x44ff44},
    {x:20,y:0,z:15,color:0xff0000, isKill:true},
    {x:24,y:0,z:18,color:0x4444ff},
    {x:32,y:0,z:24,color:0xffff44},
    {x:40,y:0,z:30,color:0xff44ff},
    {x:48,y:0,z:36,color:0x800080}
  ],
  [],
  [],
  []
];

