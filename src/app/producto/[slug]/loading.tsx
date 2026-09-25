import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container className="grid gap-10 py-14 lg:grid-cols-2">
      <div className="aspect-[4/5] animate-pulse bg-black/5" />
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse bg-black/5" />
        <div className="h-12 w-3/4 animate-pulse bg-black/5" />
        <div className="h-6 w-32 animate-pulse bg-black/5" />
        <div className="h-24 w-full animate-pulse bg-black/5" />
      </div>
    </Container>
  );
}
