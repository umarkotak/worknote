import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, Pause, Play, ScanSearch, SkipBack, SkipForward, SplitSquareVertical, Upload } from "lucide-react";
import { toast } from "react-toastify";

import { useDashboardSession } from "@/components/session/DashboardSessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialSettings = {
  mode: "auto",
  alphaThreshold: 10,
  treatWhiteAsEmpty: true,
  whiteThreshold: 245,
  minObjectPixels: 20,
  outputColumns: 8,
  cellPadding: 8,
  fps: 8,
  scale: 2,
  loop: true,
  gridRows: 4,
  gridColumns: 4,
};

function createPlaceholder(canvas, message) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  canvas.width = 640;
  canvas.height = 180;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#666666";
  ctx.font = "16px Arial";
  ctx.fillText(message, 20, 92);
}

function buildSolidMask(data, width, height, alphaThreshold, treatWhiteAsEmpty, whiteThreshold) {
  const mask = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      let isEmpty = a <= alphaThreshold;

      if (!isEmpty && treatWhiteAsEmpty) {
        if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold) {
          isEmpty = true;
        }
      }

      mask[y * width + x] = isEmpty ? 0 : 1;
    }
  }

  return mask;
}

function findConnectedComponents(mask, width, height, minObjectPixels) {
  const visited = new Uint8Array(width * height);
  const components = [];
  const neighbors = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1],
  ];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const startIndex = y * width + x;
      if (!mask[startIndex] || visited[startIndex]) continue;

      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      const pixels = [];
      const queue = [[x, y]];
      visited[startIndex] = 1;

      while (queue.length > 0) {
        const [cx, cy] = queue.pop();
        pixels.push([cx, cy]);

        if (cx < minX) minX = cx;
        if (cy < minY) minY = cy;
        if (cx > maxX) maxX = cx;
        if (cy > maxY) maxY = cy;

        for (const [dx, dy] of neighbors) {
          const nx = cx + dx;
          const ny = cy + dy;

          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

          const nextIndex = ny * width + nx;
          if (!mask[nextIndex] || visited[nextIndex]) continue;

          visited[nextIndex] = 1;
          queue.push([nx, ny]);
        }
      }

      if (pixels.length >= minObjectPixels) {
        components.push({ minX, minY, maxX, maxY, pixels });
      }
    }
  }

  components.sort((a, b) => {
    const rowTolerance = 10;
    if (Math.abs(a.minY - b.minY) > rowTolerance) {
      return a.minY - b.minY;
    }

    return a.minX - b.minX;
  });

  return components;
}

function createSpriteCanvas(width, height, imageData) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

function extractSpritesFromComponents(components, sourceImageData, sourceWidth) {
  return components.map((component) => {
    const width = component.maxX - component.minX + 1;
    const height = component.maxY - component.minY + 1;
    const spriteImageData = new ImageData(width, height);

    for (const [sourceX, sourceY] of component.pixels) {
      const sourceIndex = (sourceY * sourceWidth + sourceX) * 4;
      const targetX = sourceX - component.minX;
      const targetY = sourceY - component.minY;
      const targetIndex = (targetY * width + targetX) * 4;

      spriteImageData.data[targetIndex] = sourceImageData.data[sourceIndex];
      spriteImageData.data[targetIndex + 1] = sourceImageData.data[sourceIndex + 1];
      spriteImageData.data[targetIndex + 2] = sourceImageData.data[sourceIndex + 2];
      spriteImageData.data[targetIndex + 3] = sourceImageData.data[sourceIndex + 3];
    }

    return {
      canvas: createSpriteCanvas(width, height, spriteImageData),
      width,
      height,
      anchorX: Math.floor(width / 2),
      anchorY: height - 1,
      pixelCount: component.pixels.length,
    };
  });
}

