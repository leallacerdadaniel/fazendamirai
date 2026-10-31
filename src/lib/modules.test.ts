import { describe, expect, it } from 'vitest';
import { farmModules, moduleForPath } from './modules';

describe('farm module navigation', () => {
  it('resolves every submodule and overview to the right parent', () => {
    for (const module of farmModules) {
      expect(moduleForPath(`/modulos/${module.id}`)?.id).toBe(module.id);
      for (const item of module.items) expect(moduleForPath(item.url)?.id).toBe(module.id);
    }
  });
  it('keeps animal profiles under Rebanho and IATF under Reprodução', () => {
    expect(moduleForPath('/animais/example/perfil')?.id).toBe('rebanho');
    expect(moduleForPath('/protocolos-iatf')?.id).toBe('reproducao');
  });
  it('does not treat home or an unrelated prefix as a submodule', () => {
    expect(moduleForPath('/dashboard')).toBeUndefined();
    expect(moduleForPath('/animais-outro')).toBeUndefined();
  });
  it('has unique module identifiers and destinations', () => {
    expect(new Set(farmModules.map(module => module.id)).size).toBe(farmModules.length);
    const destinations = farmModules.flatMap(module => module.items.map(item => item.url));
    expect(new Set(destinations).size).toBe(destinations.length);
  });
});