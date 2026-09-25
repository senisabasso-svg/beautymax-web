import type { ReactNode } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/container";

export function LegalArticle({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <>
      <PageHero eyebrow="Información" title={title} description={description} />
      <Container className="py-14">
        <article className="legal-copy">{children}</article>
      </Container>
    </>
  );
}
