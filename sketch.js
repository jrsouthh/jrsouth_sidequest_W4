/*
Week 4 — Example 5: Blob Platformer (JSON + Classes)
Course: GBDA302
Instructors: Dr. Karen Cochrane and David Han
Date: Feb. 5, 2026

This file orchestrates everything:
- load JSON in preload()
- create WorldLevel from JSON
- create BlobPlayer
- update + draw each frame
- handle input events (jump, optional next level)

This matches the structure of the original blob sketch from Week 2 but moves
details into classes.
*/

let data; // raw JSON data
let levelIndex = 0;

let world; // WorldLevel instance (current level)
let player; // BlobPlayer instance
let levelJustCompleted = false;

function preload() {
  // Load the level data from disk before setup runs.
  data = loadJSON("levels.json");
}

function setup() {
  // IMPORTANT: create a canvas once BEFORE any resizeCanvas calls.
  // (resizeCanvas does nothing until a canvas exists)
  createCanvas(640, 360);

  // Create the player once (it will be respawned per level).
  player = new BlobPlayer();

  // Load the first level.
  loadLevel(0);

  // Simple shared style setup.
  noStroke();
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  // 1) Draw the world (background + platforms)
  world.drawWorld();

  // 2) Screen levels: show overlay + pause gameplay
  if (world.type === "screen") {
    drawScreenOverlay(world);
    return; // stops updates/drawing for gameplay
  }

  // 3) Play levels: update + draw player
  player.update(world.platforms);
  player.draw(world.theme.blob);

  // 4) Win condition: trigger ONCE
  if (
    !levelJustCompleted &&
    world.goal &&
    playerTouchesGoal(player, world.goal)
  ) {
    levelJustCompleted = true;
    onLevelComplete(); // uses world.next if present
  }

  // 5) HUD
  fill(0);
  text(world.name, 10, 18);
  text("Move: A/D or ←/→ • Jump: Space/W/↑ • Next: N", 10, 36);
}

function keyPressed() {
  // Screen levels: SPACE advances (no jumping on screens)
  if (world.type === "screen" && key === " ") {
    loadLevel(world.next ?? 0);
    return;
  }

  // Jump keys (play levels only)
  if (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) {
    player.jump();
  }

  // Optional: cycle levels with N (works for play + screen levels)
  if (key === "n" || key === "N") {
    const next = (levelIndex + 1) % data.levels.length;
    loadLevel(next);
  }
}

/*
Load a level by index:
- create a WorldLevel instance from JSON
- resize canvas based on inferred geometry
- spawn player using level start + physics
*/
function loadLevel(i) {
  levelIndex = i;
  levelJustCompleted = false;

  // Create the world object from the JSON level object.
  world = new WorldLevel(data.levels[levelIndex]);

  // Fit canvas to world geometry (or defaults if needed).
  const W = world.inferWidth(640);
  const H = world.inferHeight(360);
  resizeCanvas(W, H);

  // Apply level settings + respawn.
  player.spawnFromLevel(world);
}

function playerTouchesGoal(player, goal) {
  // Player AABB (same box style used for platform collisions)
  const box = {
    x: player.x - player.r,
    y: player.y - player.r,
    w: player.r * 2,
    h: player.r * 2,
  };

  return (
    box.x < goal.x + goal.w &&
    box.x + box.w > goal.x &&
    box.y < goal.y + goal.h &&
    box.y + box.h > goal.y
  );
}

function onLevelComplete() {
  // Use JSON routing when provided; otherwise default to next in array
  const next = world.next ?? (levelIndex + 1) % data.levels.length;
  loadLevel(next);
}

function drawScreenOverlay(world) {
  const title = world.screen?.title || world.name || "";
  const subtitle = world.screen?.subtitle || "";
  const prompt = world.screen?.prompt || "Press SPACE";

  push();
  fill(0);
  textAlign(CENTER, CENTER);

  textSize(32);
  text(title, width / 2, height * 0.4);

  textSize(18);
  if (subtitle) text(subtitle, width / 2, height * 0.52);

  textSize(16);
  text(prompt, width / 2, height * 0.68);

  pop();
}
