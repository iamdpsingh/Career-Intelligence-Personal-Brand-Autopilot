"use client";

import { useState, useMemo, useEffect } from "react";
import { JobActionButton } from "@/components/job-action-button";
import { MultiSelectDropdown } from "@/components/multi-select-dropdown";

export function JobsClient({ jobs, profile }: { jobs: any[], profile?: any }) {
  const [timeFilter, setTimeFilter] = useState(profile?.timeFilter || "");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(profile?.targetRoles || []);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(profile?.locationFilter || []);
  const [selectedSalaries, setSelectedSalaries] = useState<string[]>(profile?.salaryFilter || []);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(profile?.currency || []);
  const [selectedExperience, setSelectedExperience] = useState<string[]>(profile?.experienceLevel || []);

  const rolesOptions = Array.from(new Set([...(profile?.targetRoles || []), ...jobs.map((j: any) => j.jobTitle)])).filter(Boolean);
  const locationOptions = ["remote", "worldwide", "usa", "uk", "eu", "asia", "india"];
  const salaryOptions = ["0-50k", "50k-100k", "100k-150k", "150k-200k", "200k+"];
  const currencyOptions = ["USD", "EUR", "GBP", "INR", "CAD"];
  const experienceOptions = ["entry", "fresher", "junior", "mid", "senior", "staff"];

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  };

  const toggleSalary = (sal: string) => {
    setSelectedSalaries(prev => prev.includes(sal) ? prev.filter(s => s !== sal) : [...prev, sal]);
  };

  const toggleCurrency = (cur: string) => {
    setSelectedCurrencies(prev => prev.includes(cur) ? prev.filter(c => c !== cur) : [...prev, cur]);
  };

  const toggleExperience = (exp: string) => {
    setSelectedExperience(prev => prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]);
  };

  useEffect(() => {
    if (profile) {
      setTimeFilter(profile.timeFilter || "");
      setSelectedRoles(profile.targetRoles || []);
      setSelectedLocations(profile.locationFilter || []);
      setSelectedSalaries(profile.salaryFilter || []);
      setSelectedCurrencies(profile.currency || []);
      setSelectedExperience(profile.experienceLevel || []);
    }
  }, [profile]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Time Filter
      if (timeFilter) {
        const jobTime = new Date(job.createdAt).getTime();
        const diff = Date.now() - jobTime;
        const limits: Record<string, number> = {
          "1h": 3600000,
          "6h": 21600000,
          "12h": 43200000,
          "24h": 86400000,
          "3d": 259200000,
          "1w": 604800000,
          "2w": 1209600000,
          "1m": 2592000000,
        };
        if (limits[timeFilter] && diff > limits[timeFilter]) return false;
      }
      
      // Role Filter
      if (selectedRoles.length > 0 && !selectedRoles.includes(job.jobTitle)) return false;

      // Location Filter
      if (selectedLocations.length > 0 && !selectedLocations.includes(job.location)) return false;

      // Salary Filter
      if (selectedSalaries.length > 0 && !selectedSalaries.includes(job.salary)) return false;

      // Currency Filter
      if (selectedCurrencies.length > 0) {
        if (!job.salary || job.salary === "UNKNOWN") return false;
        // Simple heuristic: check if salary string contains the currency symbol/code
        const matchesCurrency = selectedCurrencies.some(cur => {
          const c = cur.toUpperCase();
          if (c === "USD") return job.salary.includes("$") || job.salary.toUpperCase().includes("USD");
          if (c === "EUR") return job.salary.includes("€") || job.salary.toUpperCase().includes("EUR");
          if (c === "GBP") return job.salary.includes("£") || job.salary.toUpperCase().includes("GBP");
          if (c === "INR") return job.salary.includes("₹") || job.salary.toUpperCase().includes("INR");
          return job.salary.toUpperCase().includes(c);
        });
        if (!matchesCurrency) return false;
      }

      // Experience Filter
      if (selectedExperience.length > 0) {
        // Since we don't have an explicit experience column, we check the job title
        const titleLower = job.jobTitle.toLowerCase();
        const matchesExp = selectedExperience.some(exp => {
          const e = exp.toLowerCase();
          if (e === "entry" || e === "fresher") return titleLower.includes("entry") || titleLower.includes("junior") || titleLower.includes("grad");
          if (e === "junior") return titleLower.includes("junior") || titleLower.includes("jr");
          if (e === "senior") return titleLower.includes("senior") || titleLower.includes("sr") || titleLower.includes("lead");
          if (e === "staff") return titleLower.includes("staff") || titleLower.includes("principal");
          if (e === "mid") return !titleLower.includes("senior") && !titleLower.includes("junior") && !titleLower.includes("lead") && !titleLower.includes("staff");
          return titleLower.includes(e);
        });
        if (!matchesExp) return false;
      }

      return true;
    }).sort((a, b) => {
      // Push visited to bottom
      if (a.visited && !b.visited) return 1;
      if (!a.visited && b.visited) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [jobs, timeFilter, selectedRoles, selectedLocations, selectedSalaries, selectedCurrencies, selectedExperience]);

  if (jobs.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-12 text-center rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No jobs found yet</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
          The Job Intelligence Engine hasn&apos;t discovered any matching positions.
          Set up your profile and run a scan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-6 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-lg flex flex-wrap gap-6 items-end">
        
        {/* Time Filter */}
        <div className="w-full md:w-auto">
          <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 block mb-2 uppercase tracking-wider">
            Time Filter
          </label>
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900 dark:text-white transition-all appearance-none"
          >
            <option value="">All Time</option>
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

        {/* Roles Filter */}
        {rolesOptions.length > 0 && (
          <div className="w-full md:w-auto">
            <MultiSelectDropdown
              label="Roles"
              options={rolesOptions}
              selectedOptions={selectedRoles}
              toggleOption={toggleRole}
              colorClass="bg-orange-500"
            />
          </div>
        )}

        {/* Experience Filter */}
        <div className="w-full md:w-auto">
          <MultiSelectDropdown
            label="Experience Level"
            options={experienceOptions}
            selectedOptions={selectedExperience}
            toggleOption={toggleExperience}
            colorClass="bg-purple-500"
          />
        </div>

        {/* Locations Filter */}
        <div className="w-full md:w-auto">
          <MultiSelectDropdown
            label="Location"
            options={locationOptions}
            selectedOptions={selectedLocations}
            toggleOption={toggleLocation}
            colorClass="bg-emerald-500"
          />
        </div>

        {/* Currency Filter */}
        <div className="w-full md:w-auto">
          <MultiSelectDropdown
            label="Currency"
            options={currencyOptions}
            selectedOptions={selectedCurrencies}
            toggleOption={toggleCurrency}
            colorClass="bg-yellow-500"
          />
        </div>

        {/* Salaries Filter */}
        <div className="w-full md:w-auto">
          {(() => {
            let sOptions: string[] = [];
            if (selectedCurrencies.length === 0 || selectedCurrencies.some(c => ["USD", "EUR", "GBP", "CAD"].includes(c))) {
              sOptions.push("0-50k", "50k-100k", "100k-150k", "150k-200k", "200k+");
            }
            if (selectedCurrencies.includes("INR")) {
              sOptions.push("0-5L", "5L-15L", "15L-30L", "30L+");
            }
            return (
              <MultiSelectDropdown
                label="Salary Range"
                options={sOptions}
                selectedOptions={selectedSalaries}
                toggleOption={toggleSalary}
                colorClass="bg-blue-500"
              />
            );
          })()}
        </div>

      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 font-medium bg-white/40 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10">
          No jobs match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl p-6 md:p-8 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg md:text-xl">{job.jobTitle}</h3>
                  <p className="text-orange-600 dark:text-orange-400 font-semibold mt-1">{job.company}</p>
                </div>
                {job.remoteType && (
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm shrink-0 ${
                      job.remoteType === "REMOTE"
                        ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30"
                        : "bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/20"
                    }`}
                  >
                    {job.remoteType}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-6 font-medium">
                {job.location && <span className="flex items-center gap-2">📍 {job.location}</span>}
                {job.salary && job.salary !== "UNKNOWN" && (
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">💰 {job.salary}</span>
                )}
              </div>

              {/* Skills Tags */}
              {job.skills && (job.skills as string[]).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                  {(job.skills as string[]).map((skill: string) => (
                    <span
                      key={skill}
                      className="bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm dark:shadow-inner"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                {job.jobUrl && (
                  <JobActionButton jobId={job.id} jobUrl={job.jobUrl} />
                )}
                {job.visited && (
                  <span className="text-xs font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1.5 rounded-full shadow-inner border border-zinc-300 dark:border-zinc-700 flex items-center gap-1.5">
                    ✓ Visited
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
