export interface FoundationStatusProps {
  title: string;
  description: string;
}

export function FoundationStatus({ title, description }: FoundationStatusProps) {
  return (
    <article className="foundation-card">
      <span className="foundation-marker" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
}
