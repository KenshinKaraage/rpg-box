import { useMemo } from 'react';
import { useStore } from '@/stores';
import type { MapObject } from '@/types/map';
import type { ObjectVariable, VariablesComponent } from '@/types/components/VariablesComponent';

export interface MapObjectInfo {
  name: string;
  mapId: string;
  mapName: string;
}

/**
 * Returns a deduplicated list of all named objects across all maps.
 */
export function useMapObjects(): MapObjectInfo[] {
  const maps = useStore((s) => s.maps);

  return useMemo(() => {
    const result: MapObjectInfo[] = [];
    const seen = new Set<string>();

    for (const map of maps) {
      for (const layer of map.layers) {
        if (layer.type !== 'object' || !layer.objects) continue;
        for (const obj of layer.objects) {
          if (!obj.name || seen.has(obj.name)) continue;
          seen.add(obj.name);
          result.push({ name: obj.name, mapId: map.id, mapName: map.name });
        }
      }
    }
    return result;
  }, [maps]);
}

export interface ObjVarInfo {
  name: string;
  fieldType: string;
  classId?: string;
}

/**
 * Extract ObjectVariable entries from a VariablesComponent (handles both
 * class instances with serialize() and plain restored objects).
 */
function extractObjectVariables(varsComp: unknown): Record<string, ObjectVariable> | null {
  const comp = varsComp as Partial<VariablesComponent> & { data?: Record<string, unknown> };
  // Class instance — use .variables directly
  if (comp.variables && typeof comp.variables === 'object') {
    return comp.variables as Record<string, ObjectVariable>;
  }
  // serialized/plain form — try serialize() then .data
  const data = typeof comp.serialize === 'function' ? comp.serialize() : (comp.data ?? {});
  const raw = (data as Record<string, unknown>).variables as Record<string, unknown> | undefined;
  if (!raw) return null;

  const result: Record<string, ObjectVariable> = {};
  for (const [key, v] of Object.entries(raw)) {
    if (v && typeof v === 'object' && 'fieldType' in (v as Record<string, unknown>)) {
      result[key] = v as ObjectVariable;
    } else {
      const ft = typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string';
      result[key] = { fieldType: ft, value: v };
    }
  }
  return result;
}

/** Find a MapObject by name across all maps */
function findMapObject(
  maps: { layers: { type: string; objects?: MapObject[] }[] }[],
  objectName: string
): MapObject | null {
  for (const map of maps) {
    for (const layer of map.layers) {
      if (layer.type !== 'object' || !layer.objects) continue;
      const obj = layer.objects.find((o) => o.name === objectName);
      if (obj) return obj;
    }
  }
  return null;
}

/**
 * Returns the variable list for a given object name by scanning all maps.
 * "self" is resolved to the currently selected map object.
 * Each entry includes fieldType and classId for type matching.
 */
export function useObjectVariables(objectName: string): ObjVarInfo[] {
  const maps = useStore((s) => s.maps);
  const selectedMapId = useStore((s) => s.selectedMapId);
  const selectedObjectId = useStore((s) => s.selectedObjectId);

  return useMemo(() => {
    if (!objectName) return [];

    let resolvedName = objectName;
    // "self" → 選択中のオブジェクト名に解決
    if (objectName === 'self' && selectedMapId && selectedObjectId) {
      const map = maps.find((m) => m.id === selectedMapId);
      if (map) {
        for (const layer of map.layers) {
          if (layer.type !== 'object' || !layer.objects) continue;
          const obj = layer.objects.find((o) => o.id === selectedObjectId);
          if (obj) {
            resolvedName = obj.name;
            break;
          }
        }
      }
    }

    const obj = findMapObject(maps, resolvedName);
    if (!obj) return [];
    const varsComp = obj.components.find((c) => c.type === 'variables');
    if (!varsComp) return [];
    const variables = extractObjectVariables(varsComp);
    if (!variables) return [];
    return Object.entries(variables).map(([name, v]) => ({
      name,
      fieldType: v.fieldType,
      classId: v.classId,
    }));
  }, [maps, objectName, selectedMapId, selectedObjectId]);
}
