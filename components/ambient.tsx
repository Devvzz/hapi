// Background for every page: plain paper with a soft wash of blue at the top and warm light at the bottom.
export function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 print:hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(31,94,255,0.07),transparent_70%),radial-gradient(ellipse_50%_40%_at_100%_110%,rgba(255,107,61,0.06),transparent_70%)]" />
    </div>
  );
}
