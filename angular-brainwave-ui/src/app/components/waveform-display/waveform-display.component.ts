import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrainwaveService } from '../../services/brainwave.service';

@Component({
  selector: 'app-waveform-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="waveform-container bg-gray-800 rounded-lg p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold text-gray-300">Live Signal</h3>
        <div class="text-xs text-gray-500">{{ fps() }} FPS</div>
      </div>
      <canvas 
        #waveformCanvas
        [width]="canvasWidth"
        [height]="canvasHeight"
        class="w-full rounded bg-gray-900"
        style="image-rendering: crisp-edges;">
      </canvas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .waveform-container {
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    canvas {
      display: block;
    }
  `]
})
export class WaveformDisplayComponent implements OnInit, OnDestroy {
  @ViewChild('waveformCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private dataPoints: number[] = [];
  private maxDataPoints = 100; // Keep last 100 points for smooth scrolling
  
  canvasWidth = 800;
  canvasHeight = 80;
  
  fps = signal<number>(0);
  private frameCount = 0;
  private lastFpsUpdate = Date.now();

  dominantColor = computed(() => {
    const band = this.brainwaveService.currentData()?.dominantBand;
    return this.brainwaveService.getBandColor(band || 'alpha');
  });

  constructor(private brainwaveService: BrainwaveService) {}

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    // Subscribe to brainwave data
    this.brainwaveService.data$.subscribe(data => {
      // Use dominant band power as the wave value
      const value = data.bandPowers[data.dominantBand as keyof typeof data.bandPowers];
      this.addDataPoint(value);
    });

    // Start animation loop
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private addDataPoint(value: number): void {
    this.dataPoints.push(value);
    
    // Keep only the last N points
    if (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints.shift();
    }
  }

  private animate(): void {
    this.draw();
    this.updateFps();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    if (this.dataPoints.length < 2) return;

    // Draw grid lines
    this.drawGrid(ctx, width, height);

    // Draw waveform
    const color = this.dominantColor();
    const pointSpacing = width / (this.maxDataPoints - 1);
    const centerY = height / 2;
    const amplitude = height * 0.4; // Use 40% of height for wave amplitude

    // Draw glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;

    // Draw the waveform line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.dataPoints.forEach((value, index) => {
      const x = index * pointSpacing;
      const y = centerY - (value * amplitude * 2 - amplitude); // Normalize to -1 to 1 range
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw filled area under curve
    ctx.lineTo(width, centerY);
    ctx.lineTo(0, centerY);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '05');
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Horizontal grid lines
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  private updateFps(): void {
    this.frameCount++;
    const now = Date.now();
    const elapsed = now - this.lastFpsUpdate;

    if (elapsed >= 1000) {
      this.fps.set(Math.round((this.frameCount / elapsed) * 1000));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
}
