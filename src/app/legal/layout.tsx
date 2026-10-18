export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <><aside className="px-6 py-4 text-center bg-amber-50 text-amber-950">Draft policy preview. These texts describe proposed practices and require business and qualified legal review before launch.</aside>{children}</>;
}
