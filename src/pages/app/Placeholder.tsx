import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Placeholder({ title }: { title?: string }) {
  const { pathname } = useLocation();
  const t = title ?? pathname.split("/").pop()?.replace(/-/g, " ") ?? "Page";
  return (
    <div className="max-w-3xl mx-auto pt-16 text-center">
      <div className="h-20 w-20 mx-auto rounded-2xl bg-primary/10 grid place-items-center mb-5">
        <Construction className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold capitalize">{t}</h1>
      <p className="mt-2 text-secondary">This section is coming soon. Your CA-flow workspace will keep growing.</p>
    </div>
  );
}