function extractGridSprites(sourceImageData, sourceWidth, sourceHeight, settings) {
  const rows = Math.max(1, Number(settings.gridRows) || 1);
  const columns = Math.max(1, Number(settings.gridColumns) || 1);
  const cellWidth = Math.floor(sourceWidth / columns);
  const cellHeight = Math.floor(sourceHeight / rows);
  const sprites = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const startX = column * cellWidth;
      const startY = row * cellHeight;
      const width = column === columns - 1 ? sourceWidth - startX : cellWidth;
      const height = row === rows - 1 ? sourceHeight - startY : cellHeight;
      const cellImageData = new ImageData(width, height);

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const sourceIndex = ((startY + y) * sourceWidth + (startX + x)) * 4;
          const targetIndex = (y * width + x) * 4;

          cellImageData.data[targetIndex] = sourceImageData.data[sourceIndex];
          cellImageData.data[targetIndex + 1] = sourceImageData.data[sourceIndex + 1];
          cellImageData.data[targetIndex + 2] = sourceImageData.data[sourceIndex + 2];
          cellImageData.data[targetIndex + 3] = sourceImageData.data[sourceIndex + 3];
        }
      }

      const mask = buildSolidMask(
        cellImageData.data,
        width,
        height,
        Number(settings.alphaThreshold),
        settings.treatWhiteAsEmpty,
        Number(settings.whiteThreshold)
      );

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      let pixelCount = 0;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (!mask[y * width + x]) continue;

          pixelCount += 1;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }

      if (pixelCount < Math.max(1, Number(settings.minObjectPixels) || 1)) {
        continue;
      }

      const trimmedWidth = maxX - minX + 1;
      const trimmedHeight = maxY - minY + 1;
      const trimmedImageData = new ImageData(trimmedWidth, trimmedHeight);

      for (let y = 0; y < trimmedHeight; y += 1) {
        for (let x = 0; x < trimmedWidth; x += 1) {
          const sourceIndex = ((minY + y) * width + (minX + x)) * 4;
          const targetIndex = (y * trimmedWidth + x) * 4;

          trimmedImageData.data[targetIndex] = cellImageData.data[sourceIndex];
          trimmedImageData.data[targetIndex + 1] = cellImageData.data[sourceIndex + 1];
          trimmedImageData.data[targetIndex + 2] = cellImageData.data[sourceIndex + 2];
          trimmedImageData.data[targetIndex + 3] = cellImageData.data[sourceIndex + 3];
        }
      }

      sprites.push({
        canvas: createSpriteCanvas(trimmedWidth, trimmedHeight, trimmedImageData),
        width: trimmedWidth,
        height: trimmedHeight,
        anchorX: Math.floor(trimmedWidth / 2),
        anchorY: trimmedHeight - 1,
        pixelCount,
      });
    }
  }

  return sprites;
}

function buildNormalizedFrames(sprites, selectedIndices, cellPadding) {
  const selectedSet = new Set(selectedIndices);
  const selectedSprites = sprites.filter((_, index) => selectedSet.has(index));

  if (!selectedSprites.length) {
    return { frames: [], cellWidth: 0, cellHeight: 0 };
  }

  const padding = Math.max(0, Number(cellPadding) || 0);
  const maxWidth = Math.max(...selectedSprites.map((sprite) => sprite.width));
  const maxHeight = Math.max(...selectedSprites.map((sprite) => sprite.height));
  const cellWidth = maxWidth + padding * 2;
  const cellHeight = maxHeight + padding * 2;

  const frames = selectedSprites.map((sprite) => {
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = cellWidth;
    frameCanvas.height = cellHeight;

    const frameCtx = frameCanvas.getContext("2d");
    frameCtx.imageSmoothingEnabled = false;

    const targetAnchorX = Math.floor(cellWidth / 2);
    const targetAnchorY = cellHeight - padding - 1;
    const drawX = targetAnchorX - sprite.anchorX;
    const drawY = targetAnchorY - sprite.anchorY;

    frameCtx.drawImage(sprite.canvas, drawX, drawY);

    return frameCanvas;
  });

  return { frames, cellWidth, cellHeight };
}

