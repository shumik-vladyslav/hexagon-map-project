import { Component } from '@angular/core';
import { MapComponent } from './core/map/map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MapComponent],
  template: '<app-map></app-map>',
})
export class AppComponent {
  title = 'hexagon-map-project';
}
