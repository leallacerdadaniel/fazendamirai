import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Save, X, Undo2, Trash2 } from 'lucide-react';
import L from 'leaflet';

interface Lote {
  id: string;
  nome: string;
  cor: string | null;
  coordenadas: unknown;
}

interface Props {
  lotes: Lote[];
  mapInstance: L.Map | null;
}

export default function MapDrawingControls({ lotes, mapInstance }: Props) {
  const [drawing, setDrawing] = useState(false);
  const [selectedLoteId, setSelectedLoteId] = useState<string>('');
  const [points, setPoints] = useState<[number, number][]>([]);
  const [saving, setSaving] = useState(false);
  const drawLayerRef = useRef<L.LayerGroup | null>(null);
  const queryClient = useQueryClient();

  const selectedLote = lotes.find(l => l.id === selectedLoteId);
  const drawColor = selectedLote?.cor || '#3B82F6';

  // Initialize drawing layer
  useEffect(() => {
    if (!mapInstance) return;
    const layer = L.layerGroup().addTo(mapInstance);
    drawLayerRef.current = layer;
    return () => {
      layer.clearLayers();
      mapInstance.removeLayer(layer);
      drawLayerRef.current = null;
    };
  }, [mapInstance]);

  // Render preview polygon + markers for points
  useEffect(() => {
    const layer = drawLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!drawing || points.length === 0) return;

    // Draw point markers
    points.forEach((pt, i) => {
      const marker = L.circleMarker(pt, {
        radius: 7,
        color: '#fff',
        weight: 2,
        fillColor: drawColor,
        fillOpacity: 1,
      });
      marker.bindTooltip(`Ponto ${i + 1}`, { permanent: false });
      layer.addLayer(marker);
    });

    // Draw preview polygon
    if (points.length >= 2) {
      const polyline = points.length >= 3
        ? L.polygon(points, { color: drawColor, weight: 2, fillColor: drawColor, fillOpacity: 0.25, dashArray: '6 4' })
        : L.polyline(points, { color: drawColor, weight: 2, dashArray: '6 4' });
      layer.addLayer(polyline);
    }
  }, [points, drawing, drawColor]);

  // Map click handler
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    setPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
  }, []);

  useEffect(() => {
    if (!mapInstance) return;
    if (drawing) {
      mapInstance.getContainer().style.cursor = 'crosshair';
      mapInstance.on('click', handleMapClick);
    } else {
      mapInstance.getContainer().style.cursor = '';
      mapInstance.off('click', handleMapClick);
    }
    return () => {
      mapInstance.off('click', handleMapClick);
      mapInstance.getContainer().style.cursor = '';
    };
  }, [drawing, mapInstance, handleMapClick]);

  const startDrawing = () => {
    if (!selectedLoteId) {
      toast.error('Selecione um lote primeiro');
      return;
    }
    setPoints([]);
    setDrawing(true);
    toast.info('Clique no mapa para adicionar pontos do perímetro');
  };

  const cancelDrawing = () => {
    setDrawing(false);
    setPoints([]);
    drawLayerRef.current?.clearLayers();
  };

  const undoLastPoint = () => {
    setPoints(prev => prev.slice(0, -1));
  };

  const savePolygon = async () => {
    if (points.length < 3) {
      toast.error('Desenhe pelo menos 3 pontos');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lotes')
        .update({ coordenadas: points as any })
        .eq('id', selectedLoteId);
      if (error) throw error;
      toast.success(`Área do lote "${selectedLote?.nome}" salva com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['lotes-mapa'] });
      cancelDrawing();
    } catch {
      toast.error('Erro ao salvar coordenadas');
    } finally {
      setSaving(false);
    }
  };

  const clearPolygon = async () => {
    if (!selectedLoteId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lotes')
        .update({ coordenadas: null })
        .eq('id', selectedLoteId);
      if (error) throw error;
      toast.success('Área removida');
      queryClient.invalidateQueries({ queryKey: ['lotes-mapa'] });
    } catch {
      toast.error('Erro ao remover área');
    } finally {
      setSaving(false);
    }
  };

  const hasExistingPolygon = selectedLote?.coordenadas && Array.isArray(selectedLote.coordenadas) && (selectedLote.coordenadas as any[]).length >= 3;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
      <Select value={selectedLoteId} onValueChange={setSelectedLoteId} disabled={drawing}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione um lote" />
        </SelectTrigger>
        <SelectContent>
          {lotes.map(l => (
            <SelectItem key={l.id} value={l.id}>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: l.cor || '#3B82F6' }} />
                {l.nome}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!drawing ? (
        <>
          <Button size="sm" onClick={startDrawing} disabled={!selectedLoteId}>
            <Pencil className="mr-1 h-4 w-4" />
            Desenhar Área
          </Button>
          {hasExistingPolygon && (
            <Button size="sm" variant="destructive" onClick={clearPolygon} disabled={saving || !selectedLoteId}>
              <Trash2 className="mr-1 h-4 w-4" />
              Remover Área
            </Button>
          )}
        </>
      ) : (
        <>
          <span className="text-sm text-muted-foreground">
            {points.length} ponto{points.length !== 1 ? 's' : ''}
          </span>
          <Button size="sm" variant="outline" onClick={undoLastPoint} disabled={points.length === 0}>
            <Undo2 className="mr-1 h-4 w-4" />
            Desfazer
          </Button>
          <Button size="sm" onClick={savePolygon} disabled={points.length < 3 || saving}>
            <Save className="mr-1 h-4 w-4" />
            Salvar
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelDrawing}>
            <X className="mr-1 h-4 w-4" />
            Cancelar
          </Button>
        </>
      )}
    </div>
  );
}
