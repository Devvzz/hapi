import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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

async function Detail({ params }: { params: PageProps<"/opportunities/[id]">["params"] }) {
  const { id } = await params;
  const o = opportunities.find((x) => x.id === id);
  if (!o) notFound();
  return <OpportunityDetail o={o} />;
}

// A quiet placeholder while the opportunity is looked up, so clicking into one feels instant.
function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading opportunity">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="h-10 w-2/3 rounded bg-slate-200" />
      <div className="h-40 rounded-2xl bg-slate-200" />
    </div>
  );
}

export default function OpportunityPage({ params }: PageProps<"/opportunities/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Detail params={params} />
    </Suspense>
  );
}
