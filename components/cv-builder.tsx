"use client";

import { useState } from "react";
import Link from "next/link";
import { CEFR, EMPTY_CV, EQF, EXTRA_HEADINGS, draftFromProfile, newId, period, type Cefr, type Cv, type CvEducation, type CvExtra, type CvLanguage, type CvWork } from "@/lib/cv";
import { EMPTY_PREMIUM, STORAGE } from "@/lib/profile";
import { useStored } from "@/lib/storage";
import { useProfile } from "@/lib/use-profile";

const input = "w-full rounded border border-slate-300 px-2 py-1";
type Kind = "about" | "activities" | "skills";
type Suggestion = { text: string; missing: string[] };

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export function CvBuilder() {
  const [premium] = useStored(STORAGE.premium, EMPTY_PREMIUM);
  const [cv, setCv] = useStored(STORAGE.cv, EMPTY_CV);
  const [profile] = useProfile();
  const [ai, setAi] = useState<Record<string, Suggestion | "loading" | "error">>({});
  const [pdfState, setPdfState] = useState<"idle" | "making" | "error">("idle");
  const active = premium.status === "ACTIVE" && premium.subscriptionId;

  if (!active) {
    return (
      <div className="mx-auto max-w-lg space-y-3 rounded-xl border border-teal-200 bg-panel p-6 text-center">
        <h2 className="text-lg font-semibold">The CV builder is part of Hapi Premium</h2>
        <p className="text-sm text-slate-600">A CV in the official Europass structure, with AI that polishes your own words without inventing anything.</p>
        <Link href="/premium" className="inline-block rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white">
          Get Premium
        </Link>
      </div>
    );
  }

  const set = (patch: Partial<Cv>) => setCv({ ...cv, ...patch });
  const setList = <K extends "work" | "education" | "languages" | "extras">(key: K, list: Cv[K]) => set({ [key]: list } as Partial<Cv>);
  function update<T extends { id?: string; language?: string }>(list: T[], i: number, patch: Partial<T>): T[] {
    return list.map((x, j) => (j === i ? { ...x, ...patch } : x));
  }

  async function improve(key: string, kind: Kind, text: string, context?: string) {
    if (text.trim().length < 3) return;
    setAi((a) => ({ ...a, [key]: "loading" }));
    try {
      const res = await fetch("/api/cv/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: premium.subscriptionId, kind, text, context }),
      });
      if (!res.ok) throw new Error();
      const suggestion = (await res.json()) as Suggestion;
      setAi((a) => ({ ...a, [key]: suggestion }));
    } catch {
      setAi((a) => ({ ...a, [key]: "error" }));
    }
  }

  // Builds a real PDF in the browser; the library is loaded only when needed.
  async function downloadPdf() {
    setPdfState("making");
    try {
      const [{ pdf }, { CvDocument }] = await Promise.all([import("@react-pdf/renderer"), import("./cv-pdf")]);
      const blob = await pdf(<CvDocument cv={cv} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const name = [cv.firstName, cv.lastName].filter(Boolean).join("_") || "CV";
      a.href = url;
      a.download = `${name}_Europass_CV.pdf`.replace(/\s+/g, "_");
      a.click();
      URL.revokeObjectURL(url);
      setPdfState("idle");
    } catch {
      setPdfState("error");
    }
  }

  const dismiss = (id: string) =>
    setAi((a) => {
      const next = { ...a };
      delete next[id];
      return next;
    });
  const help = (id: string, kind: Kind, text: string, apply: (t: string) => void, context?: string) => (
    <AiHelp
      state={ai[id]}
      disabled={text.trim().length < 3}
      onImprove={() => improve(id, kind, text, context)}
      onUse={(t) => {
        apply(t);
        dismiss(id);
      }}
      onDismiss={() => dismiss(id)}
    />
  );

  const blankWork = (): CvWork => ({ id: newId(), role: "", employer: "", city: "", country: "", from: "", to: "", ongoing: false, activities: "" });
  const blankEdu = (): CvEducation => ({ id: newId(), title: "", organisation: "", city: "", country: "", from: "", to: "", ongoing: false, eqf: "", subjects: "" });
  const blankLang = (): CvLanguage => ({ language: "", listening: "B1", reading: "B1", production: "B1", interaction: "B1", writing: "B1", certificate: "" });
  const blankExtra = (): CvExtra => ({ id: newId(), heading: EXTRA_HEADINGS[0], title: "", date: "", description: "" });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Form */}
      <div className="space-y-5 print:hidden">
        <div className="flex flex-wrap gap-2 text-sm">
          <button type="button" onClick={() => setCv(draftFromProfile(cv, profile))} className="rounded border border-teal-700 px-3 py-1 text-teal-800">
            Fill from my Hapi profile
          </button>
          <button type="button" onClick={downloadPdf} disabled={pdfState === "making"} className="rounded bg-teal-700 px-3 py-1 text-white disabled:opacity-50">
            {pdfState === "making" ? "Making PDF…" : "Download PDF"}
          </button>
          <button type="button" onClick={() => window.print()} className="rounded border border-slate-300 px-3 py-1">
            Print
          </button>
          {pdfState === "error" && <span className="self-center text-xs text-rose-700">Could not make the PDF. Try Print instead.</span>}
          <button type="button" onClick={() => confirmClear() && setCv(EMPTY_CV)} className="ml-auto text-xs text-slate-500 underline">
            Clear CV
          </button>
        </div>

        <section className="space-y-2 rounded-xl border border-slate-200 bg-panel p-4">
          <h2 className="font-semibold">Personal information</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name"><input className={input} value={cv.firstName} onChange={(e) => set({ firstName: e.target.value })} /></Field>
            <Field label="Surname"><input className={input} value={cv.lastName} onChange={(e) => set({ lastName: e.target.value })} /></Field>
            <Field label="Date of birth (optional)"><input type="date" className={input} value={cv.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} /></Field>
            <Field label="Nationality"><input className={input} value={cv.nationality} onChange={(e) => set({ nationality: e.target.value })} /></Field>
            <Field label="Phone"><input className={input} value={cv.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
            <Field label="Email"><input type="email" className={input} value={cv.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label="Address (city and country is enough)" wide><input className={input} value={cv.address} onChange={(e) => set({ address: e.target.value })} /></Field>
            <Field label="Website, GitHub or LinkedIn" wide><input className={input} value={cv.website} onChange={(e) => set({ website: e.target.value })} /></Field>
          </div>
          <Field label="About me" wide>
            <textarea rows={3} className={input} value={cv.about} onChange={(e) => set({ about: e.target.value })} placeholder="Who you are, what you are good at, what you are looking for." />
          </Field>
          {help("about", "about", cv.about, (t) => set({ about: t }))}
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-panel p-4">
          <h2 className="font-semibold">Work experience</h2>
          <p className="text-xs text-slate-500">Jobs, internships, summer work, volunteering roles. Newest first.</p>
          {cv.work.map((w, i) => (
            <div key={w.id} className="space-y-2 rounded border border-slate-200 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Occupation or position"><input className={input} value={w.role} onChange={(e) => setList("work", update(cv.work, i, { role: e.target.value }))} /></Field>
                <Field label="Employer"><input className={input} value={w.employer} onChange={(e) => setList("work", update(cv.work, i, { employer: e.target.value }))} /></Field>
                <Field label="City"><input className={input} value={w.city} onChange={(e) => setList("work", update(cv.work, i, { city: e.target.value }))} /></Field>
                <Field label="Country"><input className={input} value={w.country} onChange={(e) => setList("work", update(cv.work, i, { country: e.target.value }))} /></Field>
                <Field label="From"><input type="month" className={input} value={w.from} onChange={(e) => setList("work", update(cv.work, i, { from: e.target.value }))} /></Field>
                <Field label="To"><input type="month" className={input} disabled={w.ongoing} value={w.to} onChange={(e) => setList("work", update(cv.work, i, { to: e.target.value }))} /></Field>
              </div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={w.ongoing} onChange={(e) => setList("work", update(cv.work, i, { ongoing: e.target.checked }))} /> Ongoing</label>
              <Field label="Main activities and responsibilities" wide>
                <textarea rows={3} className={input} value={w.activities} onChange={(e) => setList("work", update(cv.work, i, { activities: e.target.value }))} />
              </Field>
              <div className="flex items-start justify-between">
                {help(`work-${w.id}`, "activities", w.activities, (t) => setList("work", update(cv.work, i, { activities: t })), `${w.role} at ${w.employer}`)}
                <button type="button" className="text-xs text-rose-700" onClick={() => setList("work", cv.work.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="text-sm text-teal-700" onClick={() => setList("work", [...cv.work, blankWork()])}>+ Add experience</button>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-panel p-4">
          <h2 className="font-semibold">Education and training</h2>
          {cv.education.map((ed, i) => (
            <div key={ed.id} className="space-y-2 rounded border border-slate-200 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Title of qualification" wide><input className={input} placeholder="e.g. Matura (HTL, Informatics)" value={ed.title} onChange={(e) => setList("education", update(cv.education, i, { title: e.target.value }))} /></Field>
                <Field label="School or university" wide><input className={input} value={ed.organisation} onChange={(e) => setList("education", update(cv.education, i, { organisation: e.target.value }))} /></Field>
                <Field label="City"><input className={input} value={ed.city} onChange={(e) => setList("education", update(cv.education, i, { city: e.target.value }))} /></Field>
                <Field label="Country"><input className={input} value={ed.country} onChange={(e) => setList("education", update(cv.education, i, { country: e.target.value }))} /></Field>
                <Field label="From"><input type="month" className={input} value={ed.from} onChange={(e) => setList("education", update(cv.education, i, { from: e.target.value }))} /></Field>
                <Field label="To"><input type="month" className={input} disabled={ed.ongoing} value={ed.to} onChange={(e) => setList("education", update(cv.education, i, { to: e.target.value }))} /></Field>
                <Field label="Level" wide>
                  <select className={input} value={ed.eqf} onChange={(e) => setList("education", update(cv.education, i, { eqf: e.target.value }))}>
                    {EQF.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
                  </select>
                </Field>
                <Field label="Main subjects, final grade, thesis (optional)" wide>
                  <textarea rows={2} className={input} value={ed.subjects} onChange={(e) => setList("education", update(cv.education, i, { subjects: e.target.value }))} />
                </Field>
              </div>
              <div className="flex justify-between text-xs">
                <label className="flex items-center gap-2"><input type="checkbox" checked={ed.ongoing} onChange={(e) => setList("education", update(cv.education, i, { ongoing: e.target.checked }))} /> Ongoing</label>
                <button type="button" className="text-rose-700" onClick={() => setList("education", cv.education.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="text-sm text-teal-700" onClick={() => setList("education", [...cv.education, blankEdu()])}>+ Add education</button>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-panel p-4">
          <h2 className="font-semibold">Language skills</h2>
          <Field label="Mother tongue(s)" wide><input className={input} value={cv.motherTongues} onChange={(e) => set({ motherTongues: e.target.value })} /></Field>
          <p className="text-xs text-slate-500">Other languages, rated with the CEFR self-assessment grid (A1 basic to C2 proficient).</p>
          {cv.languages.map((l, i) => (
            <div key={i} className="space-y-2 rounded border border-slate-200 p-3">
              <div className="flex gap-2">
                <input className={input} placeholder="Language" value={l.language} onChange={(e) => setList("languages", update(cv.languages, i, { language: e.target.value }))} />
                <button type="button" className="text-xs text-rose-700" onClick={() => setList("languages", cv.languages.filter((_, j) => j !== i))}>Remove</button>
              </div>
              <div className="grid grid-cols-5 gap-1 text-xs">
                {(["listening", "reading", "production", "interaction", "writing"] as const).map((k) => (
                  <label key={k} className="space-y-0.5">
                    <span className="block capitalize text-slate-600">{k === "production" ? "Speaking" : k === "interaction" ? "Conversation" : k}</span>
                    <select className="w-full rounded border border-slate-300" value={l[k]} onChange={(e) => setList("languages", update(cv.languages, i, { [k]: e.target.value as Cefr }))}>
                      {CEFR.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <input className={`${input} text-xs`} placeholder="Certificate, e.g. Cambridge C1 Advanced (2026)" value={l.certificate} onChange={(e) => setList("languages", update(cv.languages, i, { certificate: e.target.value }))} />
            </div>
          ))}
          <button type="button" className="text-sm text-teal-700" onClick={() => setList("languages", [...cv.languages, blankLang()])}>+ Add language</button>
        </section>

        <section className="space-y-2 rounded-xl border border-slate-200 bg-panel p-4">
          <h2 className="font-semibold">Skills</h2>
          <Field label="Digital skills" wide><textarea rows={3} className={input} placeholder="e.g. Java, Python, Git, Microsoft Office" value={cv.digitalSkills} onChange={(e) => set({ digitalSkills: e.target.value })} /></Field>
          {help("digital", "skills", cv.digitalSkills, (t) => set({ digitalSkills: t }), "digital skills")}
          <Field label="Communication, organisational and other skills" wide><textarea rows={3} className={input} value={cv.otherSkills} onChange={(e) => set({ otherSkills: e.target.value })} /></Field>
          {help("other", "skills", cv.otherSkills, (t) => set({ otherSkills: t }), "communication and organisational skills")}
          <Field label="Driving licence (e.g. B)" wide><input className={input} value={cv.drivingLicence} onChange={(e) => set({ drivingLicence: e.target.value })} /></Field>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-panel p-4">
          <h2 className="font-semibold">More sections</h2>
          {cv.extras.map((x, i) => (
            <div key={x.id} className="grid gap-2 rounded border border-slate-200 p-3 sm:grid-cols-2">
              <Field label="Section">
                <select className={input} value={x.heading} onChange={(e) => setList("extras", update(cv.extras, i, { heading: e.target.value }))}>
                  {EXTRA_HEADINGS.map((h) => <option key={h}>{h}</option>)}
                </select>
              </Field>
              <Field label="Date"><input className={input} placeholder="e.g. 11/2026" value={x.date} onChange={(e) => setList("extras", update(cv.extras, i, { date: e.target.value }))} /></Field>
              <Field label="Title" wide><input className={input} value={x.title} onChange={(e) => setList("extras", update(cv.extras, i, { title: e.target.value }))} /></Field>
              <Field label="Description" wide><textarea rows={2} className={input} value={x.description} onChange={(e) => setList("extras", update(cv.extras, i, { description: e.target.value }))} /></Field>
              <button type="button" className="justify-self-start text-xs text-rose-700" onClick={() => setList("extras", cv.extras.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className="text-sm text-teal-700" onClick={() => setList("extras", [...cv.extras, blankExtra()])}>+ Add project, award, volunteering…</button>
        </section>
        <p className="text-xs text-slate-500">Your CV is saved in this browser only. Text is sent to the AI only when you click &quot;Improve with AI&quot;.</p>
      </div>

      {/* Preview, also what gets printed */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <CvPreview cv={cv} />
      </div>
    </div>
  );
}

function AiHelp(props: { state: Suggestion | "loading" | "error" | undefined; disabled: boolean; onImprove: () => void; onUse: (t: string) => void; onDismiss: () => void }) {
  const s = props.state;
  return (
    <div className="space-y-1">
      <button type="button" disabled={s === "loading" || props.disabled} onClick={props.onImprove} className="text-xs text-teal-700 underline disabled:opacity-40">
        {s === "loading" ? "Improving…" : "✨ Improve with AI"}
      </button>
      {s === "error" && <p className="text-xs text-rose-700">AI is busy. Try again in a minute.</p>}
      {s && s !== "loading" && s !== "error" && (
        <div className="space-y-1 rounded border border-teal-200 bg-teal-50 p-2 text-xs">
          <p className="whitespace-pre-line text-slate-800">{s.text}</p>
          {s.missing.length > 0 && <p className="text-slate-600">Could you add: {s.missing.join(" · ")}</p>}
          <div className="flex gap-3">
            <button type="button" className="font-medium text-teal-800" onClick={() => props.onUse(s.text)}>
              Use this
            </button>
            <button type="button" className="text-slate-500" onClick={props.onDismiss}>
              Keep mine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function confirmClear(): boolean {
  return window.confirm("Clear the whole CV? This cannot be undone.");
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-4 border-b-2 border-[#0e47cb] pb-0.5 text-xs font-bold uppercase tracking-wider text-[#0e47cb]">{children}</h3>;
}

function CvPreview({ cv }: { cv: Cv }) {
  const name = `${cv.firstName} ${cv.lastName}`.trim();
  const contact = [cv.dateOfBirth && `Date of birth: ${cv.dateOfBirth.split("-").reverse().join("/")}`, cv.nationality && `Nationality: ${cv.nationality}`, cv.phone && `Phone: ${cv.phone}`, cv.email && `Email: ${cv.email}`, cv.website, cv.address && `Address: ${cv.address}`].filter(Boolean);
  const headings = [...new Set(cv.extras.map((x) => x.heading))];
  return (
    <article className="cv-print paper rounded-xl border border-slate-200 bg-white p-6 text-[13px] leading-snug text-slate-900 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="border-b border-slate-200 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#0e47cb]">Curriculum vitae · Europass structure</p>
        <h2 className="text-2xl font-bold">{name || "Your name"}</h2>
        {contact.length > 0 && <p className="mt-1 text-xs text-slate-600">{contact.join("  ·  ")}</p>}
      </header>

      {cv.about && (
        <>
          <Heading>About me</Heading>
          <p className="mt-1 whitespace-pre-line">{cv.about}</p>
        </>
      )}

      {cv.work.length > 0 && (
        <>
          <Heading>Work experience</Heading>
          {cv.work.map((w) => (
            <div key={w.id} className="mt-2 break-inside-avoid">
              <p className="text-xs text-slate-500">{[period(w.from, w.to, w.ongoing), [w.city, w.country].filter(Boolean).join(", ")].filter(Boolean).join("  ·  ")}</p>
              <p className="font-semibold">{w.role}{w.employer ? <span className="font-normal"> · {w.employer}</span> : null}</p>
              {w.activities && <p className="whitespace-pre-line">{w.activities}</p>}
            </div>
          ))}
        </>
      )}

      {cv.education.length > 0 && (
        <>
          <Heading>Education and training</Heading>
          {cv.education.map((e) => (
            <div key={e.id} className="mt-2 break-inside-avoid">
              <p className="text-xs text-slate-500">{[period(e.from, e.to, e.ongoing), [e.city, e.country].filter(Boolean).join(", ")].filter(Boolean).join("  ·  ")}</p>
              <p className="font-semibold">{e.title || "Qualification"}{e.organisation ? <span className="font-normal"> · {e.organisation}</span> : null}</p>
              {e.eqf && <p className="text-xs">EQF level {e.eqf}</p>}
              {e.subjects && <p className="whitespace-pre-line">{e.subjects}</p>}
            </div>
          ))}
        </>
      )}

      {(cv.motherTongues || cv.languages.length > 0) && (
        <>
          <Heading>Language skills</Heading>
          {cv.motherTongues && <p className="mt-1">Mother tongue(s): <span className="font-semibold">{cv.motherTongues}</span></p>}
          {cv.languages.length > 0 && (
            <table className="mt-2 w-full border-collapse text-center text-xs">
              <thead>
                <tr className="text-slate-500">
                  <th />
                  <th colSpan={2} className="border-b border-slate-200 font-medium">Understanding</th>
                  <th colSpan={2} className="border-b border-slate-200 font-medium">Speaking</th>
                  <th className="border-b border-slate-200 font-medium">Writing</th>
                </tr>
                <tr className="text-slate-500">
                  <th />
                  <th className="font-normal">Listening</th>
                  <th className="font-normal">Reading</th>
                  <th className="font-normal">Spoken production</th>
                  <th className="font-normal">Spoken interaction</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cv.languages.map((l, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-1 text-left font-semibold">
                      {l.language}
                      {l.certificate && <span className="block font-normal text-slate-500">{l.certificate}</span>}
                    </td>
                    <td>{l.listening}</td>
                    <td>{l.reading}</td>
                    <td>{l.production}</td>
                    <td>{l.interaction}</td>
                    <td>{l.writing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-1 text-[10px] text-slate-500">Levels: A1 and A2: basic user · B1 and B2: independent user · C1 and C2: proficient user</p>
        </>
      )}

      {cv.digitalSkills && (
        <>
          <Heading>Digital skills</Heading>
          <p className="mt-1 whitespace-pre-line">{cv.digitalSkills}</p>
        </>
      )}
      {cv.otherSkills && (
        <>
          <Heading>Communication and organisational skills</Heading>
          <p className="mt-1 whitespace-pre-line">{cv.otherSkills}</p>
        </>
      )}
      {cv.drivingLicence && (
        <>
          <Heading>Driving licence</Heading>
          <p className="mt-1">{cv.drivingLicence}</p>
        </>
      )}
      {headings.map((h) => (
        <div key={h}>
          <Heading>{h}</Heading>
          {cv.extras.filter((x) => x.heading === h).map((x) => (
            <div key={x.id} className="mt-2 break-inside-avoid">
              {x.date && <p className="text-xs text-slate-500">{x.date}</p>}
              <p className="font-semibold">{x.title}</p>
              {x.description && <p className="whitespace-pre-line">{x.description}</p>}
            </div>
          ))}
        </div>
      ))}
    </article>
  );
}
