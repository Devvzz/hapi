import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpportunityDetail } from "@/components/opportunity-detail";
import { opportunities } from "@/lib/data";

export function generateStaticParams() {
  return opportunities.map((o) => ({ id: o.id }));
}

export async function generateMetadata({ params }: PageProps<"/opportunities/[id]">): Promise<Metadata> {
  const { id } = await params;
  const o = opportunities.find((x) => x.id === id);
  return { title: o ? `${o.title} – Hapi` : "Hapi" };
}

export default async function OpportunityPage({ params }: PageProps<"/opportunities/[id]">) {
  const { id } = await params;
  const o = opportunities.find((x) => x.id === id);
  if (!o) notFound();
  return <OpportunityDetail o={o} />;
}
