import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CentinelaDataService } from '../../core/services/centinela-data.service';
import { User, UserRole } from '../../core/models/database.models';

@Component({
  selector: 'app-users-terms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="m3-page">
      <header class="m3-page-header">
        <div>
          <h1>Usuarios y términos de uso</h1>
          <p>
            Gestión de operadores (<code>users</code>), versiones legales (<code>terms_and_conditions</code>) y auditoría de firmas (<code>terms_acceptances</code>).
          </p>
        </div>

        <div class="header-controls">
          <div class="m3-segmented">
            <button type="button" [class.active]="activeTab() === 'users'" (click)="activeTab.set('users')">
              Usuarios ({{ data.users().length }})
            </button>
            <button type="button" [class.active]="activeTab() === 'terms'" (click)="activeTab.set('terms')">
              Términos y Aceptaciones
            </button>
          </div>

          @if (activeTab() === 'users') {
            <button class="m3-primary-btn" type="button" (click)="openUserModal()">
              <span class="material-icons-outlined">person_add</span>
              Nuevo usuario
            </button>
          } @else {
            <button class="m3-primary-btn" type="button" (click)="termsModalOpen.set(true)">
              <span class="material-icons-outlined">post_add</span>
              Publicar nueva versión
            </button>
          }
        </div>
      </header>

      <!-- TAB 1: USERS -->
      @if (activeTab() === 'users') {
        <section class="m3-table-wrapper">
          <table class="m3-table">
            <thead>
              <tr>
                <th>ID / Nombre</th>
                <th>Correo (<code>email</code>)</th>
                <th>Rol (<code>role</code>)</th>
                <th>Aceptación Términos ({{ data.currentTerms().version }})</th>
                <th>Estado (<code>is_active</code>)</th>
                <th>Fecha Alta (<code>created_at</code>)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of data.users(); track u.id) {
                @let acceptance = getAcceptanceForUser(u.id);
                <tr>
                  <td>
                    <strong>{{ u.name }}</strong>
                    @if (data.currentUser().id === u.id) {
                      <span class="m3-badge badge-info" style="margin-left:6px">Sesión actual</span>
                    }
                  </td>
                  <td>{{ u.email }}</td>
                  <td>
                    <span class="m3-badge"
                      [class.badge-info]="u.role === 'ADMIN'"
                      [class.badge-success]="u.role === 'SUPERVISOR'"
                      [class.badge-neutral]="u.role === 'OPERATOR'">
                      {{ u.role }}
                    </span>
                  </td>
                  <td>
                    @if (acceptance) {
                      <span class="m3-badge badge-success">
                        <i class="dot"></i> Aceptado ({{ acceptance.accepted_at | date:'dd/MM HH:mm' }})
                      </span>
                    } @else {
                      <span class="m3-badge badge-warning">Pendiente de firma</span>
                    }
                  </td>
                  <td>
                    <span class="m3-badge" [class.badge-success]="u.is_active" [class.badge-neutral]="!u.is_active">
                      {{ u.is_active ? 'Activo' : 'Suspendido' }}
                    </span>
                  </td>
                  <td>{{ u.created_at | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <div class="row-btns">
                      <button class="m3-outlined-btn" type="button" (click)="openUserModal(u)">
                        Editar
                      </button>
                      @if (data.currentUser().id !== u.id && u.is_active) {
                        <button class="m3-tonal-btn" type="button" (click)="data.switchActiveUser(u.id)">
                          Simular sesión
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      <!-- TAB 2: TERMS & ACCEPTANCES -->
      @if (activeTab() === 'terms') {
        <div class="terms-grid">
          <section class="versions-col">
            <h3>Historial de versiones (<code>terms_and_conditions</code>)</h3>
            @for (t of data.termsList(); track t.id) {
              <article class="m3-card terms-card" [class.current]="t.is_current">
                <div class="terms-head">
                  <strong>{{ t.version }} — {{ t.title }}</strong>
                  <span class="m3-badge" [class.badge-success]="t.is_current" [class.badge-neutral]="!t.is_current">
                    {{ t.is_current ? 'VIGENTE (is_current)' : 'Histórico' }}
                  </span>
                </div>
                <small class="pub-date">Publicado: {{ t.published_at | date:'dd MMM yyyy HH:mm' }}</small>
                <pre class="terms-content">{{ t.content }}</pre>
              </article>
            }
          </section>

          <section class="acceptances-col">
            <h3>Auditoría de firmas (<code>terms_acceptances</code>)</h3>
            <div class="m3-table-wrapper">
              <table class="m3-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Operador (<code>user_id</code>)</th>
                    <th>Versión (<code>terms_id</code>)</th>
                    <th>Fecha Aceptación</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of data.termsAcceptances(); track a.id) {
                    <tr>
                      <td>#{{ a.id }}</td>
                      <td><strong>{{ data.getUserById(a.user_id)?.name }}</strong></td>
                      <td>
                        <span class="m3-badge badge-info">{{ getTermsVersion(a.terms_id) }}</span>
                      </td>
                      <td>{{ a.accepted_at | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>
      }
    </main>

    <!-- USER MODAL -->
    @if (userModalOpen()) {
      <div class="m3-dialog-backdrop" (mousedown)="closeOnBackdrop($event)">
        <section class="m3-dialog">
          <h2>{{ editingUserId() ? 'Editar usuario' : 'Registrar nuevo operador' }}</h2>
          <form [formGroup]="userForm" (ngSubmit)="submitUser()" class="m3-form-grid" style="margin-top:16px">
            <div class="m3-field full-width">
              <label>Nombre completo (<code>name</code>)</label>
              <input type="text" formControlName="name" />
            </div>
            <div class="m3-field full-width">
              <label>Correo institucional (<code>email</code>)</label>
              <input type="email" formControlName="email" />
            </div>
            <div class="m3-field">
              <label>Rol del sistema (<code>role</code>)</label>
              <select formControlName="role">
                <option value="OPERATOR">OPERATOR</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div class="m3-field" style="justify-content:center">
              <label class="check-row">
                <input type="checkbox" formControlName="is_active" />
                <span>Cuenta activa (<code>is_active</code>)</span>
              </label>
            </div>
            <div class="modal-actions full-width">
              <button class="m3-outlined-btn" type="button" (click)="userModalOpen.set(false)">Cancelar</button>
              <button class="m3-primary-btn" type="submit" [disabled]="userForm.invalid">Guardar usuario</button>
            </div>
          </form>
        </section>
      </div>
    }

    <!-- PUBLISH NEW TERMS VERSION MODAL -->
    @if (termsModalOpen()) {
      <div class="m3-dialog-backdrop" (mousedown)="closeOnBackdrop($event)">
        <section class="m3-dialog">
          <h2>Publicar nueva versión de Términos y Condiciones</h2>
          <p class="sub-p">Al marcarse como <code>is_current = true</code>, el sistema solicitará aceptación inmediata a los operadores activos.</p>
          <form [formGroup]="termsForm" (ngSubmit)="submitTerms()" class="m3-form-grid">
            <div class="m3-field">
              <label>Versión (<code>version</code>)</label>
              <input type="text" formControlName="version" placeholder="v2.2" />
            </div>
            <div class="m3-field">
              <label>Título legal (<code>title</code>)</label>
              <input type="text" formControlName="title" />
            </div>
            <div class="m3-field full-width">
              <label>Contenido normativo (<code>content</code>)</label>
              <textarea rows="6" formControlName="content"></textarea>
            </div>
            <div class="modal-actions full-width">
              <button class="m3-outlined-btn" type="button" (click)="termsModalOpen.set(false)">Cancelar</button>
              <button class="m3-primary-btn" type="submit" [disabled]="termsForm.invalid">Publicar versión vigente</button>
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
    .row-btns {
      display: flex;
      gap: 8px;
    }
    .terms-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
    }
    .versions-col h3, .acceptances-col h3 {
      margin: 0 0 14px;
      font-size: 16px;
      font-weight: 500;
    }
    .versions-col {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .terms-card {
      border: 1px solid transparent;
    }
    .terms-card.current {
      border-color: var(--m3-primary);
    }
    .terms-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .pub-date {
      display: block;
      margin: 4px 0 10px;
      color: var(--m3-muted);
      font-size: 11.5px;
    }
    .terms-content {
      margin: 0;
      padding: 12px;
      border-radius: 10px;
      background: var(--m3-low);
      font-family: inherit;
      font-size: 12.5px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .sub-p {
      margin: 4px 0 16px;
      font-size: 13px;
      color: var(--m3-muted);
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
    @media (max-width: 900px) {
      .terms-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UsersTermsComponent {
  readonly data = inject(CentinelaDataService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<'users' | 'terms'>('users');
  readonly userModalOpen = signal(false);
  readonly editingUserId = signal<number | null>(null);
  readonly termsModalOpen = signal(false);

  readonly userForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    role: ['OPERATOR' as UserRole, [Validators.required]],
    is_active: [true]
  });

  readonly termsForm = this.fb.nonNullable.group({
    version: ['v2.2', [Validators.required]],
    title: ['Actualización de Protocolo de Privacidad y Custodia de Evidencia IA', [Validators.required]],
    content: [
      '1. Toda alerta generada por el motor de visión artificial requiere validación humana.\n2. Los registros de silenciamiento de sirenas quedan asociados al operador en turno.',
      [Validators.required]
    ]
  });

  getAcceptanceForUser(userId: number) {
    const currentId = this.data.currentTerms().id;
    return this.data
      .termsAcceptances()
      .find((a) => a.user_id === userId && a.terms_id === currentId && a.accepted);
  }

  getTermsVersion(termsId: number): string {
    return this.data.termsList().find((t) => t.id === termsId)?.version ?? `ID #${termsId}`;
  }

  openUserModal(user?: User): void {
    if (user) {
      this.editingUserId.set(user.id);
      this.userForm.patchValue({
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      });
    } else {
      this.editingUserId.set(null);
      this.userForm.reset({
        name: '',
        email: '',
        role: 'OPERATOR',
        is_active: true
      });
    }
    this.userModalOpen.set(true);
  }

  submitUser(): void {
    if (this.userForm.invalid) return;
    this.data.saveUser({
      ...this.userForm.getRawValue(),
      id: this.editingUserId() ?? undefined
    });
    this.userModalOpen.set(false);
  }

  submitTerms(): void {
    if (this.termsForm.invalid) return;
    const raw = this.termsForm.getRawValue();
    this.data.publishNewTermsVersion(raw.version, raw.title, raw.content);
    this.termsModalOpen.set(false);
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.userModalOpen.set(false);
      this.termsModalOpen.set(false);
    }
  }
}
