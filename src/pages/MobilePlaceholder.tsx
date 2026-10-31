export default function MobilePlaceholder({ title }: { title: string }) {
  return (
    <div className="p-4">
      <h1 className="text-xl font-heading font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">Em breve...</p>
    </div>
  );
}
