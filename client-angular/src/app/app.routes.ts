import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ChatInterfaceComponent } from './pages/chat-interface/chat-interface';
import { AuthGuard } from './guard/authGuard'; 

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'chat', component: ChatInterfaceComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' }
];
