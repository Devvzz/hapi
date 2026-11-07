import { CvBuilder } from "@/components/cv-builder";

export default function CvPage() {
  return (
    <div className="space-y-6">
      <header className="print:hidden">
        <h1 className="text-2xl font-bold">Europass CV</h1>
        <p className="text-sm text-slate-600">
          Built in the structure of the European Union&apos;s Europass CV, the format many universities, scholarships and employers in Europe expect. Premium.
        </p>
      </header>
      <CvBuilder />
    </div>
  );
}
