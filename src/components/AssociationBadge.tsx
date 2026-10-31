import abczLogo from '@/assets/associacoes/abcz-logo.png';
import girolandoLogo from '@/assets/associacoes/girolando-logo.png';

type Assoc = 'abcz' | 'girolando';

/**
 * Decide qual associação de criadores representa o animal,
 * com base na raça e no grau de sangue.
 * - Girolando (qualquer grau: 1/2, 5/8, 3/4, 1/4...) → Girolando
 * - Zebuínos puros (Gir, Nelore, grau PO) → ABCZ
 * - Demais (holandês, receptoras, mestiças) → nenhuma
 */
export function associationOf(animal: { raca?: string | null; grau_sangue?: string | null; raca_sangue?: string | null }): Assoc | null {
  const raca = (animal.raca || animal.raca_sangue || '').toLowerCase();
  const grau = (animal.grau_sangue || '').toLowerCase();

  if (raca.includes('girolando')) return 'girolando';
  if (raca.includes('gir') || raca.includes('nelore') || raca.includes('zebu')) return 'abcz';
  if (grau === 'po' && !raca.includes('holand')) return 'abcz';
  return null;
}

const CONFIG: Record<Assoc, { logo: string; label: string; title: string; bg: string }> = {
  abcz: { logo: abczLogo, label: 'ABCZ', title: 'Registro ABCZ (zebuíno)', bg: 'bg-white' },
  // A logo da Girolando é branca e transparente: precisa de fundo escuro (verde da marca)
  girolando: { logo: girolandoLogo, label: 'Girolando', title: 'Registro Girolando', bg: 'bg-[hsl(140_45%_22%)]' },
};

export function AssociationBadge({ animal, size = 'md' }: { animal: Parameters<typeof associationOf>[0]; size?: 'sm' | 'md' }) {
  const assoc = associationOf(animal);
  if (!assoc) return null;
  const { logo, label, title, bg } = CONFIG[assoc];
  const box = size === 'sm' ? 'h-8 w-8' : 'h-12 w-12';
  return (
    <div
      title={title}
      className={`${box} ${bg} shrink-0 rounded-full border border-border p-1 shadow-sm flex items-center justify-center overflow-hidden`}
    >
      <img src={logo} alt={label} className="max-h-full max-w-full object-contain" />
    </div>
  );
}
