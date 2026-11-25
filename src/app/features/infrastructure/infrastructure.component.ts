import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CentinelaDataService } from '../../core/services/centinela-data.service';
import {
  Camera,
  ConnectionStatus,
  HardwareConnectionType,
  Siren,
  VideoSourceType,
  Zone
} from '../../core/models/database.models';

@Component({
  selector: 'app-infrastructure',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="m3-page">
      <header class="m3-page-header">
        <div>
          <h1>Infraestructura y dispositivos</h1>
          <p>
            Administración de cámaras IP/RTSP (<code>cameras</code>), sirenas disuasorias (<code>sirens</code>) y zonas del campus (<code>zones</code>).
          </p>
        </div>

        <div class="header-controls">
          <div class="m3-segmented">
            <button type="button" [class.active]="activeTab() === 'cameras'" (click)="activeTab.set('cameras')">
              <span class="material-icons-outlined" style="font-size:17px">videocam</span>
              Cámaras ({{ data.cameras().length }})
            </button>
            <button type="button" [class.active]="activeTab() === 'sirens'" (click)="activeTab.set('sirens')">
              <span class="material-icons-outlined" style="font-size:17px">campaign</span>
              Sirenas ({{ data.sirens().length }})
            </button>
            <button type="button" [class.active]="activeTab() === 'zones'" (click)="activeTab.set('zones')">
              <span class="material-icons-outlined" style="font-size:17px">place</span>
              Zonas ({{ data.zones().length }})
            </button>
          </div>

          @if (activeTab() === 'cameras') {
            <button class="m3-primary-btn" type="button" (click)="openCameraModal()">
              <span class="material-icons-outlined">add</span>
              Nueva cámara
            </button>
          } @else if (activeTab() === 'sirens') {
            <button class="m3-primary-btn" type="button" (click)="openSirenModal()">
              <span class="material-icons-outlined">add</span>
              Nueva sirena
            </button>
          } @else {
            <button class="m3-primary-btn" type="button" (click)="openZoneModal()">
              <span class="material-icons-outlined">add</span>
              Nueva zona
            </button>
          }
        </div>
      </header>

      <!-- TAB 1: CAMERAS -->
      @if (activeTab() === 'cameras') {
        <section class="m3-table-wrapper">
          <table class="m3-table">
            <thead>
              <tr>
                <th>Código / Nombre</th>
                <th>Zona (<code>zone_id</code>)</th>
                <th>Tipo Fuente (<code>source_type</code>)</th>
                <th>Stream URL / Dispositivo (<code>source</code>)</th>
                <th>FPS / Audio</th>
                <th>Estado Conexión</th>
                <th>Activa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (cam of data.cameras(); track cam.id) {
                <tr>
                  <td>
                    <strong>{{ cam.code }} · {{ cam.name }}</strong>
                    <div class="sub-text">ID: {{ cam.id }}</div>
                  </td>
                  <td>{{ data.getZoneById(cam.zone_id)?.name }}</td>
                  <td>
                    <span class="m3-badge badge-info">{{ cam.source_type }}</span>
                  </td>
                  <td><code class="mono-pill">{{ cam.source }}</code></td>
                  <td>
                    <strong>{{ cam.fps }} FPS</strong>
                    <div class="sub-text">{{ cam.captures_audio ? 'Captura audio' : 'Solo video' }}</div>
                  </td>
                  <td>
                    <span class="m3-badge"
                      [class.badge-success]="cam.status === 'ONLINE'"
                      [class.badge-warning]="cam.status === 'CONNECTING'"
                      [class.badge-error]="cam.status === 'OFFLINE' || cam.status === 'ERROR'">
                      <i class="dot"></i> {{ cam.status }}
                    </span>
                  </td>
                  <td>
                    <span class="m3-badge" [class.badge-success]="cam.is_active" [class.badge-neutral]="!cam.is_active">
                      {{ cam.is_active ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                  <td>
                    <button class="m3-outlined-btn" type="button" (click)="openCameraModal(cam)">
                      <span class="material-icons-outlined" style="font-size:16px">edit</span>
                      Editar
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      <!-- TAB 2: SIRENS -->
      @if (activeTab() === 'sirens') {
        <section class="m3-table-wrapper">
          <table class="m3-table">
            <thead>
              <tr>
                <th>ID / Sirena</th>
                <th>Zona Asignada (<code>zone_id</code>)</th>
                <th>Conexión (<code>connection_type</code>)</th>
                <th>Puerto (<code>port</code>) / MAC Bluetooth</th>
                <th>Estado Hardware</th>
                <th>Prueba Sonora</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (s of data.sirens(); track s.id) {
                <tr>
                  <td>
                    <strong>{{ s.name }}</strong>
                    <div class="sub-text">ID: #{{ s.id }} · {{ s.is_active ? 'Habilitada' : 'Deshabilitada' }}</div>
                  </td>
                  <td>{{ data.getZoneById(s.zone_id)?.name || 'Sin zona asignada' }}</td>
                  <td><span class="m3-badge badge-info">{{ s.connection_type }}</span></td>
                  <td>
                    <code class="mono-pill">{{ s.port || s.bluetooth_address || 'N/A' }}</code>
                  </td>
                  <td>
                    <span class="m3-badge"
                      [class.badge-success]="s.status === 'ONLINE'"
                      [class.badge-error]="s.status !== 'ONLINE'">
                      <i class="dot"></i> {{ s.status }}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      [class]="s.is_sounding ? 'm3-danger-btn' : 'm3-tonal-btn'"
                      [disabled]="!s.is_active"
                      (click)="data.toggleSirenTest(s.id)">
                      <span class="material-icons-outlined" style="font-size:17px">
                        {{ s.is_sounding ? 'volume_off' : 'campaign' }}
                      </span>
                      {{ s.is_sounding ? 'Silenciar sirena' : 'Disparar prueba' }}
                    </button>
                  </td>
                  <td>
                    <button class="m3-outlined-btn" type="button" (click)="openSirenModal(s)">
                      <span class="material-icons-outlined" style="font-size:16px">edit</span>
                      Editar
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      <!-- TAB 3: ZONES -->
      @if (activeTab() === 'zones') {
        <section class="zones-grid">
          @for (z of data.zones(); track z.id) {
            <article class="m3-card zone-card">
              <div class="zone-card-top">
                <span class="zone-icon">
                  <span class="material-icons-outlined">domain</span>
                </span>
                <span class="m3-badge" [class.badge-success]="z.is_active" [class.badge-neutral]="!z.is_active">
                  {{ z.is_active ? 'Zona Activa' : 'Inactiva' }}
                </span>
              </div>
              <h3>{{ z.name }}</h3>
              <p>{{ z.description || 'Sin descripción registrada.' }}</p>
              <div class="zone-counts">
                <span><strong>{{ countCamerasInZone(z.id) }}</strong> cámaras vinculadas</span>
                <span><strong>{{ countSirensInZone(z.id) }}</strong> sirenas vinculadas</span>
              </div>
              <div class="zone-card-actions">
                <button class="m3-outlined-btn" type="button" (click)="openZoneModal(z)">
                  <span class="material-icons-outlined" style="font-size:16px">edit</span>
                  Editar zona
                </button>
              </div>
            </article>
          }
        </section>
      }
    </main>

    <!-- CAMERA MODAL (Reactive Form) -->
    @if (cameraModalOpen()) {
      <div class="m3-dialog-backdrop" (mousedown)="closeModalsOnBackdrop($event)">
        <section class="m3-dialog">
          <h2>{{ editingCameraId() ? 'Editar cámara #' + editingCameraId() : 'Registrar nueva cámara' }}</h2>
          <p class="modal-sub">Configuración de stream alineada a la tabla <code>cameras</code>.</p>

          <form [formGroup]="cameraForm" (ngSubmit)="submitCamera()" class="m3-form-grid">
            <div class="m3-field">
              <label>Nombre de ubicación (<code>name</code>)</label>
              <input type="text" formControlName="name" placeholder="Ej. Acceso Puerta Sur" />
            </div>
            <div class="m3-field">
              <label>Zona asignada (<code>zone_id</code>)</label>
              <select formControlName="zone_id">
                @for (z of data.zones(); track z.id) {
                  <option [ngValue]="z.id">{{ z.name }}</option>
                }
              </select>
            </div>
            <div class="m3-field">
              <label>Tipo de fuente (<code>source_type</code>)</label>
              <select formControlName="source_type">
                <option value="RTSP">RTSP</option>
                <option value="ONVIF">ONVIF</option>
                <option value="HTTP">HTTP</option>
                <option value="USB">USB</option>
              </select>
            </div>
            <div class="m3-field">
              <label>Tasa de cuadros (<code>fps</code>)</label>
              <input type="number" formControlName="fps" min="1" max="120" />
            </div>
            <div class="m3-field full-width">
              <label>Dirección de stream / dispositivo (<code>source</code>)</label>
              <input type="text" formControlName="source" placeholder="rtsp://10.20.1.50:554/stream1" />
            </div>
            <div class="m3-field">
              <label>Estado de conexión (<code>status</code>)</label>
              <select formControlName="status">
                <option value="ONLINE">ONLINE</option>
                <option value="CONNECTING">CONNECTING</option>
                <option value="OFFLINE">OFFLINE</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>
            <div class="m3-field checkboxes-field">
              <label class="check-row">
                <input type="checkbox" formControlName="captures_audio" />
                <span>Captura audio ambiental (<code>captures_audio</code>)</span>
              </label>
              <label class="check-row">
                <input type="checkbox" formControlName="is_active" />
                <span>Cámara habilitada (<code>is_active</code>)</span>
              </label>
            </div>

            <div class="modal-actions full-width">
              <button class="m3-outlined-btn" type="button" (click)="cameraModalOpen.set(false)">Cancelar</button>
              <button class="m3-primary-btn" type="submit" [disabled]="cameraForm.invalid">Guardar cámara</button>
            </div>
          </form>
        </section>
      </div>
    }

    <!-- SIREN MODAL (Reactive Form) -->
    @if (sirenModalOpen()) {
      <div class="m3-dialog-backdrop" (mousedown)="closeModalsOnBackdrop($event)">
        <section class="m3-dialog">
          <h2>{{ editingSirenId() ? 'Editar sirena #' + editingSirenId() : 'Registrar nueva sirena' }}</h2>
          <p class="modal-sub">Configuración de hardware alineada a la tabla <code>sirens</code>.</p>

          <form [formGroup]="sirenForm" (ngSubmit)="submitSiren()" class="m3-form-grid">
            <div class="m3-field full-width">
              <label>Nombre del dispositivo (<code>name</code>)</label>
              <input type="text" formControlName="name" placeholder="Ej. Sirena Exterior Pabellón B" />
            </div>
            <div class="m3-field">
              <label>Zona asignada (<code>zone_id</code>)</label>
              <select formControlName="zone_id">
                @for (z of data.zones(); track z.id) {
                  <option [ngValue]="z.id">{{ z.name }}</option>
                }
              </select>
            </div>
            <div class="m3-field">
              <label>Tipo de conexión (<code>connection_type</code>)</label>
              <select formControlName="connection_type">
                <option value="SERIAL">SERIAL</option>
                <option value="NETWORK">NETWORK</option>
                <option value="BLUETOOTH">BLUETOOTH</option>
                <option value="USB">USB</option>
              </select>
            </div>
            <div class="m3-field">
              <label>Puerto / IP (<code>port</code>)</label>
              <input type="text" formControlName="port" placeholder="COM3 o 10.20.2.99:4000" />
            </div>
            <div class="m3-field">
              <label>Dirección Bluetooth (<code>bluetooth_address</code>)</label>
              <input type="text" formControlName="bluetooth_address" placeholder="A4:C1:38:9F:12:0B" />
            </div>
            <div class="m3-field">
              <label>Estado de conexión (<code>status</code>)</label>
              <select formControlName="status">
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>
            <div class="m3-field checkboxes-field">
              <label class="check-row">
                <input type="checkbox" formControlName="is_active" />
                <span>Sirena activa (<code>is_active</code>)</span>
              </label>
            </div>

            <div class="modal-actions full-width">
              <button class="m3-outlined-btn" type="button" (click)="sirenModalOpen.set(false)">Cancelar</button>
              <button class="m3-primary-btn" type="submit" [disabled]="sirenForm.invalid">Guardar sirena</button>
            </div>
          </form>
        </section>
      </div>
    }

    <!-- ZONE MODAL (Reactive Form) -->
    @if (zoneModalOpen()) {
      <div class="m3-dialog-backdrop" (mousedown)="closeModalsOnBackdrop($event)">
        <section class="m3-dialog">
          <h2>{{ editingZoneId() ? 'Editar zona #' + editingZoneId() : 'Crear nueva zona' }}</h2>
          <p class="modal-sub">Sectorización física alineada a la tabla <code>zones</code>.</p>

          <form [formGroup]="zoneForm" (ngSubmit)="submitZone()" class="m3-form-grid">
            <div class="m3-field full-width">
              <label>Nombre de la zona (<code>name</code>)</label>
              <input type="text" formControlName="name" placeholder="Ej. Biblioteca Central" />
            </div>
            <div class="m3-field full-width">
              <label>Descripción de cobertura (<code>description</code>)</label>
              <textarea formControlName="description" placeholder="Áreas cubiertas por este sector..."></textarea>
            </div>
            <div class="m3-field full-width checkboxes-field">
              <label class="check-row">
                <input type="checkbox" formControlName="is_active" />
                <span>Zona operativa (<code>is_active</code>)</span>
              </label>
            </div>

            <div class="modal-actions full-width">
              <button class="m3-outlined-btn" type="button" (click)="zoneModalOpen.set(false)">Cancelar</button>
              <button class="m3-primary-btn" type="submit" [disabled]="zoneForm.invalid">Guardar zona</button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
  styles: [`
    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .sub-text {
      margin-top: 3px;
      font-size: 11px;
      color: var(--m3-muted);
    }
    .mono-pill {
      padding: 3px 8px;
      border-radius: 6px;
      background: var(--m3-low);
      font-size: 11.5px;
    }
    .zones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 18px;
    }
    .zone-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .zone-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .zone-icon {
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      border-radius: 12px;
      background: var(--m3-blue-container);
      color: var(--m3-brand-deep);
    }
    .zone-card h3 {
      margin: 4px 0 0;
      font-size: 17px;
      font-weight: 500;
    }
    .zone-card p {
      margin: 0;
      font-size: 13px;
      color: var(--m3-muted);
      line-height: 1.45;
      flex: 1;
    }
    .zone-counts {
      display: flex;
      gap: 16px;
      padding: 10px 0;
      border-top: 1px solid var(--m3-outline-soft);
      font-size: 12px;
      color: var(--m3-muted);
    }
    .zone-card-actions {
      display: flex;
      justify-content: flex-end;
    }
    .modal-sub {
      margin: 4px 0 18px;
      font-size: 13px;
      color: var(--m3-muted);
    }
    .checkboxes-field {
      justify-content: center;
      gap: 10px;
    }
    .check-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      color: var(--m3-ink) !important;
      cursor: pointer;
    }
    .check-row input {
      width: 16px !important;
      min-height: 16px !important;
      accent-color: var(--m3-primary);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 10px;
    }
  `]
})
export class InfrastructureComponent {
  readonly data = inject(CentinelaDataService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<'cameras' | 'sirens' | 'zones'>('cameras');

  readonly cameraModalOpen = signal(false);
  readonly editingCameraId = signal<number | null>(null);

  readonly sirenModalOpen = signal(false);
  readonly editingSirenId = signal<number | null>(null);

  readonly zoneModalOpen = signal(false);
  readonly editingZoneId = signal<number | null>(null);

  readonly cameraForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    zone_id: [1, [Validators.required]],
    source_type: ['RTSP' as VideoSourceType, [Validators.required]],
    source: ['', [Validators.required]],
    fps: [30, [Validators.required, Validators.min(1)]],
    captures_audio: [true],
    status: ['ONLINE' as ConnectionStatus, [Validators.required]],
    is_active: [true]
  });

  readonly sirenForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    zone_id: [1, [Validators.required]],
    connection_type: ['SERIAL' as HardwareConnectionType, [Validators.required]],
    port: ['COM3'],
    bluetooth_address: [''],
    status: ['ONLINE' as ConnectionStatus, [Validators.required]],
    is_active: [true]
  });

  readonly zoneForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    is_active: [true]
  });

  countCamerasInZone(zoneId: number): number {
    return this.data.cameras().filter((c) => c.zone_id === zoneId).length;
  }

  countSirensInZone(zoneId: number): number {
    return this.data.sirens().filter((s) => s.zone_id === zoneId).length;
  }

  openCameraModal(cam?: Camera): void {
    if (cam) {
      this.editingCameraId.set(cam.id);
      this.cameraForm.patchValue({
        name: cam.name,
        zone_id: cam.zone_id,
        source_type: cam.source_type,
        source: cam.source,
        fps: cam.fps,
        captures_audio: cam.captures_audio,
        status: cam.status,
        is_active: cam.is_active
      });
    } else {
      this.editingCameraId.set(null);
      this.cameraForm.reset({
        name: '',
        zone_id: this.data.zones()[0]?.id ?? 1,
        source_type: 'RTSP',
        source: 'rtsp://10.20.1.60:554/stream1',
        fps: 30,
        captures_audio: true,
        status: 'ONLINE',
        is_active: true
      });
    }
    this.cameraModalOpen.set(true);
  }

  submitCamera(): void {
    if (this.cameraForm.invalid) return;
    const raw = this.cameraForm.getRawValue();
    const id = this.editingCameraId() ?? undefined;
    const existing = id ? this.data.getCameraById(id) : undefined;
    this.data.saveCamera({
      ...raw,
      id,
      code: existing?.code,
      preview_image: existing?.preview_image
    });
    this.cameraModalOpen.set(false);
  }

  openSirenModal(siren?: Siren): void {
    if (siren) {
      this.editingSirenId.set(siren.id);
      this.sirenForm.patchValue({
        name: siren.name,
        zone_id: siren.zone_id ?? 1,
        connection_type: siren.connection_type,
        port: siren.port ?? '',
        bluetooth_address: siren.bluetooth_address ?? '',
        status: siren.status,
        is_active: siren.is_active
      });
    } else {
      this.editingSirenId.set(null);
      this.sirenForm.reset({
        name: '',
        zone_id: this.data.zones()[0]?.id ?? 1,
        connection_type: 'SERIAL',
        port: 'COM4',
        bluetooth_address: '',
        status: 'ONLINE',
        is_active: true
      });
    }
    this.sirenModalOpen.set(true);
  }

  submitSiren(): void {
    if (this.sirenForm.invalid) return;
    const raw = this.sirenForm.getRawValue();
    this.data.saveSiren({
      ...raw,
      id: this.editingSirenId() ?? undefined,
      port: raw.port || null,
      bluetooth_address: raw.bluetooth_address || null
    });
    this.sirenModalOpen.set(false);
  }

  openZoneModal(zone?: Zone): void {
    if (zone) {
      this.editingZoneId.set(zone.id);
      this.zoneForm.patchValue({
        name: zone.name,
        description: zone.description ?? '',
        is_active: zone.is_active
      });
    } else {
      this.editingZoneId.set(null);
      this.zoneForm.reset({
        name: '',
        description: '',
        is_active: true
      });
    }
    this.zoneModalOpen.set(true);
  }

  submitZone(): void {
    if (this.zoneForm.invalid) return;
    const raw = this.zoneForm.getRawValue();
    this.data.saveZone({
      ...raw,
      id: this.editingZoneId() ?? undefined,
      description: raw.description || null
    });
    this.zoneModalOpen.set(false);
  }

  closeModalsOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cameraModalOpen.set(false);
      this.sirenModalOpen.set(false);
      this.zoneModalOpen.set(false);
    }
  }
}
