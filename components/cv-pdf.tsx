import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { period, type Cv } from "@/lib/cv";

// The CV as a real PDF (selectable text), laid out like the Europass CV.
const BLUE = "#0e47cb";
const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.35 },
  kicker: { fontSize: 7, color: BLUE, letterSpacing: 1.5, textTransform: "uppercase" },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 2 },
  contact: { fontSize: 8.5, color: "#4b5563", marginTop: 4 },
  heading: { marginTop: 14, paddingBottom: 2, borderBottomWidth: 1.5, borderBottomColor: BLUE, color: BLUE, fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase" },
  entry: { marginTop: 7 },
  meta: { fontSize: 8.5, color: "#6b7280" },
  bold: { fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingVertical: 3 },
  cellLang: { width: "25%" },
  cell: { width: "15%", textAlign: "center" },
  small: { fontSize: 7.5, color: "#6b7280", marginTop: 3 },
});

function Heading({ children }: { children: string }) {
  return <Text style={s.heading}>{children}</Text>;
}

export function CvDocument({ cv }: { cv: Cv }) {
  const name = `${cv.firstName} ${cv.lastName}`.trim() || "Curriculum vitae";
  const contact = [
    cv.dateOfBirth && `Date of birth: ${cv.dateOfBirth.split("-").reverse().join("/")}`,
    cv.nationality && `Nationality: ${cv.nationality}`,
    cv.phone && `Phone: ${cv.phone}`,
    cv.email && `Email: ${cv.email}`,
    cv.website,
    cv.address && `Address: ${cv.address}`,
  ].filter(Boolean);
  const headings = [...new Set(cv.extras.map((x) => x.heading))];

  return (
    <Document title={`CV ${name}`} author={name} creator="Hapi">
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Curriculum vitae · Europass structure</Text>
        <Text style={s.name}>{name}</Text>
        {contact.length > 0 && <Text style={s.contact}>{contact.join("   ·   ")}</Text>}

        {cv.about ? (
          <>
            <Heading>About me</Heading>
            <Text style={s.entry}>{cv.about}</Text>
          </>
        ) : null}

        {cv.work.length > 0 && (
          <>
            <Heading>Work experience</Heading>
            {cv.work.map((w) => (
              <View key={w.id} style={s.entry} wrap={false}>
                <Text style={s.meta}>{[period(w.from, w.to, w.ongoing), [w.city, w.country].filter(Boolean).join(", ")].filter(Boolean).join("   ·   ")}</Text>
                <Text>
                  <Text style={s.bold}>{w.role}</Text>
                  {w.employer ? ` · ${w.employer}` : ""}
                </Text>
                {w.activities ? <Text>{w.activities}</Text> : null}
              </View>
            ))}
          </>
        )}

        {cv.education.length > 0 && (
          <>
            <Heading>Education and training</Heading>
            {cv.education.map((e) => (
              <View key={e.id} style={s.entry} wrap={false}>
                <Text style={s.meta}>{[period(e.from, e.to, e.ongoing), [e.city, e.country].filter(Boolean).join(", ")].filter(Boolean).join("   ·   ")}</Text>
                <Text>
                  <Text style={s.bold}>{e.title || "Qualification"}</Text>
                  {e.organisation ? ` · ${e.organisation}` : ""}
                </Text>
                {e.eqf ? <Text style={s.meta}>EQF level {e.eqf}</Text> : null}
                {e.subjects ? <Text>{e.subjects}</Text> : null}
              </View>
            ))}
          </>
        )}

        {(cv.motherTongues || cv.languages.length > 0) && (
          <>
            <Heading>Language skills</Heading>
            {cv.motherTongues ? (
              <Text style={s.entry}>
                Mother tongue(s): <Text style={s.bold}>{cv.motherTongues}</Text>
              </Text>
            ) : null}
            {cv.languages.length > 0 && (
              <View style={{ marginTop: 6 }} wrap={false}>
                <View style={[s.row, { borderBottomColor: "#d1d5db" }]}>
                  <Text style={[s.cellLang, s.meta]} />
                  <Text style={[s.cell, s.meta]}>Listening</Text>
                  <Text style={[s.cell, s.meta]}>Reading</Text>
                  <Text style={[s.cell, s.meta]}>Spoken production</Text>
                  <Text style={[s.cell, s.meta]}>Spoken interaction</Text>
                  <Text style={[s.cell, s.meta]}>Writing</Text>
                </View>
                {cv.languages.map((l, i) => (
                  <View key={i} style={s.row}>
                    <View style={s.cellLang}>
                      <Text style={s.bold}>{l.language}</Text>
                      {l.certificate ? <Text style={s.meta}>{l.certificate}</Text> : null}
                    </View>
                    <Text style={s.cell}>{l.listening}</Text>
                    <Text style={s.cell}>{l.reading}</Text>
                    <Text style={s.cell}>{l.production}</Text>
                    <Text style={s.cell}>{l.interaction}</Text>
                    <Text style={s.cell}>{l.writing}</Text>
                  </View>
                ))}
                <Text style={s.small}>Levels: A1 and A2: basic user · B1 and B2: independent user · C1 and C2: proficient user</Text>
              </View>
            )}
          </>
        )}

        {cv.digitalSkills ? (
          <>
            <Heading>Digital skills</Heading>
            <Text style={s.entry}>{cv.digitalSkills}</Text>
          </>
        ) : null}
        {cv.otherSkills ? (
          <>
            <Heading>Communication and organisational skills</Heading>
            <Text style={s.entry}>{cv.otherSkills}</Text>
          </>
        ) : null}
        {cv.drivingLicence ? (
          <>
            <Heading>Driving licence</Heading>
            <Text style={s.entry}>{cv.drivingLicence}</Text>
          </>
        ) : null}
        {headings.map((h) => (
          <View key={h}>
            <Heading>{h}</Heading>
            {cv.extras
              .filter((x) => x.heading === h)
              .map((x) => (
                <View key={x.id} style={s.entry} wrap={false}>
                  {x.date ? <Text style={s.meta}>{x.date}</Text> : null}
                  <Text style={s.bold}>{x.title}</Text>
                  {x.description ? <Text>{x.description}</Text> : null}
                </View>
              ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
