import { PageHero } from "@/components/ui";
import { CvBuilder } from "@/components/cv-builder";

export default function CvPage() {
  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHero kicker="Premium · Europass" title="Your" highlight="CV" subtitle="In the structure of the EU’s Europass CV, the format many universities, scholarships and employers in Europe expect." />
      </div>
      <CvBuilder />
    </div>
  );
}
