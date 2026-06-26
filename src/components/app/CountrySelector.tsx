import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { COUNTRIES, useCountry } from "@/contexts/CountryContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const CountrySelector = ({ compact = false }: { compact?: boolean }) => {
  const { country, setCountry } = useCountry();
  const [open, setOpen] = useState(false);

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="text-xl hover:scale-110 transition-transform"
            aria-label="Country"
          >
            {country.flag}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-56 p-1 border-white/10"
          style={{ background: "var(--bg-elevated)" }}
        >
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => { setCountry(c); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 text-sm transition-colors"
            >
              <span className="text-lg">{c.flag}</span>
              <span
                className="flex-1 text-left"
                style={{ color: "var(--text-primary)" }}
              >
                {c.name}
              </span>
              {country.code === c.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-pill bg-card border border-white/10 hover:border-primary/40 transition-all text-sm"
        >
          <span className="text-lg leading-none">{country.flag}</span>
          <span
            className="flex-1 text-left font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {country.name}
          </span>
          <ChevronDown className="h-4 w-4 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[228px] p-1 border-white/10"
        style={{ background: "var(--bg-elevated)" }}
      >
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => { setCountry(c); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 text-sm transition-colors"
          >
            <span className="text-lg">{c.flag}</span>
            <span
              className="flex-1 text-left"
              style={{ color: "var(--text-primary)" }}
            >
              {c.name}
            </span>
            <span
              className="text-[10px] font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              {c.currency}
            </span>
            {country.code === c.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};