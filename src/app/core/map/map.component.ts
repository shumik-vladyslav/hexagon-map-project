import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { MapService } from './services/map.service';
import { HexagonService } from './services/hexagon.service';
import { HexagonFeature } from './models/hexagon-feature';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: '<div id="map"></div>',
  styles: [`
    #map {
      height: 100vh;
      width: 100%;
    }
  `],
  providers: [MapService, HexagonService]
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private boundsSubject = new BehaviorSubject<L.LatLngBounds | null>(null);

  constructor(
    private mapService: MapService,
    private hexagonService: HexagonService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.hexagonService.loadHexagonData();
  }

  ngAfterViewInit() {
    this.initMap();
    this.setupHexagonUpdates();
  }

  ngOnDestroy() {
    this.mapService.destroyMap();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initMap(): void {
    this.mapService.initializeMap('map');
    this.mapService.getMap().on('moveend zoomend', () => {
      this.ngZone.run(() => {
        this.boundsSubject.next(this.mapService.getMap().getBounds());
      });
    });

    this.boundsSubject.next(this.mapService.getMap().getBounds());
  }

  private setupHexagonUpdates(): void {
    const visibleHexagons$ = this.hexagonService.getHexagons().pipe(
      switchMap((allHexagons) =>
        this.boundsSubject.pipe(
          debounceTime(200),
          map((bounds) => this.hexagonService.filterVisibleHexagons(allHexagons, bounds))
        )
      ),
      takeUntil(this.destroy$)
    );

    visibleHexagons$.subscribe({
      next: (hexagons) => this.renderHexagons(hexagons),
      error: (error) => console.error('Error updating hexagons:', error),
    });
  }

  private renderHexagons(hexagons: HexagonFeature[]): void {
    this.mapService.clearHexagonLayer();
    const zoom = this.mapService.getMap().getZoom();
    const hexagonData = this.hexagonService.prepareHexagonData(hexagons, zoom);
    
    hexagonData.forEach(({ latLngBoundary, polygonOptions }) => {
      this.mapService.addHexagonToLayer(latLngBoundary, polygonOptions);
    });
  }
}
