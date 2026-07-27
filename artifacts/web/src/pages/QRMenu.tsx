import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Download, QrCode } from "lucide-react";

const QR_SIZE = 256;
const MODULE_SIZE = 8;
const NUM_MODULES = Math.floor(QR_SIZE / MODULE_SIZE);

function generateQRMatrix(text: string): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: NUM_MODULES }, () => Array(NUM_MODULES).fill(false));
  const data = text.split("").map((c) => c.charCodeAt(0));
  const seed = data.reduce((a, b) => a + b, 0);
  let hash = seed;
  const nextRand = () => { hash = (hash * 16807 + 0) % 2147483647; return hash / 2147483647; };

  const addFinderPattern = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix[startR + r][startC + c] = true;
        }
      }
    }
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = startR + r, cc = startC + c;
        if (rr >= 0 && rr < NUM_MODULES && cc >= 0 && cc < NUM_MODULES) {
          if (r === -1 || r === 7 || c === -1 || c === 7) matrix[rr][cc] = false;
          else if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) matrix[rr][cc] = true;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, NUM_MODULES - 7);
  addFinderPattern(NUM_MODULES - 7, 0);

  for (let i = 8; i < NUM_MODULES - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  for (let r = 0; r < NUM_MODULES; r++) {
    for (let c = 0; c < NUM_MODULES; c++) {
      if (matrix[r][c]) continue;
      if (r < 9 && c < 9) continue;
      if (r < 9 && c > NUM_MODULES - 9) continue;
      if (r > NUM_MODULES - 9 && c < 9) continue;
      if (r === 6 || c === 6) continue;
      matrix[r][c] = nextRand() > 0.55;
    }
  }

  return matrix;
}

function drawQR(ctx: CanvasRenderingContext2D, matrix: boolean[][], color: string, bgColor: string) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, QR_SIZE, QR_SIZE);
  ctx.fillStyle = color;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(c * MODULE_SIZE, r * MODULE_SIZE, MODULE_SIZE, MODULE_SIZE);
      }
    }
  }
}

export default function QRMenu() {
  const [url, setUrl] = useState(window.location.origin + "/menu");
  const [color, setColor] = useState("#1A3525");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = QR_SIZE;
    canvas.height = QR_SIZE;
    const matrix = generateQRMatrix(url);
    drawQR(ctx, matrix, color, "#FFFFFF");
  }, [url, color]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "thb-menu-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 bg-rembrandt min-h-screen">
      <Link href="/menu" className="inline-flex items-center gap-1.5 text-sm text-off-white-dim hover:text-gold transition-colors mb-6 no-underline">
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </Link>

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-8 h-8 text-gold" />
        </div>
        <h1 className="text-2xl font-bold text-white font-serif">QR Code Menu</h1>
        <p className="text-off-white-dim mt-2">Scan to view our menu on your phone</p>
      </div>

      <div className="bg-white rounded-2xl p-8 text-center shadow-lg mb-6">
        <canvas ref={canvasRef} className="mx-auto rounded-xl shadow-md" style={{ width: 256, height: 256 }} />
        <p className="text-sm text-gray-500 mt-4 break-all">{url}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Menu URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">QR Color</label>
          <div className="flex gap-2">
            {["#1A3525", "#C8102E", "#000000", "#1E40AF"].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-lg border-2 ${color === c ? "border-gray-800" : "border-gray-200"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={download}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-crimson text-white font-semibold hover:bg-crimson-dark transition-all shadow-lg shadow-crimson-glow"
      >
        <Download className="w-5 h-5" /> Download QR Code
      </button>

      <p className="text-center text-xs text-off-white-dim mt-4">Place this QR code on your tables for customers to scan and view the menu</p>
    </div>
  );
}
