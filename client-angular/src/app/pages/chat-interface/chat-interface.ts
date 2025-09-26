import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/authService';
import { NavbarComponent } from "../../components/navbar/navbar";

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl:'./chat-interface.html'
})
export class ChatInterfaceComponent {
 
}
