import { Component } from '@angular/core';
import { AppContent } from './components/app-content/app-content';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppContent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