function drawDetectedSprites(canvas, sprites, selectedIndices, previewBoxesRef) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  previewBoxesRef.current = [];

  if (!sprites.length) {
    createPlaceholder(canvas, "No sprites detected yet.");
    return;
  }

  const gap = 12;
  const columns = 6;
  const maxWidth = Math.max(...sprites.map((sprite) => sprite.width));
  const maxHeight = Math.max(...sprites.map((sprite) => sprite.height));
  const boxWidth = maxWidth + 20;
  const boxHeight = maxHeight + 28;
  const rows = Math.ceil(sprites.length / columns);

  canvas.width = columns * (boxWidth + gap) + gap;
  canvas.height = rows * (boxHeight + gap) + gap;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  const selectedSet = new Set(selectedIndices);

  sprites.forEach((sprite, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = gap + column * (boxWidth + gap);
    const y = gap + row * (boxHeight + gap);
    const isSelected = selectedSet.has(index);

    previewBoxesRef.current.push({ x, y, width: boxWidth, height: boxHeight, index });

    ctx.fillStyle = isSelected ? "#dff3ff" : "#f2f2f2";
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.strokeStyle = isSelected ? "#1e88e5" : "#bbbbbb";
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    const drawX = x + Math.floor((boxWidth - sprite.width) / 2);
    const drawY = y + (boxHeight - 18 - sprite.height);
    ctx.drawImage(sprite.canvas, drawX, drawY);

    const anchorX = x + Math.floor(boxWidth / 2);
    const anchorY = y + boxHeight - 19;
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ff3b30";
    ctx.fill();

    ctx.fillStyle = "#333333";
    ctx.fillText(String(index), x + boxWidth / 2, y + boxHeight - 4);
  });
}

function drawOutputSpritesheet(canvas, frames, outputColumns) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!frames.length) {
    createPlaceholder(canvas, "No output yet.");
    return;
  }

  const columns = Math.max(1, Number(outputColumns) || 1);
  const rows = Math.ceil(frames.length / columns);
  const cellWidth = frames[0].width;
  const cellHeight = frames[0].height;

  canvas.width = columns * cellWidth;
  canvas.height = rows * cellHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  frames.forEach((frame, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    ctx.drawImage(frame, column * cellWidth, row * cellHeight);
  });
}

function drawAnimationPlayer(canvas, frames, currentFrame, scale, cellPadding) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!frames.length) {
    canvas.width = 520;
    canvas.height = 360;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#dddddd";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 24);
    ctx.lineTo(canvas.width, canvas.height - 24);
    ctx.stroke();
    ctx.fillStyle = "#666666";
    ctx.font = "16px Arial";
    ctx.fillText("No selected frames.", 20, 40);
    return;
  }

  const frame = frames[currentFrame] || frames[0];
  const playerScale = Math.max(1, Number(scale) || 1);
  const drawWidth = frame.width * playerScale;
  const drawHeight = frame.height * playerScale;
  const horizontalPadding = 72;
  const verticalPadding = 88;

  canvas.width = Math.max(520, drawWidth + horizontalPadding);
  canvas.height = Math.max(360, drawHeight + verticalPadding);

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#dddddd";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 24);
  ctx.lineTo(canvas.width, canvas.height - 24);
  ctx.stroke();

  const drawX = Math.floor((canvas.width - drawWidth) / 2);
  const drawY = Math.floor((canvas.height - drawHeight) / 2);

  ctx.drawImage(frame, drawX, drawY, drawWidth, drawHeight);

  const anchorX = drawX + Math.floor(frame.width / 2) * playerScale;
  const anchorY = drawY + (frame.height - Math.max(0, Number(cellPadding) || 0) - 1) * playerScale;

  ctx.fillStyle = "#ff3b30";
  ctx.beginPath();
  ctx.arc(anchorX, anchorY, 3, 0, Math.PI * 2);
  ctx.fill();
}

