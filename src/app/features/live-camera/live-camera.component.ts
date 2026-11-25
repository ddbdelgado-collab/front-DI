import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CentinelaDataService } from '../../core/services/centinela-data.service';
import { Camera, Incident } from '../../core/models/database.models';
import { IncidentReviewModalComponent } from '../../shared/components/incident-review-modal/incident-review-modal.component';

interface LiveLogEntry {
  id: number;
  title: string;
  subtitle: string;
  time: string;
  type: 'camera' | 'alert' | 'confirmed' | 'siren';
}

@Component({
  selector: 'app-live-camera',
  standalone: true,
  imports: [CommonModule, FormsModule, IncidentReviewModalComponent],
  template: `
    <main class="m3-page live-camera-page">
      <!-- Page Top Eyebrow + Header + Camera Selector Pill -->
      <section class="live-header">
        <div class="live-title-group">
          <span class="live-eyebrow">
            CENTRO DE CONTROL · {{ (currentZone()?.name || 'CAMPUS CENTRAL') | uppercase }}
          </span>
          <h1>Cámara en vivo</h1>
          <p>Revisa la escena y prueba cómo se presenta una alerta de movimiento.</p>
        </div>

        <div class="live-header-right">
          <button class="m3-outlined-btn back-grid-btn" type="button" (click)="router.navigate(['/monitoreo'])">
            <span class="material-icons-outlined" style="font-size: 18px">grid_view</span>
            Vista general
          </button>

          <div class="camera-selector-pill">
            <span class="material-icons-outlined cam-icon">videocam</span>
            <select
              aria-label="Seleccionar cámara en vivo"
              [ngModel]="selectedCameraId()"
              (ngModelChange)="onSelectCamera(+$event)">
              @for (cam of data.cameras(); track cam.id) {
                <option [value]="cam.id">{{ cam.code }} · {{ cam.name }}</option>
              }
            </select>
          </div>
        </div>
      </section>

      <!-- 2-Column Main Layout: Left Player Card + Right Analysis & Activity Stack -->
      <section class="live-workspace-grid">
        <!-- LEFT COLUMN: Main Live Video Card -->
        <article class="player-card m3-card">
          <header class="player-card-header">
            <div class="cam-title-meta">
              <h2>{{ currentCamera().name }}</h2>
              <span>
                {{ currentZone()?.name?.split('·')?.[0]?.trim() || 'Edificio A' }} · Cámara {{ currentCamera().code }}
              </span>
            </div>

            <div class="stream-badges">
              <span class="badge-hd">HD · 1080p</span>
              <span class="badge-fps">{{ currentCamera().fps || 24 }} FPS</span>
            </div>
          </header>

          <!-- Illustrated Scene / Live Video Canvas -->
          <div
            class="video-stage"
            [class.is-alerting]="simulationActive()"
            (click)="togglePlay()">
            <!-- Top Overlay Pills -->
            <div class="stage-top-bar">
              <span class="stage-cam-pill">
                {{ currentCamera().code }} · {{ currentCamera().name | uppercase }}
              </span>

              <span class="stage-live-pill" [class.alert-mode]="simulationActive()">
                <i class="dot"></i>
                {{ simulationActive() ? 'ALERTA IA · EN VIVO' : 'EN VIVO · DEMO' }}
              </span>
            </div>

            <!-- Vector Architectural & Silhouettes Scene (Matches Reference Image) -->
            <svg
              class="illustrated-scene-svg"
              viewBox="0 0 960 520"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true">
              <defs>
                <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#374854" />
                  <stop offset="55%" stop-color="#4e626f" />
                  <stop offset="100%" stop-color="#2c3b45" />
                </linearGradient>
                <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#6b818f" stop-opacity="0.65" />
                  <stop offset="100%" stop-color="#495d69" stop-opacity="0.45" />
                </linearGradient>
                <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#677985" />
                  <stop offset="35%" stop-color="#455561" />
                  <stop offset="100%" stop-color="#19232b" />
                </linearGradient>
              </defs>

              <!-- Background Wall -->
              <rect width="960" height="330" fill="url(#wallGrad)" />

              <!-- Architectural Glass Grid (Left / Center Lobby Windows) -->
              <g stroke="#8ea2af" stroke-width="3" stroke-opacity="0.55">
                <rect x="190" y="0" width="145" height="105" fill="url(#windowGrad)" />
                <rect x="335" y="0" width="145" height="105" fill="url(#windowGrad)" />
                <rect x="480" y="0" width="145" height="105" fill="url(#windowGrad)" />

                <rect x="190" y="105" width="145" height="115" fill="url(#windowGrad)" />
                <rect x="335" y="105" width="145" height="115" fill="url(#windowGrad)" />
                <rect x="480" y="105" width="145" height="115" fill="url(#windowGrad)" />

                <rect x="190" y="220" width="145" height="105" fill="url(#windowGrad)" />
                <rect x="335" y="220" width="145" height="105" fill="url(#windowGrad)" />
                <rect x="480" y="220" width="145" height="105" fill="url(#windowGrad)" />
              </g>

              <!-- Floor Surface & Perspective Lines -->
              <rect x="0" y="325" width="960" height="195" fill="url(#floorGrad)" />
              <line x1="0" y1="325" x2="960" y2="325" stroke="#99adb9" stroke-width="2" stroke-opacity="0.6" />
              <g stroke="#7b8f9c" stroke-width="1.5" stroke-opacity="0.28">
                <line x1="210" y1="325" x2="40" y2="520" />
                <line x1="360" y1="325" x2="275" y2="520" />
                <line x1="485" y1="325" x2="485" y2="520" />
                <line x1="615" y1="325" x2="710" y2="520" />
                <line x1="760" y1="325" x2="930" y2="520" />
              </g>

              <!-- Reception Desk / Planter Box on Left -->
              <g>
                <rect x="28" y="346" width="118" height="78" fill="#182a32" />
                <rect x="28" y="336" width="118" height="12" fill="#2c414b" />
                <rect x="46" y="424" width="82" height="16" fill="#0f1b21" />
              </g>

              <!-- Decorative Plant on Right -->
              <g>
                <ellipse cx="755" cy="408" rx="68" ry="13" fill="#26363e" opacity="0.65" />
                <path d="M700,404 L730,322 L780,322 L810,404 Z" fill="#4f6c5a" />
                <path d="M735,326 C730,275 765,265 772,326" fill="none" stroke="#8ab08a" stroke-width="10" stroke-linecap="round" />
                <path d="M712,336 C685,295 680,265 700,255" fill="none" stroke="#8ab08a" stroke-width="7" stroke-linecap="round" />
                <path d="M792,336 C815,295 820,268 806,252" fill="none" stroke="#8ab08a" stroke-width="7" stroke-linecap="round" />
              </g>

              <!-- Figure 1 (Far Left Person) -->
              <g class="person-group p-1">
                <ellipse cx="204" cy="410" rx="22" ry="6" fill="#10181f" opacity="0.45" />
                <circle cx="204" cy="303" r="11" fill="#b48a68" />
                <path d="M192,320 L216,320 L224,368 L184,368 Z" fill="#1b2a32" />
                <path d="M194,368 L201,408 M213,368 L217,408" stroke="#152229" stroke-width="7" stroke-linecap="round" />
              </g>

              <!-- Figure 2 (Mid-Left Person) -->
              <g class="person-group p-2" [class.agitated-left]="simulationActive()">
                <ellipse cx="338" cy="422" rx="34" ry="8" fill="#10181f" opacity="0.45" />
                <circle cx="338" cy="264" r="15" fill="#b48a68" />
                <path d="M318,284 L358,284 L374,358 L302,358 Z" fill="#182830" />
                <path d="M312,292 L294,335 M362,292 L384,332" stroke="#22353f" stroke-width="8" stroke-linecap="round" />
                <path d="M326,358 L318,416 M350,358 L360,416" stroke="#152229" stroke-width="10" stroke-linecap="round" />
              </g>

              <!-- Figure 3 (Center Foreground Person) -->
              <g class="person-group p-3" [class.agitated-right]="simulationActive()">
                <ellipse cx="496" cy="466" rx="44" ry="10" fill="#10181f" opacity="0.5" />
                <circle cx="496" cy="285" r="19" fill="#b48a68" />
                <path d="M472,310 L520,310 L540,395 L454,395 Z" fill="#182830" />
                <path d="M466,318 L442,366 M526,318 L552,366" stroke="#233742" stroke-width="10" stroke-linecap="round" />
                <path d="M482,395 L472,462 M512,395 L522,462" stroke="#142027" stroke-width="13" stroke-linecap="round" />
              </g>

              <!-- Figure 4 (Right Person near Plant) -->
              <g class="person-group p-4">
                <ellipse cx="668" cy="418" rx="28" ry="7" fill="#10181f" opacity="0.45" />
                <circle cx="668" cy="292" r="13" fill="#b48a68" />
                <path d="M652,310 L684,310 L696,368 L640,368 Z" fill="#182830" />
                <path d="M648,318 L630,352 M688,318 L704,350" stroke="#233742" stroke-width="7" stroke-linecap="round" />
                <path d="M658,368 L650,414 M678,368 L684,414" stroke="#142027" stroke-width="9" stroke-linecap="round" />
              </g>
            </svg>

            <!-- AI Red Bounding Box Overlay when Simulation is Triggered -->
            @if (simulationActive()) {
              <div class="ai-detection-overlay">
                <span class="ai-box-tag">
                  <span class="material-icons-outlined" style="font-size:13px">warning</span>
                  Posible agresión física · {{ (simulatedConfidence() * 100).toFixed(1) }} %
                </span>
                <div class="ai-corners"></div>
              </div>
            }

            <!-- Bottom Overlay Watermark & Timestamp -->
            <div class="stage-bottom-bar">
              <span class="stage-watermark">ESCENA ILUSTRADA · SIN VIDEO REAL</span>
              <span class="stage-clock">18/11/2026 · {{ formattedClock() }}</span>
            </div>
          </div>

          <!-- Video Transport Controls Bar (Play/Pause, Time, Timeline with Red Incident Marker, Speed, Mute) -->
          <footer class="transport-bar">
            <button
              type="button"
              class="play-toggle-btn"
              [attr.aria-label]="isPlaying() ? 'Pausar reproducción' : 'Reproducir'"
              (click)="togglePlay()">
              <span class="material-icons-outlined">
                {{ isPlaying() ? 'pause' : 'play_arrow' }}
              </span>
            </button>

            <span class="time-counter">
              {{ formatSeconds(currentTimeSec()) }} / {{ formatSeconds(totalDurationSec) }}
            </span>

            <div class="timeline-track-wrapper" (click)="seekFromClick($event)">
              <div class="timeline-track">
                <div class="timeline-progress" [style.width.%]="(currentTimeSec() / totalDurationSec) * 100"></div>
                <!-- Red incident marker at 00:20 (47.6%) matching the screenshot -->
                <button
                  type="button"
                  class="timeline-alert-marker"
                  style="left: 47.6%"
                  title="00:20 · Pico de movimiento / Posible agresión detectada"
                  (click)="jumpToAlertMarker($event)">
                  <span>!</span>
                </button>
              </div>
            </div>

            <button type="button" class="speed-chip" (click)="cyclePlaybackSpeed()">
              {{ playbackSpeed() }}x
            </button>

            <button
              type="button"
              class="mute-btn"
              [attr.aria-label]="isMuted() ? 'Activar sonido' : 'Silenciar'"
              (click)="isMuted.set(!isMuted())">
              <span class="material-icons-outlined">
                {{ isMuted() ? 'volume_off' : 'volume_up' }}
              </span>
            </button>
          </footer>
        </article>

        <!-- RIGHT COLUMN: Event Analysis Card + Recent Activity Card -->
        <aside class="analysis-side-stack">
          <!-- Card 1: Análisis de evento -->
          <article class="analysis-card m3-card">
            <header class="analysis-header">
              <h2>Análisis de evento</h2>
              <p>La IA alerta; el operador revisa y decide.</p>
            </header>

            <!-- Status Box -->
            @if (!simulationActive()) {
              <div class="event-status-box idle">
                <div class="status-headline">
                  <span class="material-icons-outlined">check</span>
                  <strong>Sin evento activo</strong>
                </div>
                <div class="status-big-value">—</div>
                <small>Esperando que inicies una simulación</small>
              </div>
            } @else {
              <div class="event-status-box active-alert">
                <div class="status-headline">
                  <span class="material-icons-outlined">error_outline</span>
                  <strong>Posible agresión detectada</strong>
                </div>
                <div class="status-big-value">{{ (simulatedConfidence() * 100).toFixed(1) }} %</div>
                <small>Supera umbral ({{ ((currentCategory().confidence_threshold || 0.85) * 100).toFixed(0) }} %) · Requiere revisión humana</small>
              </div>
            }

            <!-- Metadata Key-Value Rows -->
            <dl class="event-kv-list">
              <div class="kv-row">
                <dt>Tipo de evento</dt>
                <dd [class.alert-text]="simulationActive()">
                  {{ simulationActive() ? (currentCategory().name || 'Posible agresión física') : 'Ninguno' }}
                </dd>
              </div>
              <div class="kv-row">
                <dt>Cámara</dt>
                <dd>{{ currentCamera().code }} · {{ currentCamera().name }}</dd>
              </div>
              <div class="kv-row">
                <dt>Estado</dt>
                <dd>
                  @if (simulationActive()) {
                    <span class="m3-badge badge-error"><i class="dot"></i> Por revisar</span>
                  } @else {
                    Monitoreando
                  }
                </dd>
              </div>
            </dl>

            <!-- Context Explanation -->
            <div class="detection-context">
              <h3>Contexto de la detección</h3>
              @if (!simulationActive()) {
                <p>
                  Inicia la escena de demostración para mostrar cómo se vería una alerta de posible agresión. El resultado no corresponde a una detección real.
                </p>
              } @else {
                <p>
                  El modelo detectó patrones de movimiento brusco y proximidad crítica durante
                  <strong>{{ currentCategory().persistence_ms || 1200 }} ms</strong> en
                  <strong>{{ currentCamera().name }}</strong>. Se activó la alerta preventiva y se notificó a los contactos de la zona.
                </p>
              }
            </div>

            <!-- Action Buttons -->
            @if (!simulationActive()) {
              <button type="button" class="m3-primary-btn simulate-main-btn" (click)="startAggressionSimulation()">
                <span class="material-icons-outlined" style="font-size: 18px">play_arrow</span>
                Simular posible agresión
              </button>
            } @else {
              <div class="active-simulation-actions">
                <button type="button" class="m3-primary-btn simulate-main-btn" (click)="openIncidentReviewModal()">
                  <span class="material-icons-outlined" style="font-size: 18px">policy</span>
                  Revisar evidencia y protocolo
                </button>
                <div class="secondary-sim-btns">
                  <button type="button" class="m3-tonal-btn" (click)="confirmSimulatedAlert()">
                    <span class="material-icons-outlined" style="font-size: 17px">check_circle</span>
                    Confirmar
                  </button>
                  <button type="button" class="m3-outlined-btn" (click)="resetSimulation()">
                    Restablecer escena
                  </button>
                </div>
              </div>
            }
          </article>

          <!-- Card 2: Actividad reciente -->
          <article class="recent-activity-card m3-card">
            <header class="recent-header">
              <h2>Actividad reciente</h2>
              <span>Hoy · Demo</span>
            </header>

            <div class="recent-timeline">
              @for (item of activityFeed(); track item.id) {
                <div class="recent-row">
                  <span
                    class="recent-icon-box"
                    [class.is-alert]="item.type === 'alert'"
                    [class.is-confirmed]="item.type === 'confirmed'">
                    <span class="material-icons-outlined">
                      {{ item.type === 'alert' ? 'error_outline' : item.type === 'confirmed' ? 'check_circle' : 'videocam' }}
                    </span>
                  </span>
                  <div class="recent-copy">
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.subtitle }}</small>
                  </div>
                  <time>{{ item.time }}</time>
                </div>
              }
            </div>
          </article>
        </aside>
      </section>
    </main>

    <!-- Full Incident Review & Protocol Modal -->
    <app-incident-review-modal
      [incident]="reviewModalIncident()"
      (closed)="reviewModalIncident.set(null)" />
  `,
  styles: [`
    .live-camera-page {
      padding-top: 22px;
    }

    /* Top Header */
    .live-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 22px;
      flex-wrap: wrap;
    }
    .live-eyebrow {
      display: block;
      margin-bottom: 6px;
      color: var(--m3-primary);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.75px;
      text-transform: uppercase;
    }
    .live-title-group h1 {
      margin: 0;
      color: var(--m3-ink);
      font-size: clamp(26px, 2.3vw, 32px);
      font-weight: 400;
      letter-spacing: -0.4px;
      line-height: 1.2;
    }
    .live-title-group p {
      margin: 6px 0 0;
      color: var(--m3-muted);
      font-size: 14px;
    }
    .live-header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .camera-selector-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 42px;
      padding: 0 14px;
      border: 1px solid var(--m3-outline);
      border-radius: 12px;
      background: var(--m3-card);
      color: var(--m3-ink);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .camera-selector-pill .cam-icon {
      color: var(--m3-ink);
      font-size: 20px;
    }
    .camera-selector-pill select {
      border: 0;
      background: transparent;
      color: var(--m3-ink);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding-right: 4px;
    }
    .camera-selector-pill select:focus {
      outline: none;
    }

    /* Main 2-Column Workspace Grid */
    .live-workspace-grid {
      display: grid;
      grid-template-columns: minmax(0, 2.05fr) minmax(320px, 1fr);
      gap: 24px;
      align-items: start;
    }

    /* Left Column: Video Player Card */
    .player-card {
      padding: 22px 24px 20px;
      border-radius: 20px;
      border: 1px solid var(--m3-outline-soft);
      box-shadow: 0 4px 20px rgba(18, 20, 28, 0.04);
    }
    .player-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }
    .cam-title-meta h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      color: var(--m3-ink);
    }
    .cam-title-meta span {
      display: block;
      margin-top: 3px;
      font-size: 12px;
      color: var(--m3-muted);
    }
    .stream-badges {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge-hd {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 11px;
      border-radius: 100px;
      background: var(--m3-blue-container);
      color: var(--m3-primary);
      font-size: 11px;
      font-weight: 700;
    }
    .badge-fps {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 11px;
      border-radius: 100px;
      background: var(--m3-low);
      color: var(--m3-muted);
      font-size: 11px;
      font-weight: 600;
    }

    /* Video Stage */
    .video-stage {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      min-height: 360px;
      border-radius: 16px;
      overflow: hidden;
      background: #2b3a44;
      cursor: pointer;
      user-select: none;
      transition: box-shadow 0.2s;
    }
    .video-stage.is-alerting {
      box-shadow: 0 0 0 3px var(--m3-error);
    }
    .illustrated-scene-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .person-group {
      transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .person-group.agitated-left {
      transform: translate(48px, 6px) rotate(4deg);
      transform-origin: center bottom;
    }
    .person-group.agitated-right {
      transform: translate(-36px, -4px) rotate(-5deg);
      transform-origin: center bottom;
    }

    /* Stage Overlay Bars */
    .stage-top-bar {
      position: absolute;
      top: 14px;
      left: 14px;
      right: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      z-index: 3;
      pointer-events: none;
    }
    .stage-cam-pill {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 0 12px;
      border-radius: 8px;
      background: rgba(15, 22, 28, 0.78);
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.45px;
      backdrop-filter: blur(4px);
    }
    .stage-live-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 30px;
      padding: 0 12px;
      border-radius: 8px;
      background: rgba(16, 70, 50, 0.88);
      color: #82f0b9;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.45px;
    }
    .stage-live-pill i.dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #47e599;
    }
    .stage-live-pill.alert-mode {
      background: rgba(179, 38, 30, 0.94);
      color: #ffffff;
    }
    .stage-live-pill.alert-mode i.dot {
      background: #ffffff;
    }

    /* AI Bounding Box Overlay */
    .ai-detection-overlay {
      position: absolute;
      top: 41%;
      left: 33%;
      width: 28%;
      height: 49%;
      border: 2.5px solid #ef4444;
      border-radius: 10px;
      background: rgba(239, 68, 68, 0.12);
      z-index: 3;
      pointer-events: none;
      animation: pulseAlertBox 1.4s infinite ease-in-out;
    }
    .ai-box-tag {
      position: absolute;
      top: -28px;
      left: -2px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 9px;
      border-radius: 6px;
      background: #dc2626;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
    }
    @keyframes pulseAlertBox {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.45);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
      }
    }

    .stage-bottom-bar {
      position: absolute;
      bottom: 12px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 3;
      pointer-events: none;
    }
    .stage-watermark, .stage-clock {
      color: rgba(255, 255, 255, 0.85);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
    }

    /* Transport Bar */
    .transport-bar {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 16px;
      padding-top: 4px;
    }
    .play-toggle-btn {
      display: grid;
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: var(--m3-blue-container);
      color: var(--m3-primary);
      transition: background 0.15s;
    }
    .play-toggle-btn:hover {
      background: var(--m3-blue-soft);
    }
    .time-counter {
      color: var(--m3-muted);
      font-size: 12px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .timeline-track-wrapper {
      position: relative;
      flex: 1;
      height: 24px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    .timeline-track {
      position: relative;
      width: 100%;
      height: 5px;
      border-radius: 100px;
      background: var(--m3-blue-soft);
    }
    .timeline-progress {
      height: 100%;
      border-radius: 100px;
      background: var(--m3-primary);
      transition: width 0.2s linear;
    }
    .timeline-alert-marker {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1.5px solid #dc2626;
      background: #fff5f5;
      color: #dc2626;
      font-size: 10px;
      font-weight: 800;
      display: grid;
      place-items: center;
      padding: 0;
      box-shadow: 0 1px 4px rgba(220, 38, 38, 0.3);
    }
    .speed-chip {
      border: 0;
      background: transparent;
      color: var(--m3-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 4px 6px;
      border-radius: 6px;
    }
    .speed-chip:hover {
      background: var(--m3-low);
    }
    .mute-btn {
      display: grid;
      width: 34px;
      height: 34px;
      place-items: center;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--m3-muted);
    }
    .mute-btn:hover {
      background: var(--m3-low);
    }

    /* Right Column Stack */
    .analysis-side-stack {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .analysis-card, .recent-activity-card {
      padding: 22px 24px;
      border-radius: 20px;
      border: 1px solid var(--m3-outline-soft);
      box-shadow: 0 4px 20px rgba(18, 20, 28, 0.04);
    }
    .analysis-header h2, .recent-header h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      color: var(--m3-ink);
    }
    .analysis-header p {
      margin: 4px 0 0;
      font-size: 12px;
      color: var(--m3-muted);
    }

    /* Status Box inside Analysis Card */
    .event-status-box {
      margin-top: 16px;
      padding: 16px 18px;
      border-radius: 14px;
      background: var(--m3-low);
    }
    .event-status-box.active-alert {
      background: var(--m3-error-container);
      color: var(--m3-error-ink);
    }
    .status-headline {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
    }
    .status-headline .material-icons-outlined {
      font-size: 17px;
    }
    .status-big-value {
      margin: 10px 0 6px;
      font-size: 24px;
      font-weight: 600;
      line-height: 1.1;
    }
    .event-status-box small {
      display: block;
      font-size: 11.5px;
      opacity: 0.85;
    }

    /* Key-Value List */
    .event-kv-list {
      margin: 18px 0;
      display: grid;
      gap: 12px;
    }
    .kv-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 12.5px;
    }
    .kv-row dt {
      color: var(--m3-muted);
    }
    .kv-row dd {
      margin: 0;
      font-weight: 600;
      color: var(--m3-ink);
      text-align: right;
    }
    .kv-row dd.alert-text {
      color: var(--m3-error);
    }

    /* Context Explanation */
    .detection-context {
      padding-top: 14px;
      border-top: 1px solid var(--m3-outline-soft);
      margin-bottom: 18px;
    }
    .detection-context h3 {
      margin: 0 0 6px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--m3-ink);
    }
    .detection-context p {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: var(--m3-muted);
    }

    .simulate-main-btn {
      width: 100%;
      min-height: 44px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }
    .active-simulation-actions {
      display: grid;
      gap: 10px;
    }
    .secondary-sim-btns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    /* Recent Activity Card */
    .recent-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .recent-header span {
      font-size: 11.5px;
      color: var(--m3-muted);
    }
    .recent-timeline {
      display: grid;
      gap: 14px;
    }
    .recent-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .recent-icon-box {
      display: grid;
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      place-items: center;
      border-radius: 10px;
      background: var(--m3-low);
      color: var(--m3-muted);
    }
    .recent-icon-box .material-icons-outlined {
      font-size: 18px;
    }
    .recent-icon-box.is-alert {
      background: var(--m3-error-container);
      color: var(--m3-error-ink);
    }
    .recent-icon-box.is-confirmed {
      background: var(--m3-blue-container);
      color: var(--m3-primary);
    }
    .recent-copy {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }
    .recent-copy strong {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--m3-ink);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .recent-copy small {
      font-size: 11px;
      color: var(--m3-muted);
    }
    .recent-row time {
      font-size: 11px;
      color: var(--m3-muted);
      font-variant-numeric: tabular-nums;
    }

    @media (max-width: 1040px) {
      .live-workspace-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LiveCameraComponent implements OnDestroy {
  readonly data = inject(CentinelaDataService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly totalDurationSec = 42;
  readonly currentTimeSec = signal<number>(18);
  readonly isPlaying = signal<boolean>(true);
  readonly playbackSpeed = signal<number>(1);
  readonly isMuted = signal<boolean>(false);

  readonly selectedCameraId = signal<number>(1);
  readonly simulationActive = signal<boolean>(false);
  readonly simulatedConfidence = signal<number>(0.942);
  readonly lastCreatedIncident = signal<Incident | null>(null);
  readonly reviewModalIncident = signal<Incident | null>(null);

  readonly activityFeed = signal<LiveLogEntry[]>([
    {
      id: 1,
      title: 'Vista de cámara iniciada',
      subtitle: 'CAM-01 · Acceso principal',
      time: '14:32',
      type: 'camera'
    },
    {
      id: 2,
      title: 'Incidente confirmado',
      subtitle: 'CAM-07 · Patio de carga',
      time: '14:24',
      type: 'confirmed'
    },
    {
      id: 3,
      title: 'Conexión restablecida',
      subtitle: 'CAM-12 · Pasillo Cafetería',
      time: '14:18',
      type: 'camera'
    }
  ]);

  private timerId: ReturnType<typeof setInterval> | null = null;

  readonly currentCamera = computed<Camera>(() => {
    return (
      this.data.getCameraById(this.selectedCameraId()) ??
      this.data.cameras()[0]
    );
  });

  readonly currentZone = computed(() => {
    return this.data.getZoneById(this.currentCamera().zone_id);
  });

  readonly currentCategory = computed(() => {
    return this.data.categories()[0];
  });

  readonly formattedClock = computed(() => {
    const sec = this.currentTimeSec();
    const s = String((8 + sec) % 60).padStart(2, '0');
    return `14:32:${s}`;
  });

  constructor() {
    const paramId = Number(this.route.snapshot.queryParamMap.get('cameraId'));
    if (paramId && this.data.getCameraById(paramId)) {
      this.selectedCameraId.set(paramId);
    }
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (!this.isPlaying()) return;
      this.currentTimeSec.update((curr) => {
        const next = curr + 1;
        return next > this.totalDurationSec ? 0 : next;
      });
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  togglePlay(): void {
    this.isPlaying.update((v) => !v);
  }

  cyclePlaybackSpeed(): void {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(this.playbackSpeed()) + 1) % speeds.length;
    this.playbackSpeed.set(speeds[nextIdx]);
  }

  onSelectCamera(camId: number): void {
    this.selectedCameraId.set(camId);
    this.simulationActive.set(false);
    const cam = this.data.getCameraById(camId);
    if (cam) {
      this.prependActivity({
        title: 'Vista de cámara iniciada',
        subtitle: `${cam.code} · ${cam.name}`,
        time: '14:32',
        type: 'camera'
      });
    }
  }

  startAggressionSimulation(): void {
    const cam = this.currentCamera();
    const cat = this.currentCategory();
    const confidence = 0.942;

    this.simulationActive.set(true);
    this.simulatedConfidence.set(confidence);
    this.currentTimeSec.set(20);

    // Register a real mock incident in CentinelaDataService for this camera
    const newId = Math.max(...this.data.incidents().map((i) => i.id), 1000) + 1;
    const now = new Date().toISOString();

    const newInc: Incident = {
      id: newId,
      camera_id: cam.id,
      category_id: cat?.id ?? 1,
      confidence,
      occurred_at: now,
      alarm_active: true,
      silenced_by: null,
      silenced_at: null,
      review_status: 'PENDING',
      reviewed_by: null,
      operator_notes: null,
      bounding_box: { top: 33, left: 33, width: 28, height: 49 }
    };

    this.data.incidents.update((list) => [newInc, ...list]);
    this.lastCreatedIncident.set(newInc);

    this.prependActivity({
      title: `Posible agresión (${(confidence * 100).toFixed(1)}%)`,
      subtitle: `${cam.code} · ${cam.name}`,
      time: '14:32',
      type: 'alert'
    });

    this.data.showNotice(
      `Simulación activa en ${cam.code} (${cam.name}): Posible agresión detectada con ${(confidence * 100).toFixed(1)}% de confianza.`
    );
  }

  confirmSimulatedAlert(): void {
    const inc = this.lastCreatedIncident() ?? this.data.priorityIncident();
    if (inc) {
      this.data.reviewIncident(
        inc.id,
        'CONFIRMED',
        'Confirmado por el operador desde la consola de Cámara en Vivo.'
      );
      const cam = this.currentCamera();
      this.prependActivity({
        title: 'Incidente confirmado por operador',
        subtitle: `${cam.code} · #${inc.id}`,
        time: '14:33',
        type: 'confirmed'
      });
    }
    this.simulationActive.set(false);
  }

  resetSimulation(): void {
    this.simulationActive.set(false);
    this.currentTimeSec.set(18);
    this.data.clearNotice();
  }

  openIncidentReviewModal(): void {
    const inc = this.lastCreatedIncident() ?? this.data.priorityIncident() ?? this.data.incidents()[0];
    if (inc) {
      this.reviewModalIncident.set(inc);
    }
  }

  jumpToAlertMarker(event: MouseEvent): void {
    event.stopPropagation();
    this.currentTimeSec.set(20);
    if (!this.simulationActive()) {
      this.startAggressionSimulation();
    }
  }

  seekFromClick(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    this.currentTimeSec.set(Math.round(ratio * this.totalDurationSec));
  }

  formatSeconds(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private prependActivity(entry: Omit<LiveLogEntry, 'id'>): void {
    this.activityFeed.update((list) => [
      { ...entry, id: Date.now() },
      ...list.slice(0, 4)
    ]);
  }
}
