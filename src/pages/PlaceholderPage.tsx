export default function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-heading font-bold">{title}</h1>
      <p className="text-muted-foreground">{description || 'Este módulo será implementado em breve.'}</p>
    </div>
  );
}
