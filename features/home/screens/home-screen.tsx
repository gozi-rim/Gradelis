import { Hero } from "@/features/home/components/hero";
import { HighlightCard } from "@/features/home/components/highlight-card";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

const screenCards = [
  {
    title: "Feature-based architecture",
    description:
      "Screens, components, and logic are grouped by feature so the codebase scales cleanly as the project grows.",
    icon: "🧩",
  },
  {
    title: "Responsive by default",
    description:
      "Layouts are mobile-first and adapt progressively for tablets and desktops with clear spacing and typography hierarchy.",
    icon: "📱",
  },
  {
    title: "Maintainable UI foundations",
    description:
      "Shared primitives like containers and section headings reduce duplication and keep styling consistent across screens.",
    icon: "🛠️",
  },
] as const;

export function HomeScreen() {
  return (
    <>
      <Hero />

      <section id="screens" className="py-14 sm:py-16">
        <Container className="space-y-8">
          <SectionHeading
            title="Prepared frontend foundation"
            description="The project now has a production-friendly baseline ready for pixel-perfect implementation from your screenshots."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {screenCards.map((card) => (
              <HighlightCard
                key={card.title}
                title={card.title}
                description={card.description}
                icon={<span aria-hidden>{card.icon}</span>}
              />
            ))}
          </div>
        </Container>
      </section>

      <section id="next-steps" className="border-t border-slate-200 py-14 sm:py-16">
        <Container>
          <SectionHeading
            title="Next: Send screenshots"
            description="Once you share the first design screenshot, I’ll implement that exact screen with reusable components and route structure, then continue screen-by-screen."
          />
        </Container>
      </section>
    </>
  );
}
