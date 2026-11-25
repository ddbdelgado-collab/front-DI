import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CentinelaDataService } from '../../core/services/centinela-data.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-shell">
      <div class="login-card m3-card">
        <div class="login-brand">
          <span class="brand-mark">
            <span class="material-icons-outlined">videocam</span>
          </span>
          <div>
            <strong>centinela</strong>
            <small>SEGURIDAD CON IA · CENTRO DE CONTROL</small>
          </div>
        </div>

        <h1>Acceso de operadores</h1>
        <p class="subtitle">
          Selecciona un perfil de la tabla <code>users</code> o ingresa credenciales para acceder a la consola de monitoreo.
        </p>

        <div class="quick-users">
          <span class="eyebrow">CAMBIO RÁPIDO DE SESIÓN (MOCK USERS)</span>
          <div class="user-list">
            @for (u of data.users(); track u.id) {
              <button
                type="button"
                class="user-pill"
                [class.selected]="data.currentUser().id === u.id"
                [disabled]="!u.is_active"
                (click)="selectQuickUser(u.id)">
                <div class="u-info">
                  <strong>{{ u.name }}</strong>
                  <small>{{ u.email }}</small>
                </div>
                <span class="m3-badge" [class.badge-info]="u.role === 'ADMIN'" [class.badge-success]="u.role === 'SUPERVISOR'" [class.badge-neutral]="u.role === 'OPERATOR'">
                  {{ u.role }}
                </span>
                @if (!hasAccepted(u.id)) {
                  <span class="m3-badge badge-warning">Términos pendientes</span>
                }
              </button>
            }
          </div>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="m3-field">
            <label for="email">Correo institucional (<code>users.email</code>)</label>
            <input id="email" type="email" formControlName="email" />
          </div>
          <div class="m3-field">
            <label for="password">Contraseña</label>
            <input id="password" type="password" formControlName="password" />
          </div>

          <div class="human-principle">
            <span class="material-icons-outlined">verified_user</span>
            <span><strong>La IA alerta. Tú decides.</strong> Vigente: {{ data.currentTerms().version }} ({{ data.currentTerms().title }})</span>
          </div>

          <button class="m3-primary-btn full-btn" type="submit" [disabled]="loginForm.invalid">
            Ingresar al Centro de Control
            <span class="material-icons-outlined">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: linear-gradient(135deg, var(--m3-surface) 0%, var(--m3-blue-soft) 100%);
    }
    .login-card {
      width: min(100%, 500px);
      padding: 32px;
      border-radius: 24px;
      box-shadow: 0 16px 48px rgba(10, 43, 101, 0.12);
    }
    .login-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .brand-mark {
      display: grid;
      width: 44px;
      height: 44px;
      place-items: center;
      border-radius: 12px;
      background: var(--m3-primary);
      color: #fff;
    }
    .login-brand strong {
      display: block;
      font-size: 22px;
      color: var(--m3-brand-deep);
      font-weight: 500;
    }
    .login-brand small {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.65px;
      color: var(--m3-muted);
    }
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 400;
    }
    .subtitle {
      margin: 6px 0 20px;
      font-size: 13px;
      color: var(--m3-muted);
      line-height: 1.45;
    }
    .quick-users {
      margin-bottom: 20px;
    }
    .eyebrow {
      display: block;
      margin-bottom: 8px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.7px;
      color: var(--m3-muted);
    }
    .user-list {
      display: grid;
      gap: 8px;
    }
    .user-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 14px;
      border: 1px solid var(--m3-outline);
      border-radius: 12px;
      background: var(--m3-surface);
      text-align: left;
      transition: border-color 0.15s, background 0.15s;
    }
    .user-pill.selected {
      border-color: var(--m3-primary);
      background: var(--m3-blue-soft);
    }
    .user-pill:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .u-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }
    .u-info strong {
      font-size: 13px;
    }
    .u-info small {
      font-size: 11px;
      color: var(--m3-muted);
    }
    .login-form {
      display: grid;
      gap: 14px;
    }
    .human-principle {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--m3-blue-container);
      color: var(--m3-brand-deep);
      font-size: 11.5px;
      line-height: 1.4;
    }
    .full-btn {
      width: 100%;
      min-height: 44px;
      margin-top: 4px;
    }
  `]
})
export class LoginComponent {
  readonly data = inject(CentinelaDataService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loginForm = this.fb.nonNullable.group({
    email: [this.data.currentUser().email, [Validators.required, Validators.email]],
    password: ['••••••••••••', [Validators.required]]
  });

  selectQuickUser(userId: number): void {
    this.data.switchActiveUser(userId);
    this.loginForm.patchValue({ email: this.data.currentUser().email });
  }

  hasAccepted(userId: number): boolean {
    const terms = this.data.currentTerms();
    return this.data.termsAcceptances().some(
      (a) => a.user_id === userId && a.terms_id === terms.id && a.accepted
    );
  }

  onSubmit(): void {
    const email = this.loginForm.getRawValue().email;
    const found = this.data.users().find((u) => u.email.toLowerCase() === email.toLowerCase() && u.is_active);
    if (found) {
      this.data.switchActiveUser(found.id);
    }
    this.router.navigate(['/monitoreo']);
  }
}
