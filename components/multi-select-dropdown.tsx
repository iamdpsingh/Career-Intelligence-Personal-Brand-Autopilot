"use client";

import { useState, useRef, useEffect } from "react";

export function MultiSelectDropdown({
  label,
  options,
  selectedOptions,
  toggleOption,
  colorClass = "bg-orange-500",
}: {
  label: string;
  options: string[];
  selectedOptions: string[];
  toggleOption: (opt: string) => void;
  colorClass?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'}`} ref={ref}>
      <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 block mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div 
        className="w-full md:w-64 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-inner cursor-pointer text-zinc-900 dark:text-white flex justify-between items-center transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedOptions.length === 0 
            ? "Any" 
            : `${selectedOptions.length} selected`}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full md:w-64 mt-2 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-zinc-500">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = selectedOptions.includes(opt);
              return (
                <div 
                  key={opt}
                  className="px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer flex items-center gap-3 transition-colors"
                  onClick={() => toggleOption(opt)}
                >
                  <div className={`w-4 h-4 flex shrink-0 items-center justify-center border rounded transition-colors ${isSelected ? `${colorClass} border-transparent text-white` : 'border-zinc-300 dark:border-zinc-600'}`}>
                    {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{opt}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
