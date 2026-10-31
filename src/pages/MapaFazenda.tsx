import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MapDrawingControls from '@/components/MapDrawingControls';
import FazendaPhotoGallery from '@/components/FazendaPhotoGallery';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const categoriaLabels: Record<string, string> = {
  geral: 'Geral',
  recria: 'Recria',
  prenhas: 'Prenhas',
  exposicao: 'Exposição',
  desmama: 'Desmama',
  engorda: 'Engorda',
  secas: 'Secas',
  receptoras: 'Receptoras',
  doadoras: 'Doadoras',
  touros: 'Touros',
  bezerras: 'Bezerras',
  novilhas: 'Novilhas',
};

const defaultCenter: [number, number] = [-19.37457523, -43.71447415];
const defaultColor = 'hsl(var(--primary))';
const foregroundColor = 'hsl(var(--primary-foreground))';
const backgroundColor = 'hsl(var(--background))';
const mutedColor = 'hsl(var(--muted-foreground))';

function createIcon(cor: string, count: number) {
  return L.divIcon({
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `<div style="
      background:${cor};
      width:40px;
      height:40px;
      border-radius:9999px;
      display:flex;
      align-items:center;
      justify-content:center;
      color:${foregroundColor};
      font-weight:700;
      font-size:14px;
      border:3px solid ${backgroundColor};
      box-shadow:0 8px 18px rgba(0,0,0,0.24);
    ">${count}</div>`,
  });
}

export default function MapaFazenda() {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes-mapa'],
    queryFn: async () => {
      const { data } = await supabase.from('lotes').select('*').order('nome');
      return data || [];
    },
  });

  const { data: animais = [] } = useQuery({
    queryKey: ['animais-lote-count'],
    queryFn: async () => {
      const { data } = await supabase.from('animais').select('id, lote_id').eq('status', 'ativo');
      return data || [];
    },
  });

  const contagem = useMemo(() => {
    const counts: Record<string, number> = {};
    animais.forEach((animal: { lote_id: string | null }) => {
      if (animal.lote_id) counts[animal.lote_id] = (counts[animal.lote_id] || 0) + 1;
    });
    return counts;
  }, [animais]);

  const lotesSemCoordenadas = useMemo(
    () => lotes.filter((l: any) => {
      const hasPolygon = l.coordenadas && Array.isArray(l.coordenadas) && l.coordenadas.length >= 3;
      const hasPoint = l.latitude != null && l.longitude != null;
      return !hasPolygon && !hasPoint;
    }),
    [lotes],
  );

  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(defaultCenter, 17);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
      maxZoom: 19,
    }).addTo(map);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
      maxZoom: 19,
      opacity: 0.85,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;

    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      markersLayer.clearLayers();
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const bounds: [number, number][] = [];

    const popupHtml = (lote: any) => `
      <div style="text-align:center;min-width:150px;line-height:1.45;">
        <div style="font-weight:700;font-size:14px;">${lote.nome}</div>
        <div style="font-size:12px;color:${mutedColor};">${categoriaLabels[lote.categoria] || lote.categoria || 'Geral'}</div>
        ${lote.piquete ? `<div style="font-size:12px;">Piquete: ${lote.piquete}</div>` : ''}
        <div style="font-weight:700;font-size:18px;margin-top:6px;">${contagem[lote.id] || 0} animais</div>
        ${lote.capacidade ? `<div style="font-size:12px;color:${mutedColor};">Capacidade: ${lote.capacidade}</div>` : ''}
      </div>
    `;

    lotes.forEach((lote: any) => {
      const cor = lote.cor || defaultColor;
      const coords = lote.coordenadas as [number, number][] | null;

      // Render polygon if coordenadas exist (array of [lat, lng] pairs)
      if (coords && Array.isArray(coords) && coords.length >= 3) {
        const polygon = L.polygon(coords as L.LatLngExpression[], {
          color: cor,
          weight: 3,
          fillColor: cor,
          fillOpacity: 0.3,
        });
        polygon.bindPopup(popupHtml(lote));
        markersLayer.addLayer(polygon);

        // Add label at center
        const center = polygon.getBounds().getCenter();
        bounds.push([center.lat, center.lng]);

        const label = L.marker([center.lat, center.lng], {
          icon: createIcon(cor, contagem[lote.id] || 0),
        });
        label.bindPopup(popupHtml(lote));
        markersLayer.addLayer(label);
      } else if (lote.latitude != null && lote.longitude != null) {
        // Fallback: point marker
        const position: [number, number] = [Number(lote.latitude), Number(lote.longitude)];
        bounds.push(position);

        const marker = L.marker(position, {
          icon: createIcon(cor, contagem[lote.id] || 0),
        });
        marker.bindPopup(popupHtml(lote));
        markersLayer.addLayer(marker);
      }
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 18);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
    } else {
      map.setView(defaultCenter, 17);
    }

    map.invalidateSize();
  }, [contagem, lotes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Mapa da Fazenda</h1>
        <p className="text-muted-foreground">Visualize a distribuição dos lotes no mapa por satélite</p>
      </div>

      <MapDrawingControls lotes={lotes} mapInstance={mapInstanceRef.current} />

      <Card className="relative z-0 isolate overflow-hidden">
        <CardContent className="p-0">
          <div ref={mapElementRef} className="h-[600px] w-full" aria-label="Mapa da fazenda" />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {lotes.map((l: any) => (
          <div key={l.id} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: l.cor || defaultColor }} />
            <span className="text-sm text-foreground">{l.nome} ({contagem[l.id] || 0})</span>
          </div>
        ))}
      </div>

      {lotesSemCoordenadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-heading">Lotes sem localização no mapa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">
              Edite estes lotes em <a href="/lotes" className="underline">Gestão de Lotes</a> e adicione latitude/longitude para exibi-los no mapa.
            </p>
            <div className="flex flex-wrap gap-2">
              {lotesSemCoordenadas.map((l: any) => (
                <Badge key={l.id} variant="outline">
                  <div className="mr-1 h-2 w-2 rounded-full" style={{ backgroundColor: l.cor || defaultColor }} />
                  {l.nome}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <FazendaPhotoGallery />
    </div>
  );
}
