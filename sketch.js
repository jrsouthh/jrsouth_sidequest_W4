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

// Prevent the goal from triggering instantly right after a level loads
let goalDelay = 0;

function preload() {
  data = loadJSON("levels.json");
}

function setup() {
  // Create a canvas once BEFORE resizeCanvas is used
  createCanvas(640, 360);

  player = new BlobPlayer();
  loadLevel(0);

  noStroke();
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  // 1) Draw the world (background + platforms / goal)
  world.drawWorld();

  // 2) Screen levels: show overlay + pause gameplay (no updates)
  if (world.type === "screen") {
    drawScreenOverlay(world);
    return;
  }

  // 3) Only count down the goal delay during playable levels
  if (goalDelay > 0) goalDelay--;

  // 4) Play levels: update + draw player
  player.update(world.platforms);
  player.draw(world.theme.blob);

  // 5) Win condition: trigger ONCE (and not during the initial delay)
  if (
    goalDelay === 0 &&
    !levelJustCompleted &&
    world.goal &&
    playerTouchesGoal(player, world.goal)
  ) {
    levelJustCompleted = true;
    onLevelComplete();
  }

  // 6) HUD
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

  world = new WorldLevel(data.levels[levelIndex]);

  const W = world.inferWidth(640);
  const H = world.inferHeight(360);
  resizeCanvas(W, H);

  player.spawnFromLevel(world);

  // Delay goal checks briefly so new levels can't instantly complete
  goalDelay = 15; // ~0.25 seconds at 60fps
}

function playerTouchesGoal(player, goal) {
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