export default function SpritesheetPlayerPage() {
  useDashboardSession();
  const [settings, setSettings] = useState(initialSettings);
  const [imageMeta, setImageMeta] = useState(null);
  const [sprites, setSprites] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [normalizedFrames, setNormalizedFrames] = useState([]);
  const [cellSize, setCellSize] = useState({ width: 0, height: 0 });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const loadedImageRef = useRef(null);
  const sourceCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const playerCanvasRef = useRef(null);
  const previewBoxesRef = useRef([]);

  useEffect(() => {
    createPlaceholder(sourceCanvasRef.current, "Upload a spritesheet to begin.");
    createPlaceholder(previewCanvasRef.current, "No sprites detected yet.");
    createPlaceholder(outputCanvasRef.current, "No output yet.");
    drawAnimationPlayer(playerCanvasRef.current, [], 0, settings.scale, settings.cellPadding);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const { frames, cellWidth, cellHeight } = buildNormalizedFrames(sprites, selectedIndices, settings.cellPadding);
    setNormalizedFrames(frames);
    setCellSize({ width: cellWidth, height: cellHeight });
  }, [sprites, selectedIndices, settings.cellPadding]);

  useEffect(() => {
    drawDetectedSprites(previewCanvasRef.current, sprites, selectedIndices, previewBoxesRef);
  }, [sprites, selectedIndices]);

  useEffect(() => {
    drawOutputSpritesheet(outputCanvasRef.current, normalizedFrames, settings.outputColumns);
  }, [normalizedFrames, settings.outputColumns]);

  useEffect(() => {
    if (currentFrame >= normalizedFrames.length && normalizedFrames.length > 0) {
      setCurrentFrame(0);
      return;
    }

    if (!normalizedFrames.length) {
      setCurrentFrame(0);
    }
  }, [currentFrame, normalizedFrames.length]);

  useEffect(() => {
    drawAnimationPlayer(playerCanvasRef.current, normalizedFrames, currentFrame, settings.scale, settings.cellPadding);
  }, [normalizedFrames, currentFrame, settings.scale, settings.cellPadding]);

  useEffect(() => {
    if (!isPlaying || normalizedFrames.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setCurrentFrame((previousFrame) => {
        const nextFrame = previousFrame + 1;

        if (nextFrame < normalizedFrames.length) {
          return nextFrame;
        }

        if (settings.loop) {
          return 0;
        }

        setIsPlaying(false);
        return normalizedFrames.length - 1;
      });
    }, Math.max(1000 / Math.max(1, Number(settings.fps) || 1), 16));

    return () => window.clearInterval(intervalId);
  }, [isPlaying, normalizedFrames.length, settings.fps, settings.loop]);

  const selectionStatus = useMemo(
    () => `Detected: ${sprites.length} | Selected: ${selectedIndices.length}`,
    [sprites.length, selectedIndices.length]
  );

  const playerStatus = useMemo(
    () => `Frame: ${normalizedFrames.length ? currentFrame + 1 : 0} / ${normalizedFrames.length}`,
    [currentFrame, normalizedFrames.length]
  );

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        loadedImageRef.current = image;
        setImageMeta({ name: file.name, width: image.width, height: image.height });

        const sourceCanvas = sourceCanvasRef.current;
        const sourceCtx = sourceCanvas.getContext("2d");
        sourceCanvas.width = image.width;
        sourceCanvas.height = image.height;
        sourceCtx.clearRect(0, 0, image.width, image.height);
        sourceCtx.drawImage(image, 0, 0);

        setSprites([]);
        setSelectedIndices([]);
        setNormalizedFrames([]);
        setCurrentFrame(0);
        setIsPlaying(false);
      };
      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  };

  const processImage = () => {
    if (!loadedImageRef.current || !sourceCanvasRef.current) {
      toast.error("Please upload an image first.");
      return;
    }

    const sourceCanvas = sourceCanvasRef.current;
    const sourceCtx = sourceCanvas.getContext("2d");
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const imageData = sourceCtx.getImageData(0, 0, width, height);

    let nextSprites = [];

    if (settings.mode === "auto") {
      const mask = buildSolidMask(
        imageData.data,
        width,
        height,
        Number(settings.alphaThreshold),
        settings.treatWhiteAsEmpty,
        Number(settings.whiteThreshold)
      );
      const components = findConnectedComponents(mask, width, height, Math.max(1, Number(settings.minObjectPixels) || 1));
      nextSprites = extractSpritesFromComponents(components, imageData, width);
    } else {
      nextSprites = extractGridSprites(imageData, width, height, settings);
    }

    setSprites(nextSprites);
    setSelectedIndices(nextSprites.map((_, index) => index));
    setCurrentFrame(0);
    setIsPlaying(false);

    if (!nextSprites.length) {
      toast.info("No frames matched the current settings.");
    }
  };

  const handlePreviewClick = (event) => {
    if (!sprites.length) return;

    const previewCanvas = previewCanvasRef.current;
    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = previewCanvas.width / rect.width;
    const scaleY = previewCanvas.height / rect.height;
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    for (const box of previewBoxesRef.current) {
      if (
        mouseX >= box.x &&
        mouseX <= box.x + box.width &&
        mouseY >= box.y &&
        mouseY <= box.y + box.height
      ) {
        setSelectedIndices((current) => {
          const exists = current.includes(box.index);
          const next = exists ? current.filter((index) => index !== box.index) : [...current, box.index].sort((a, b) => a - b);
          return next;
        });
        setCurrentFrame(0);
        setIsPlaying(false);
        break;
      }
    }
  };

  const selectAllSprites = () => {
    setSelectedIndices(sprites.map((_, index) => index));
    setCurrentFrame(0);
  };

  const clearSelection = () => {
    setSelectedIndices([]);
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  const stepFrame = (direction) => {
    if (!normalizedFrames.length) return;

    setIsPlaying(false);
    setCurrentFrame((previousFrame) => {
      let nextFrame = previousFrame + direction;
      if (nextFrame < 0) nextFrame = normalizedFrames.length - 1;
      if (nextFrame >= normalizedFrames.length) nextFrame = 0;
      return nextFrame;
    });
  };

  const downloadOutput = () => {
    if (!normalizedFrames.length || !outputCanvasRef.current) {
      toast.error("No selected frames to export.");
      return;
    }

    const link = document.createElement("a");
    link.download = "adjusted_spritesheet.png";
    link.href = outputCanvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-56px)] w-full max-w-[1600px] p-2">
        <div className="grid gap-2 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
            <div className="border-b border-[#3c3c3c] bg-[radial-gradient(circle_at_top_right,_rgba(0,122,204,0.2),_transparent_38%),linear-gradient(180deg,_rgba(30,30,30,0.98),_rgba(37,37,38,0.98))] px-4 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#9cdcfe]">Spritesheet Utility</p>
                  <h1 className="mt-2 font-[var(--font-heading)] text-2xl text-[#f3f3f3]">Spritesheet Player</h1>
                </div>
                <Link href="/a/tools" className="text-sm text-[#9cdcfe] transition-colors hover:text-white">
                  Back to tools
                </Link>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#aeb6bf]">
                Upload a sheet, extract frames with auto object detection or a row-by-column grid, then rebuild and preview the animation.
              </p>
            </div>

            <div className="space-y-4 p-4">
              <div className="rounded-xl border border-[#3c3c3c] bg-[#1f1f1f] p-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Spritesheet image</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#3c3c3c] bg-[#252526] px-4 py-5 text-sm text-[#d4d4d4] transition-colors hover:border-[#007acc] hover:text-white">
                  <Upload className="h-4 w-4 text-[#9cdcfe]" />
                  <span>{imageMeta ? `Replace ${imageMeta.name}` : "Choose image"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                </label>
                <p className="mt-2 text-xs text-[#8f979f]">
                  {imageMeta ? `${imageMeta.width} x ${imageMeta.height}px` : "PNG works best for transparent sprite sheets."}
                </p>
              </div>

              <div className="rounded-xl border border-[#3c3c3c] bg-[#1f1f1f] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Selection mode</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => updateSetting("mode", "auto")}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      settings.mode === "auto"
                        ? "border-[#007acc] bg-[#0f2f45] text-[#eaf6ff]"
                        : "border-[#3c3c3c] bg-[#252526] text-[#9da1a6] hover:bg-[#2d2d30]"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <ScanSearch className="h-4 w-4" />
                      Auto object detection
                    </div>
                    <p className="mt-2 text-xs leading-5">Use transparency and near-white filtering to isolate each frame automatically.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSetting("mode", "grid")}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      settings.mode === "grid"
                        ? "border-[#f59e0b] bg-[#3a280b] text-[#fff1d1]"
                        : "border-[#3c3c3c] bg-[#252526] text-[#9da1a6] hover:bg-[#2d2d30]"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <SplitSquareVertical className="h-4 w-4" />
                      Row by column grid
                    </div>
                    <p className="mt-2 text-xs leading-5">Split the full sheet by grid rows and columns, then trim each cell down to visible pixels.</p>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#3c3c3c] bg-[#1f1f1f] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Detection controls</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs text-[#9da1a6]">Empty alpha threshold</label>
                    <Input type="number" min="0" max="255" value={settings.alphaThreshold} onChange={(event) => updateSetting("alphaThreshold", event.target.value)} className="border-[#3c3c3c] bg-[#252526] text-[#f3f3f3]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-[#9da1a6]">White threshold</label>
                    <Input type="number" min="0" max="255" value={settings.whiteThreshold} onChange={(event) => updateSetting("whiteThreshold", event.target.value)} className="border-[#3c3c3c] bg-[#252526] text-[#f3f3f3]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-[#9da1a6]">Min object pixels</label>
                    <Input type="number" min="1" value={settings.minObjectPixels} onChange={(event) => updateSetting("minObjectPixels", event.target.value)} className="border-[#3c3c3c] bg-[#252526] text-[#f3f3f3]" />
                  </div>
                  <label className="flex items-center gap-3 rounded-lg border border-[#3c3c3c] bg-[#252526] px-3 py-3 text-sm text-[#d4d4d4]">
                    <input type="checkbox" checked={settings.treatWhiteAsEmpty} onChange={(event) => updateSetting("treatWhiteAsEmpty", event.target.checked)} />
                    Treat near-white as empty
                  </label>
                </div>

                {settings.mode === "grid" ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs text-[#9da1a6]">Rows</label>
                      <Input type="number" min="1" value={settings.gridRows} onChange={(event) => updateSetting("gridRows", event.target.value)} className="border-[#3c3c3c] bg-[#252526] text-[#f3f3f3]" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-[#9da1a6]">Columns</label>
                      <Input type="number" min="1" value={settings.gridColumns} onChange={(event) => updateSetting("gridColumns", event.target.value)} className="border-[#3c3c3c] bg-[#252526] text-[#f3f3f3]" />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-[#3c3c3c] bg-[#1f1f1f] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9da1a6]">Output controls</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs text-[#9da1a6]">Output columns</label>
                    <Input type="number" min="1" value={settings.outputColumns} onChange={(event) => updateSetting("outputColumns", event.target.value)} className="border-[#3c3c3c] bg-[#252526] text-[#f3f3f3]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-[#9da1a6]">Cell padding</label>
                    <Input type="number" min="0" value={settings.cellPadding} onChange={(event) => updateSetting("cellPadding", event.target.value)} className="border-[#3c3c3c] bg-[#252526] text-[#f3f3f3]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={processImage} className="rounded-md bg-[#007acc] text-white hover:bg-[#0e639c]">
                  Process
                </Button>
                <Button onClick={selectAllSprites} variant="secondary" className="rounded-md bg-[#2d2d30] text-[#f3f3f3] hover:bg-[#36363a]">
                  Select all
                </Button>
                <Button onClick={clearSelection} variant="secondary" className="rounded-md bg-[#2d2d30] text-[#f3f3f3] hover:bg-[#36363a]">
                  Clear selection
                </Button>
                <Button onClick={downloadOutput} variant="secondary" className="rounded-md bg-[#f59e0b] text-[#1f1f1f] hover:bg-[#f3b23b]">
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="grid gap-2 xl:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
                <div className="border-b border-[#3c3c3c] px-4 py-3">
                  <h2 className="font-[var(--font-heading)] text-lg text-[#f3f3f3]">Original</h2>
                </div>
                <div className="overflow-auto bg-[#1a1a1a] p-4">
                  <canvas ref={sourceCanvasRef} className="max-w-full border border-[#3c3c3c] bg-white [image-rendering:pixelated]" />
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
                <div className="border-b border-[#3c3c3c] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-[var(--font-heading)] text-lg text-[#f3f3f3]">Detected sprites</h2>
                      <p className="mt-1 text-xs text-[#9da1a6]">Click any detected frame to include or remove it from output and playback.</p>
                    </div>
                    <p className="text-sm text-[#9cdcfe]">{selectionStatus}</p>
                  </div>
                </div>
                <div className="overflow-auto bg-[#1a1a1a] p-4">
                  <canvas ref={previewCanvasRef} onClick={handlePreviewClick} className="max-w-full cursor-pointer border border-[#3c3c3c] bg-white [image-rendering:pixelated]" />
                </div>
              </div>
            </div>

            <div className="grid gap-2 xl:grid-cols-[1fr_0.88fr]">
              <div className="overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
                <div className="border-b border-[#3c3c3c] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-[var(--font-heading)] text-lg text-[#f3f3f3]">Adjusted output spritesheet</h2>
                    <p className="text-xs text-[#9da1a6]">Cell: {cellSize.width || 0} x {cellSize.height || 0}</p>
                  </div>
                </div>
                <div className="overflow-auto bg-[#1a1a1a] p-4">
                  <canvas ref={outputCanvasRef} className="max-w-full border border-[#3c3c3c] bg-white [image-rendering:pixelated]" />
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
                <div className="border-b border-[#3c3c3c] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-[var(--font-heading)] text-lg text-[#f3f3f3]">Animation player</h2>
                    <p className="text-sm text-[#9cdcfe]">{playerStatus}</p>
                  </div>
                </div>
                <div className="space-y-4 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => setIsPlaying((current) => !current)} className="rounded-md bg-[#007acc] text-white hover:bg-[#0e639c]">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button onClick={() => stepFrame(-1)} variant="secondary" className="rounded-md bg-[#2d2d30] text-[#f3f3f3] hover:bg-[#36363a]">
                      <SkipBack className="h-4 w-4" />
                      Prev
                    </Button>
                    <Button onClick={() => stepFrame(1)} variant="secondary" className="rounded-md bg-[#2d2d30] text-[#f3f3f3] hover:bg-[#36363a]">
                      <SkipForward className="h-4 w-4" />
                      Next
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs text-[#9da1a6]">FPS</label>
                      <Input type="number" min="1" max="60" value={settings.fps} onChange={(event) => updateSetting("fps", event.target.value)} className="border-[#3c3c3c] bg-[#1f1f1f] text-[#f3f3f3]" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-[#9da1a6]">Scale</label>
                      <Input type="number" min="1" max="10" value={settings.scale} onChange={(event) => updateSetting("scale", event.target.value)} className="border-[#3c3c3c] bg-[#1f1f1f] text-[#f3f3f3]" />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 rounded-lg border border-[#3c3c3c] bg-[#1f1f1f] px-3 py-3 text-sm text-[#d4d4d4]">
                    <input type="checkbox" checked={settings.loop} onChange={(event) => updateSetting("loop", event.target.checked)} />
                    Loop playback
                  </label>

                  <div className="overflow-auto rounded-xl border border-[#3c3c3c] bg-[#1a1a1a] p-3">
                    <canvas ref={playerCanvasRef} width="520" height="360" className="mx-auto block max-w-full border border-[#3c3c3c] bg-white [image-rendering:pixelated]" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
  );
}
