import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  template: `
  <main class="auth">
    <section class="auth-intro">
      <h1>Hoy, una cosa<br>a la vez.</h1>
      <p>Anota tus tareas, ordénalas por estado y ciérralas cuando estén listas.</p>
    </section>
    <form class="auth-form" (ngSubmit)="enviar()" #f="ngForm">
      <h2>{{ modo() === 'login' ? 'Inicia sesión' : 'Crea tu cuenta' }}</h2>
      @if (modo() === 'registro') {
        <label>Nombre <input name="nombre" [(ngModel)]="nombre" required autocomplete="name"></label>
      }
      <label>Correo <input name="email" type="email" [(ngModel)]="email" required autocomplete="email"></label>
      <label>Contraseña <input name="clave" type="password" [(ngModel)]="clave" required minlength="6" autocomplete="current-password"></label>
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      <button class="primary" [disabled]="f.invalid">{{ modo() === 'login' ? 'Entrar' : 'Registrarme' }}</button>
      <button type="button" class="link" (click)="alternar()">
        {{ modo() === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión' }}
      </button>
    </form>
  </main>`,
})
export class AuthComponent {
  modo = signal<'login' | 'registro'>('login');
  error = signal('');
  nombre = ''; email = ''; clave = '';
  constructor(private auth: AuthService) {}

  alternar() { this.modo.update(m => m === 'login' ? 'registro' : 'login'); this.error.set(''); }
  async enviar() {
    const err = this.modo() === 'login'
      ? await this.auth.entrar(this.email, this.clave)
      : await this.auth.registrar(this.nombre, this.email, this.clave);
    this.error.set(err ?? '');
  }
}
