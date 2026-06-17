import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { SCREEN_MAP } from "@/lib/screen-registry";

export const Route = createFileRoute("/app/$screen")({
  component: ScreenPage,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="font-display text-[22px] text-foreground">Screen not found</p>
      <Link to="/app/$screen" params={{ screen: "home" }} className="mt-3 inline-block text-[13px] text-[var(--primary)] font-semibold">
        Go home
      </Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="py-20 text-center">
      <p className="font-display text-[20px] text-foreground">Couldn't render screen</p>
      <p className="mt-2 text-[12.5px] text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded-full bg-[var(--primary)] px-4 py-2 text-[12px] font-semibold text-white transition hover:opacity-90">
        Retry
      </button>
    </div>
  ),
  loader: ({ params }) => {
    const entry = SCREEN_MAP[params.screen];
    if (!entry) throw notFound();
    return { slug: entry.slug, label: entry.label };
  },
});

function ScreenPage() {
  const { screen } = Route.useParams();
  const entry = SCREEN_MAP[screen];
  if (!entry) return null;
  return <div className="w-full">{entry.render()}</div>;
}
