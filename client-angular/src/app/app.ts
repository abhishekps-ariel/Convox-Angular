import { Component } from '@angular/core';
import { AppContent } from './components/app-content/app-content';

@Component({
  selector: 'app-root',
  imports: [AppContent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
