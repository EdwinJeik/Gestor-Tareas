import { Component } from '@angular/core';
import { AuthService } from './services';
import { AuthComponent } from './auth.component';
import { TareasComponent } from './tareas.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AuthComponent, TareasComponent],
  template: `@if (auth.usuario()) { <app-tareas class="wrap" /> } @else { <app-auth /> }`,
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
