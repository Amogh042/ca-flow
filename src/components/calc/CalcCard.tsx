import { Link } from "react-router-dom";
import { ArrowRight, LucideIcon } from "lucide-react";

export type CalcMeta = {
  slug: string;
  name: string;
  desc: string;
  icon: LucideIcon;
};

export const CalcCard = ({ calc }: { calc: CalcMeta }) => {
  const Icon = calc.icon;
  return (
    <Link
      to={`/calculator/${calc.slug}`}
      className="card-surface p-5 group relative overflow-hidden flex flex-col"
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center group-hover:bg-gradient-orange transition-colors">
        <Icon className="h-5 w-5 text-primary group-hover:text-[var(--text-primary)]" />
      </div>
      <div className="mt-4 font-semibold text-sm">{calc.name}</div>
      <div className="mt-1 text-xs text-secondary line-clamp-2 flex-1">{calc.desc}</div>
      <div className="mt-4 flex items-center justify-end">
        <span className="text-xs font-medium text-primary opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-150 flex items-center gap-1">
          Open <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
};
