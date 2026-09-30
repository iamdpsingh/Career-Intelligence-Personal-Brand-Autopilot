"use client";

import { useTransition, useState } from "react";
import { updateProfile } from "./actions";
import { MultiSelectDropdown } from "@/components/multi-select-dropdown";

export function ProfileForm({ profile }: { profile: any }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      updateProfile(formData);
    });
  };

  const [targetRoles, setTargetRoles] = useState<string[]>(profile?.targetRoles || []);
  const [coreSkills, setCoreSkills] = useState<string[]>(profile?.coreSkills || []);
  const [experienceLevel, setExperienceLevel] = useState<string[]>(profile?.experienceLevel || []);
  const [locationFilter, setLocationFilter] = useState<string[]>(profile?.locationFilter || []);
  const [salaryFilter, setSalaryFilter] = useState<string[]>(profile?.salaryFilter || []);
  const [currency, setCurrency] = useState<string[]>(profile?.currency || []);

  const locationOptions = ["remote", "worldwide", "usa", "uk", "eu", "asia", "india"];
  const salaryOptions: string[] = [];
  if (currency.length === 0 || currency.some(c => ["USD", "EUR", "GBP", "CAD"].includes(c))) {
    salaryOptions.push("0-50k", "50k-100k", "100k-150k", "150k-200k", "200k+");
  }
  if (currency.includes("INR")) {
    salaryOptions.push("0-5L", "5L-15L", "15L-30L", "30L+");
  }
  const currencyOptions = ["USD", "EUR", "GBP", "INR", "CAD"];
  const experienceOptions = ["entry", "fresher", "junior", "mid", "senior", "staff"];

  const toggleArray = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const toggleTargetRole = (val: string) => toggleArray(setTargetRoles, val);
  const toggleCoreSkill = (val: string) => toggleArray(setCoreSkills, val);
  const toggleExperience = (val: string) => toggleArray(setExperienceLevel, val);
  const toggleLocation = (val: string) => toggleArray(setLocationFilter, val);
  const toggleSalary = (val: string) => toggleArray(setSalaryFilter, val);
  const toggleCurrency = (val: string) => toggleArray(setCurrency, val);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 block mb-2 uppercase tracking-wider">
          Target Roles
        </label>
        <input 
          type="text" 
          name="targetRoles" 
          value={targetRoles.join(", ")}
          onChange={(e) => setTargetRoles(e.target.value.split(",").map(v => v.trim()).filter(Boolean))}
          placeholder="e.g. Software Engineer, Frontend Developer"
          className="w-full px-4 py-3 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all hover:bg-zinc-200 dark:hover:bg-white/10"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 block mb-2 uppercase tracking-wider">
          Core Skills
        </label>
        <input 
          type="text" 
          name="coreSkills" 
          value={coreSkills.join(", ")}
          onChange={(e) => setCoreSkills(e.target.value.split(",").map(v => v.trim()).filter(Boolean))}
          placeholder="e.g. React, TypeScript, Node.js"
          className="w-full px-4 py-3 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all hover:bg-zinc-200 dark:hover:bg-white/10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <MultiSelectDropdown
            label="Experience Level"
            options={experienceOptions}
            selectedOptions={experienceLevel}
            toggleOption={toggleExperience}
            colorClass="bg-purple-500"
          />
          {experienceLevel.map(exp => <input key={exp} type="hidden" name="experienceLevel" value={exp} />)}
        </div>

        <div>
          <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 block mb-2 uppercase tracking-wider">
            Time Filter
          </label>
          <select 
            name="timeFilter" 
            defaultValue={profile?.timeFilter || ""}
            className="w-full md:w-64 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900 dark:text-white transition-all appearance-none cursor-pointer"
          >
            <option value="">Any time</option>
            <option value="1h">Past 1 hour</option>
            <option value="6h">Past 6 hours</option>
            <option value="12h">Past 12 hours</option>
            <option value="24h">Past 24 hours</option>
            <option value="3d">Past 3 days</option>
            <option value="1w">Past 1 week</option>
            <option value="2w">Past 2 weeks</option>
            <option value="1m">Past 1 month</option>
          </select>
        </div>

        <div>
          <MultiSelectDropdown
            label="Location"
            options={locationOptions}
            selectedOptions={locationFilter}
            toggleOption={toggleLocation}
            colorClass="bg-emerald-500"
          />
          {locationFilter.map(loc => <input key={loc} type="hidden" name="locationFilter" value={loc} />)}
        </div>

        <div>
          <MultiSelectDropdown
            label="Salary Range"
            options={salaryOptions}
            selectedOptions={salaryFilter}
            toggleOption={toggleSalary}
            colorClass="bg-blue-500"
          />
          {salaryFilter.map(sal => <input key={sal} type="hidden" name="salaryFilter" value={sal} />)}
        </div>

        <div>
          <MultiSelectDropdown
            label="Currency"
            options={currencyOptions}
            selectedOptions={currency}
            toggleOption={toggleCurrency}
            colorClass="bg-yellow-500"
          />
          {currency.map(cur => <input key={cur} type="hidden" name="currency" value={cur} />)}
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="px-6 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-500 disabled:opacity-50 transition-all shadow-lg shadow-orange-600/30"
      >
        {isPending ? "Saving..." : "Save Preferences"}
      </button>
    </form>
  );
}
