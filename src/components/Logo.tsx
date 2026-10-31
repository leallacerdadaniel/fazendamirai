import logoSrc from '@/assets/logo.png';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-16 h-16' };
  return (
    <img src={logoSrc} alt="Fazenda Miraí" className={`${dims[size]} object-contain`} />
  );
}
