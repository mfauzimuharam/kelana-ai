import Markdown from "./Markdown";

interface Section {
  title: string;
  body: string;
}

/** Split the AI Markdown on "## " headings so each part can get its own card. */
function splitSections(markdown: string): { intro: string; sections: Section[] } {
  const parts = markdown.split(/^##\s+/m);
  const intro = parts.shift()?.trim() ?? "";
  const sections = parts.map((part) => {
    const [titleLine, ...rest] = part.split("\n");
    return { title: titleLine.replace(/[#*]/g, "").trim(), body: rest.join("\n").trim() };
  });
  return { intro, sections };
}

const SECTION_ICONS: [RegExp, string][] = [
  [/overview|summary/i, "🧭"],
  [/food|eat|culinary/i, "🍜"],
  [/transport/i, "🚆"],
  [/budget|cost/i, "💰"],
  [/tip/i, "💡"],
];

function iconFor(title: string) {
  return SECTION_ICONS.find(([pattern]) => pattern.test(title))?.[1] ?? "📌";
}

export default function Itinerary({ markdown }: { markdown: string }) {
  const { intro, sections } = splitSections(markdown);

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <Markdown>{markdown}</Markdown>
      </div>
    );
  }

  const days = sections.filter((s) => /^day\s*\d+/i.test(s.title));
  const overview = sections.filter((s) => /overview|summary/i.test(s.title));
  const extras = sections.filter((s) => !days.includes(s) && !overview.includes(s));

  return (
    <div className="space-y-6">
      {intro && <Markdown>{intro}</Markdown>}

      {overview.map((section) => (
        <div key={section.title} className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5">
          <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-teal-900">
            <span aria-hidden>{iconFor(section.title)}</span> {section.title}
          </h3>
          <Markdown>{section.body}</Markdown>
        </div>
      ))}

      {days.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Daily itinerary</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {days.map((day, index) => {
              const [label, ...theme] = day.title.split(":");
              return (
                <article key={`${day.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="rounded-md bg-teal-600 px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase">
                      {label.trim()}
                    </span>
                    {theme.length > 0 && <h4 className="font-semibold text-slate-900">{theme.join(":").trim()}</h4>}
                  </div>
                  <Markdown className="prose-sm">{day.body}</Markdown>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {extras.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {extras.map((section) => (
            <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
                <span aria-hidden>{iconFor(section.title)}</span> {section.title}
              </h3>
              <Markdown className="prose-sm">{section.body}</Markdown>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
