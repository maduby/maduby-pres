"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";
import { uiStrings } from "@/content/strings.de-ch";

const GAME_HEIGHT = 100;
const DUCK_X = 24;
const DUCK_HEIGHT = 22;
const GROUND_OFFSET = 16;
const START_SPEED = 148;
const MAX_SPEED = 290;
const SPEED_GAIN = 5;
const GRAVITY = 1180;
const JUMP_VELOCITY = 390;

interface Obstacle {
  height: number;
  kind: "crate" | "mmp" | "reed" | "stack" | "trump";
  width: number;
  x: number;
}

interface GameState {
  duckRise: number;
  duckVelocity: number;
  elapsed: number;
  mode: "crashed" | "idle" | "running";
  obstacles: Obstacle[];
  score: number;
  spawnCooldown: number;
  speed: number;
}

interface CanvasSize {
  height: number;
  width: number;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createGameState(): GameState {
  return {
    duckRise: 0,
    duckVelocity: 0,
    elapsed: 0,
    mode: "idle",
    obstacles: [],
    score: 0,
    spawnCooldown: 1.05,
    speed: START_SPEED,
  };
}

function createObstacle(width: number): Obstacle {
  const kindRoll = Math.random();
  if (kindRoll < 0.28) {
    return {
      height: Math.round(randomBetween(18, 30)),
      kind: "reed",
      width: Math.round(randomBetween(10, 14)),
      x: width + randomBetween(18, 42),
    };
  }
  if (kindRoll < 0.5) {
    return {
      height: Math.round(randomBetween(12, 16)),
      kind: "crate",
      width: Math.round(randomBetween(14, 18)),
      x: width + randomBetween(20, 48),
    };
  }
  if (kindRoll < 0.7) {
    return {
      height: Math.round(randomBetween(18, 24)),
      kind: "stack",
      width: Math.round(randomBetween(18, 24)),
      x: width + randomBetween(22, 52),
    };
  }
  if (kindRoll < 0.86) {
    return {
      height: 20,
      kind: "mmp",
      width: 34,
      x: width + randomBetween(24, 54),
    };
  }
  return {
    height: 24,
    kind: "trump",
    width: 24,
    x: width + randomBetween(24, 56),
  };
}

function clampDelta(ms: number) {
  return Math.min(ms, 34) / 1000;
}

function hitTest(state: GameState, groundY: number) {
  const duckTop = groundY - DUCK_HEIGHT - state.duckRise;
  const duckLeft = DUCK_X + 4;
  const duckHitbox = {
    bottom: duckTop + 18,
    left: duckLeft,
    right: duckLeft + 17,
    top: duckTop + 2,
  };

  return state.obstacles.some((obstacle) => {
    const obstacleLeft = obstacle.x + 1;
    const obstacleTop = groundY - obstacle.height;
    const obstacleRight = obstacle.x + obstacle.width - 1;
    const obstacleBottom = groundY;

    return !(
      duckHitbox.right < obstacleLeft ||
      duckHitbox.left > obstacleRight ||
      duckHitbox.bottom < obstacleTop ||
      duckHitbox.top > obstacleBottom
    );
  });
}

function fillPixelRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = "#111111",
) {
  context.fillStyle = fill;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

function drawPixelLetterM(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  unit = 2,
) {
  fillPixelRect(context, x, y, unit, unit * 5);
  fillPixelRect(context, x + unit * 2, y, unit, unit * 5);
  fillPixelRect(context, x + unit, y + unit, unit, unit);
  fillPixelRect(context, x + unit, y + unit * 2, unit, unit);
}

function drawPixelLetterP(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  unit = 2,
) {
  fillPixelRect(context, x, y, unit, unit * 5);
  fillPixelRect(context, x + unit, y, unit, unit);
  fillPixelRect(context, x + unit * 2, y + unit, unit, unit * 2);
  fillPixelRect(context, x + unit, y + unit * 2, unit, unit);
}

function drawMmpObstacle(
  context: CanvasRenderingContext2D,
  x: number,
  top: number,
  width: number,
  height: number,
) {
  const signHeight = height - 6;
  fillPixelRect(context, x + 5, top + signHeight, 2, height - signHeight);
  fillPixelRect(context, x + width - 7, top + signHeight, 2, height - signHeight);
  fillPixelRect(context, x, top, width, signHeight);
  fillPixelRect(context, x + 2, top + 2, width - 4, signHeight - 4, "#f7f4eb");

  const textY = top + 3;
  drawPixelLetterM(context, x + 3, textY);
  drawPixelLetterM(context, x + 13, textY);
  drawPixelLetterP(context, x + 23, textY);
}

function drawTrumpObstacle(
  context: CanvasRenderingContext2D,
  x: number,
  top: number,
) {
  fillPixelRect(context, x + 4, top + 13, 16, 11);
  fillPixelRect(context, x + 7, top + 2, 11, 12);
  fillPixelRect(context, x + 8, top + 4, 9, 8, "#f7f4eb");
  fillPixelRect(context, x + 5, top + 1, 13, 3);
  fillPixelRect(context, x + 15, top, 6, 3);
  fillPixelRect(context, x + 18, top + 2, 3, 4);
  fillPixelRect(context, x + 16, top + 6, 3, 2);
  fillPixelRect(context, x + 9, top + 6, 1, 1);
  fillPixelRect(context, x + 14, top + 8, 2, 1);
  fillPixelRect(context, x + 10, top + 12, 4, 3, "#f7f4eb");
  fillPixelRect(context, x + 12, top + 14, 1, 5);
}

function drawDuck(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  elapsed: number,
  isJumping: boolean,
  isCrashed: boolean,
) {
  const unit = 2;
  const block = (
    gridX: number,
    gridY: number,
    gridWidth: number,
    gridHeight: number,
    fill?: string,
  ) => {
    fillPixelRect(
      context,
      x + gridX * unit,
      y + gridY * unit,
      gridWidth * unit,
      gridHeight * unit,
      fill,
    );
  };

  block(1, 5, 7, 4);
  block(0, 6, 2, 2);
  block(2, 4, 5, 1);
  block(7, 3, 1, 2);
  block(8, 2, 3, 3);
  block(11, 3, 2, 1);
  block(11, 4, 2, 1);
  block(5, 6, 2, 1, "#f7f4eb");
  block(6, 7, 1, 1, "#f7f4eb");
  block(9, 3, 1, 1, "#f7f4eb");

  if (isCrashed) {
    block(9, 4, 1, 1, "#111111");
    block(8, 3, 1, 1, "#111111");
    block(9, 2, 1, 1, "#111111");
  }

  if (isJumping) {
    block(4, 9, 1, 1);
    block(6, 9, 1, 1);
    return;
  }

  const frame = Math.floor(elapsed * 10) % 2;
  if (frame === 0) {
    block(4, 9, 1, 2);
    block(6, 8, 1, 3);
  } else {
    block(4, 8, 1, 3);
    block(6, 9, 1, 2);
  }
}

function drawObstacle(
  context: CanvasRenderingContext2D,
  obstacle: Obstacle,
  groundY: number,
) {
  const x = obstacle.x;
  const top = groundY - obstacle.height;

  if (obstacle.kind === "crate") {
    fillPixelRect(context, x, top, obstacle.width, obstacle.height);
    fillPixelRect(context, x + 2, top + 2, obstacle.width - 4, obstacle.height - 4, "#f7f4eb");
    fillPixelRect(context, x + 4, top + 4, obstacle.width - 8, obstacle.height - 8);
    return;
  }

  if (obstacle.kind === "stack") {
    fillPixelRect(context, x + 2, top + 4, obstacle.width - 4, obstacle.height - 4);
    fillPixelRect(context, x, top + 10, obstacle.width - 6, obstacle.height - 10);
    fillPixelRect(context, x + obstacle.width - 6, top, 6, obstacle.height);
    return;
  }

  if (obstacle.kind === "mmp") {
    drawMmpObstacle(context, x, top, obstacle.width, obstacle.height);
    return;
  }

  if (obstacle.kind === "trump") {
    drawTrumpObstacle(context, x, top);
    return;
  }

  fillPixelRect(context, x + 1, top + 8, 2, obstacle.height - 8);
  fillPixelRect(context, x + 4, top + 2, 2, obstacle.height - 2);
  fillPixelRect(context, x + 7, top + 6, 2, obstacle.height - 6);
  fillPixelRect(context, x, top + 7, obstacle.width, 3);
}

function drawGame(
  canvas: HTMLCanvasElement,
  size: CanvasSize,
  state: GameState,
) {
  const context = canvas.getContext("2d");
  if (!context || size.width <= 0 || size.height <= 0) return;

  const groundY = size.height - GROUND_OFFSET;
  const duckTop = groundY - DUCK_HEIGHT - state.duckRise;
  const dashOffset = (state.elapsed * state.speed) % 18;

  context.clearRect(0, 0, size.width, size.height);
  fillPixelRect(context, 0, 0, size.width, size.height, "#f7f4eb");

  fillPixelRect(context, 0, groundY, size.width, 2);
  for (let x = -dashOffset; x < size.width + 18; x += 18) {
    fillPixelRect(context, x, groundY + 6, 10, 2);
  }

  for (const obstacle of state.obstacles) {
    drawObstacle(context, obstacle, groundY);
  }

  drawDuck(
    context,
    DUCK_X,
    duckTop,
    state.elapsed,
    state.duckRise > 1,
    state.mode === "crashed",
  );

  context.fillStyle = "#111111";
  context.font = "700 10px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.textBaseline = "top";

  const scoreLabel = String(Math.floor(state.score)).padStart(4, "0");
  context.fillText(scoreLabel, Math.max(8, size.width - 42), 8);

  if (state.mode !== "running") {
    const label =
      state.mode === "crashed"
        ? uiStrings.preStartDuckGameCrash
        : uiStrings.preStartDuckGameIdle;
    const metrics = context.measureText(label);
    context.fillText(label, Math.max(8, (size.width - metrics.width) / 2), 8);
  }
}

export function WaitingRoomDuckGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState>(createGameState());
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const sizeRef = useRef<CanvasSize>({ height: GAME_HEIGHT, width: 0 });
  const descriptionId = useId();

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.max(0, Math.round(rect.width));
    const nextHeight = Math.max(0, Math.round(rect.height));
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

    sizeRef.current = { height: nextHeight, width: nextWidth };
    canvas.width = Math.max(1, Math.round(nextWidth * dpr));
    canvas.height = Math.max(1, Math.round(nextHeight * dpr));

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
    drawGame(canvas, sizeRef.current, gameStateRef.current);
  }, []);

  const jumpOrRestart = useCallback(() => {
    const size = sizeRef.current;
    const current = gameStateRef.current;

    if (current.mode === "crashed") {
      const restarted = createGameState();
      restarted.mode = "running";
      gameStateRef.current = restarted;
      lastFrameRef.current = null;
      const canvas = canvasRef.current;
      if (canvas && size.width > 0) {
        drawGame(canvas, size, restarted);
      }
      return;
    }

    const next = gameStateRef.current;
    next.mode = "running";
    next.spawnCooldown = Math.max(0.7, next.spawnCooldown);
    if (next.duckRise <= 0.5) {
      next.duckVelocity = JUMP_VELOCITY;
    }

    const canvas = canvasRef.current;
    if (canvas && size.width > 0) {
      drawGame(canvas, size, next);
    }
  }, []);

  useEffect(() => {
    syncCanvasSize();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasSize();
    });
    resizeObserver.observe(canvas);

    const tick = (now: number) => {
      const previous = lastFrameRef.current ?? now;
      const delta = clampDelta(now - previous);
      lastFrameRef.current = now;

      const size = sizeRef.current;
      const canvasElement = canvasRef.current;
      const state = gameStateRef.current;

      if (state.mode === "running" && size.width > 0) {
        state.elapsed += delta;
        state.speed = Math.min(MAX_SPEED, state.speed + SPEED_GAIN * delta);
        state.score += delta * state.speed * 0.12;

        state.duckRise += state.duckVelocity * delta;
        state.duckVelocity -= GRAVITY * delta;
        if (state.duckRise <= 0) {
          state.duckRise = 0;
          state.duckVelocity = 0;
        }

        state.spawnCooldown -= delta;
        if (state.spawnCooldown <= 0) {
          state.obstacles.push(createObstacle(size.width));
          const speedFactor = (state.speed - START_SPEED) / (MAX_SPEED - START_SPEED);
          state.spawnCooldown = randomBetween(0.82, 1.4) - speedFactor * 0.18;
        }

        state.obstacles = state.obstacles
          .map((obstacle) => ({ ...obstacle, x: obstacle.x - state.speed * delta }))
          .filter((obstacle) => obstacle.x + obstacle.width > -8);

        if (hitTest(state, size.height - GROUND_OFFSET)) {
          state.mode = "crashed";
          state.duckRise = 0;
          state.duckVelocity = 0;
        }
      }

      if (canvasElement) {
        drawGame(canvasElement, size, state);
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      resizeObserver.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
      lastFrameRef.current = null;
    };
  }, [syncCanvasSize]);

  return (
    <div className="mt-6">
      <button
        type="button"
        onKeyDown={(event) => {
          if (
            event.key === " " ||
            event.key === "Enter" ||
            event.key === "ArrowUp"
          ) {
            event.preventDefault();
            jumpOrRestart();
          }
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          event.preventDefault();
          jumpOrRestart();
        }}
        aria-describedby={descriptionId}
        aria-label={uiStrings.preStartDuckGameAria}
        className="block h-[106px] w-full select-none touch-manipulation overflow-hidden border-[3px] border-foreground bg-background brutal-shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brutal-accent/30"
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          aria-hidden
        />
      </button>
      <p id={descriptionId} className="sr-only">
        {uiStrings.preStartDuckGameHint}
      </p>
    </div>
  );
}
