import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CentinelaDataService } from '../../core/services/centinela-data.service';
import {
  ContactType,
  EmergencyContact,
  IncidentCategory,
  Protocol,
  SeverityLevel
} from '../../core/models/database.models';

@Component({
  selector: 'app-alerts-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="m3-page">
      <header class="m3-page-header">
        <div>
          <h1>Motor IA, protocolos y contactos de emergencia</h1>
          <p>
            Umbrales de detección (<code>incident_categories</code>), protocolos de actuación (<code>protocols</code>), destinatarios (<code>emergency_contacts</code>) y bitácora (<code>notifications</code>).
          </p>
        </div>

        <div class="header-controls">
          <div class="m3-segmented">
            <button type="button" [class.active]="activeTab() === 'categories'" (click)="activeTab.set('categories')">
              Categorías IA ({{ data.categories().length }})
            </button>
            <button type="button" [class.active]="activeTab() === 'protocols'" (click)="activeTab.set('protocols')">
              Protocolos ({{ data.protocols().length }})
            </button>
            <button type="button" [class.active]="activeTab() === 'contacts'" (click)="activeTab.set('contacts')">
              Contactos ({{ data.emergencyContacts().length }})
            </button>
            <button type="button" [class.active]="activeTab() === 'notifications'" (click)="activeTab.set('notifications')">
              Envíos ({{ data.notifications().length }})
            </button>
          </div>

          @if (activeTab() === 'categories') {
            <button class="m3-primary-btn" type="button" (click)="openCategoryModal()">
              <span class="material-icons-outlined">add</span>
              Nueva categoría IA
            </button>
          } @else if (activeTab() === 'protocols') {
            <button class="m3-primary-btn" type="button" (click)="openProtocolModal()">
              <span class="material-icons-outlined">add</span>
              Nuevo protocolo
            </button>
          } @else if (activeTab() === 'contacts') {
            <button class="m3-primary-btn" type="button" (click)="openContactModal()">
              <span class="material-icons-outlined">person_add</span>
              Nuevo contacto
            </button>
          }
        </div>
      </header>

      <!-- TAB 1: INCIDENT CATEGORIES & AI THRESHOLDS -->
      @if (activeTab() === 'categories') {
        <section class="categories-grid">
          @for (cat of data.categories(); track cat.id) {
            <article class="m3-card cat-card">
              <div class="cat-top">
                <code class="code-tag">{{ cat.code }}</code>
                <span class="m3-badge"
                  [class.badge-error]="cat.severity_level === 'CRITICAL'"
                  [class.badge-warning]="cat.severity_level === 'HIGH'"
                  [class.badge-info]="cat.severity_level === 'MEDIUM' || cat.severity_level === 'LOW'">
                  {{ cat.severity_level }}
                </span>
              </div>
              <h3>{{ cat.name }}</h3>

              <div class="threshold-box">
                <div class="thresh-row">
                  <span>Umbral de confianza (<code>confidence_threshold</code>)</span>
                  <strong>{{ (cat.confidence_threshold * 100).toFixed(0) }} %</strong>
                </div>
                <div class="thresh-bar">
                  <span [style.width.%]="cat.confidence_threshold * 100"></span>
                </div>
                <div class="thresh-row" style="margin-top:8px">
                  <span>Persistencia mínima (<code>persistence_ms</code>)</span>
                  <strong>{{ cat.persistence_ms }} ms</strong>
                </div>
              </div>

              <div class="cat-footer">
                <span class="m3-badge" [class.badge-success]="cat.is_active" [class.badge-neutral]="!cat.is_active">
                  {{ cat.is_active ? 'Modelo activo' : 'Pausado' }}
                </span>
                <button class="m3-outlined-btn" type="button" (click)="openCategoryModal(cat)">
                  <span class="material-icons-outlined" style="font-size:16px">tune</span>
                  Calibrar umbral
                </button>
              </div>
            </article>
          }
        </section>
      }

      <!-- TAB 2: PROTOCOLS -->
      @if (activeTab() === 'protocols') {
        <section class="protocols-list">
          @for (p of data.protocols(); track p.id) {
            @let cat = data.getCategoryById(p.category_id);
            <article class="m3-card proto-card">
              <div class="proto-card-head">
                <div>
                  <span class="m3-badge badge-info">{{ cat?.name || 'Categoría #' + p.category_id }}</span>
                  <h3>{{ p.title }}</h3>
                </div>
                <div class="proto-actions">
                  <span class="m3-badge" [class.badge-success]="p.is_active" [class.badge-neutral]="!p.is_active">
                    {{ p.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                  <button class="m3-outlined-btn" type="button" (click)="openProtocolModal(p)">
                    <span class="material-icons-outlined" style="font-size:16px">edit</span>
                    Editar pasos
                  </button>
                </div>
              </div>
              <pre class="steps-pre">{{ p.steps }}</pre>
            </article>
          }
        </section>
      }

      <!-- TAB 3: EMERGENCY CONTACTS -->
      @if (activeTab() === 'contacts') {
        <section class="m3-table-wrapper">
          <table class="m3-table">
            <thead>
              <tr>
                <th>Nombre / Unidad (<code>name</code>)</th>
                <th>Tipo (<code>type</code>)</th>
                <th>Teléfono (<code>phone</code>)</th>
                <th>Correo Electrónico (<code>email</code>)</th>
                <th>Recibe Alertas Email</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of data.emergencyContacts(); track c.id) {
                <tr>
                  <td><strong>{{ c.name }}</strong></td>
                  <td><span class="m3-badge badge-info">{{ c.type }}</span></td>
                  <td>{{ c.phone || '—' }}</td>
                  <td>{{ c.email || '—' }}</td>
                  <td>
                    <span class="m3-badge" [class.badge-success]="c.receives_email" [class.badge-neutral]="!c.receives_email">
                      {{ c.receives_email ? 'Sí recibe' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <span class="m3-badge" [class.badge-success]="c.is_active" [class.badge-neutral]="!c.is_active">
                      {{ c.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <button class="m3-outlined-btn" type="button" (click)="openContactModal(c)">
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

      <!-- TAB 4: NOTIFICATIONS LOG -->
      @if (activeTab() === 'notifications') {
        <section class="m3-table-wrapper">
          <table class="m3-table">
            <thead>
              <tr>
                <th>ID Envío</th>
                <th>Incidente (<code>incident_id</code>)</th>
                <th>Destinatario (<code>recipient_email</code>)</th>
                <th>Estado (<code>status</code>)</th>
                <th>Fecha/Hora (<code>sent_at</code>)</th>
                <th>Detalle / Error (<code>error</code>)</th>
              </tr>
            </thead>
            <tbody>
              @for (n of data.notifications(); track n.id) {
                <tr>
                  <td><strong>#{{ n.id }}</strong></td>
                  <td>Incidente #{{ n.incident_id }}</td>
                  <td>{{ n.recipient_email }}</td>
                  <td>
                    <span class="m3-badge"
                      [class.badge-success]="n.status === 'SENT'"
                      [class.badge-warning]="n.status === 'PENDING'"
                      [class.badge-error]="n.status === 'FAILED'">
                      {{ n.status }}
                    </span>
                  </td>
                  <td>{{ n.sent_at | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                  <td>
                    @if (n.error) {
                      <span class="err-text">{{ n.error }}</span>
                    } @else {
                      <span class="sub-text">Entregado sin errores</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }
    </main>

    <!-- CATEGORY MODAL -->
    @if (categoryModalOpen()) {
      <div class="m3-dialog-backdrop" (mousedown)="closeOnBackdrop($event)">
        <section class="m3-dialog">
          <h2>{{ editingCategoryId() ? 'Calibrar categoría IA' : 'Nueva categoría de detección IA' }}</h2>
          <form [formGroup]="categoryForm" (ngSubmit)="submitCategory()" class="m3-form-grid" style="margin-top:16px">
            <div class="m3-field">
              <label>Código interno (<code>code</code>)</label>
              <input type="text" formControlName="code" placeholder="PHYS_ASSAULT" />
            </div>
            <div class="m3-field">
              <label>Severidad (<code>severity_level</code>)</label>
              <select formControlName="severity_level">
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <div class="m3-field full-width">
              <label>Nombre descriptivo (<code>name</code>)</label>
              <input type="text" formControlName="name" placeholder="Agresión física / Pelea" />
            </div>
            <div class="m3-field">
              <label>Umbral de confianza 0.10 – 0.99 (<code>confidence_threshold</code>)</label>
              <input type="number" step="0.01" min="0.1" max="0.99" formControlName="confidence_threshold" />
            </div>
            <div class="m3-field">
              <label>Persistencia en milisegundos (<code>persistence_ms</code>)</label>
              <input type="number" step="100" min="100" formControlName="persistence_ms" />
            </div>
            <div class="m3-field full-width">
              <label class="check-row">
                <input type="checkbox" formControlName="is_active" />
                <span>Categoría activa en el motor de inferencia (<code>is_active</code>)</span>
              </label>
            </div>
            <div class="modal-actions full-width">
              <button class="m3-outlined-btn" type="button" (click)="categoryModalOpen.set(false)">Cancelar</button>
              <button class="m3-primary-btn" type="submit" [disabled]="categoryForm.invalid">Guardar categoría</button>
            </div>
          </form>
        </section>
      </div>
    }

    <!-- PROTOCOL MODAL -->
    @if (protocolModalOpen()) {
      <div class="m3-dialog-backdrop" (mousedown)="closeOnBackdrop($event)">
        <section class="m3-dialog">
          <h2>{{ editingProtocolId() ? 'Editar protocolo' : 'Crear protocolo de respuesta' }}</h2>
          <form [formGroup]="protocolForm" (ngSubmit)="submitProtocol()" class="m3-form-grid" style="margin-top:16px">
            <div class="m3-field full-width">
              <label>Categoría asociada (<code>category_id</code>)</label>
              <select formControlName="category_id">
                @for (cat of data.categories(); track cat.id) {
                  <option [ngValue]="cat.id">{{ cat.name }} ({{ cat.code }})</option>
                }
              </select>
            </div>
            <div class="m3-field full-width">
              <label>Título del protocolo (<code>title</code>)</label>
              <input type="text" formControlName="title" />
            </div>
            <div class="m3-field full-width">
              <label>Pasos de actuación, uno por línea (<code>steps</code>)</label>
              <textarea rows="5" formControlName="steps"></textarea>
            </div>
            <div class="m3-field full-width">
              <label class="check-row">
                <input type="checkbox" formControlName="is_active" />
                <span>Protocolo vigente (<code>is_active</code>)</span>
              </label>
            </div>
            <div class="modal-actions full-width">
              <button class="m3-outlined-btn" type="button" (click)="protocolModalOpen.set(false)">Cancelar</button>
              <button class="m3-primary-btn" type="submit" [disabled]="protocolForm.invalid">Guardar protocolo</button>
            </div>
          </form>
        </section>
      </div>
    }

    <!-- CONTACT MODAL -->
    @if (contactModalOpen()) {
      <div class="m3-dialog-backdrop" (mousedown)="closeOnBackdrop($event)">
        <section class="m3-dialog">
          <h2>{{ editingContactId() ? 'Editar contacto de emergencia' : 'Registrar contacto de emergencia' }}</h2>
          <form [formGroup]="contactForm" (ngSubmit)="submitContact()" class="m3-form-grid" style="margin-top:16px">
            <div class="m3-field full-width">
              <label>Nombre o entidad (<code>name</code>)</label>
              <input type="text" formControlName="name" />
            </div>
            <div class="m3-field">
              <label>Tipo de contacto (<code>type</code>)</label>
              <select formControlName="type">
                <option value="INTERNAL_SECURITY">INTERNAL_SECURITY</option>
                <option value="POLICE">POLICE</option>
                <option value="MEDICAL">MEDICAL</option>
                <option value="FIRE_DEPT">FIRE_DEPT</option>
                <option value="ADMINISTRATOR">ADMINISTRATOR</option>
              </select>
            </div>
            <div class="m3-field">
              <label>Teléfono (<code>phone</code>)</label>
              <input type="text" formControlName="phone" />
            </div>
            <div class="m3-field full-width">
              <label>Correo electrónico (<code>email</code>)</label>
              <input type="email" formControlName="email" />
            </div>
            <div class="m3-field">
              <label class="check-row">
                <input type="checkbox" formControlName="receives_email" />
                <span>Enviar alertas automáticas por correo</span>
              </label>
            </div>
            <div class="m3-field">
              <label class="check-row">
                <input type="checkbox" formControlName="is_active" />
                <span>Contacto habilitado</span>
              </label>
            </div>
            <div class="modal-actions full-width">
              <button class="m3-outlined-btn" type="button" (click)="contactModalOpen.set(false)">Cancelar</button>
              <button class="m3-primary-btn" type="submit" [disabled]="contactForm.invalid">Guardar contacto</button>
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
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 18px;
    }
    .cat-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .cat-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .code-tag {
      padding: 4px 8px;
      border-radius: 6px;
      background: var(--m3-low);
      font-size: 11px;
      font-weight: 700;
    }
    .cat-card h3 {
      margin: 0;
      font-size: 17px;
      font-weight: 500;
    }
    .threshold-box {
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--m3-low);
    }
    .thresh-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--m3-muted);
    }
    .thresh-row strong {
      color: var(--m3-ink);
    }
    .thresh-bar {
      height: 7px;
      margin-top: 6px;
      border-radius: 100px;
      background: var(--m3-blue-container);
      overflow: hidden;
    }
    .thresh-bar span {
      display: block;
      height: 100%;
      background: var(--m3-primary);
    }
    .cat-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .protocols-list {
      display: grid;
      gap: 16px;
    }
    .proto-card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }
    .proto-card-head h3 {
      margin: 8px 0 0;
      font-size: 17px;
      font-weight: 500;
    }
    .proto-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .steps-pre {
      margin: 12px 0 0;
      padding: 14px;
      border-radius: 12px;
      background: var(--m3-low);
      font-family: inherit;
      font-size: 13px;
      line-height: 1.55;
      white-space: pre-wrap;
    }
    .err-text {
      color: var(--m3-error);
      font-size: 12px;
    }
    .sub-text {
      color: var(--m3-muted);
      font-size: 12px;
    }
    .check-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
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
      margin-top: 8px;
    }
  `]
})
export class AlertsConfigComponent {
  readonly data = inject(CentinelaDataService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<'categories' | 'protocols' | 'contacts' | 'notifications'>('categories');

  readonly categoryModalOpen = signal(false);
  readonly editingCategoryId = signal<number | null>(null);

  readonly protocolModalOpen = signal(false);
  readonly editingProtocolId = signal<number | null>(null);

  readonly contactModalOpen = signal(false);
  readonly editingContactId = signal<number | null>(null);

  readonly categoryForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    severity_level: ['HIGH' as SeverityLevel, [Validators.required]],
    confidence_threshold: [0.85, [Validators.required, Validators.min(0.1), Validators.max(0.99)]],
    persistence_ms: [1200, [Validators.required, Validators.min(100)]],
    is_active: [true]
  });

  readonly protocolForm = this.fb.nonNullable.group({
    category_id: [1, [Validators.required]],
    title: ['', [Validators.required]],
    steps: ['', [Validators.required]],
    is_active: [true]
  });

  readonly contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    type: ['INTERNAL_SECURITY' as ContactType, [Validators.required]],
    phone: [''],
    email: [''],
    receives_email: [true],
    is_active: [true]
  });

  openCategoryModal(cat?: IncidentCategory): void {
    if (cat) {
      this.editingCategoryId.set(cat.id);
      this.categoryForm.patchValue(cat);
    } else {
      this.editingCategoryId.set(null);
      this.categoryForm.reset({
        code: 'INTRUSION_ALERT',
        name: '',
        severity_level: 'HIGH',
        confidence_threshold: 0.85,
        persistence_ms: 1500,
        is_active: true
      });
    }
    this.categoryModalOpen.set(true);
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) return;
    this.data.saveCategory({
      ...this.categoryForm.getRawValue(),
      id: this.editingCategoryId() ?? undefined
    });
    this.categoryModalOpen.set(false);
  }

  openProtocolModal(proto?: Protocol): void {
    if (proto) {
      this.editingProtocolId.set(proto.id);
      this.protocolForm.patchValue(proto);
    } else {
      this.editingProtocolId.set(null);
      this.protocolForm.reset({
        category_id: this.data.categories()[0]?.id ?? 1,
        title: '',
        steps: '1. Verificar cámara en vivo.\n2. Despachar agente de seguridad.',
        is_active: true
      });
    }
    this.protocolModalOpen.set(true);
  }

  submitProtocol(): void {
    if (this.protocolForm.invalid) return;
    this.data.saveProtocol({
      ...this.protocolForm.getRawValue(),
      id: this.editingProtocolId() ?? undefined
    });
    this.protocolModalOpen.set(false);
  }

  openContactModal(contact?: EmergencyContact): void {
    if (contact) {
      this.editingContactId.set(contact.id);
      this.contactForm.patchValue({
        name: contact.name,
        type: contact.type,
        phone: contact.phone ?? '',
        email: contact.email ?? '',
        receives_email: contact.receives_email,
        is_active: contact.is_active
      });
    } else {
      this.editingContactId.set(null);
      this.contactForm.reset({
        name: '',
        type: 'INTERNAL_SECURITY',
        phone: '',
        email: '',
        receives_email: true,
        is_active: true
      });
    }
    this.contactModalOpen.set(true);
  }

  submitContact(): void {
    if (this.contactForm.invalid) return;
    const raw = this.contactForm.getRawValue();
    this.data.saveEmergencyContact({
      ...raw,
      id: this.editingContactId() ?? undefined,
      phone: raw.phone || null,
      email: raw.email || null
    });
    this.contactModalOpen.set(false);
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.categoryModalOpen.set(false);
      this.protocolModalOpen.set(false);
      this.contactModalOpen.set(false);
    }
  }
}
