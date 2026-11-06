import opportunitiesJson from "@/data/opportunities.json";
import programsJson from "@/data/programs.json";
import costsJson from "@/data/costs.json";
import type { CostItem, Opportunity, Program } from "./types";

export const opportunities = opportunitiesJson as Opportunity[];
export const programs = programsJson as unknown as Program[];
export const costs = costsJson as CostItem[];

export const FOCUS_COUNTRIES = ["Austria", "Germany", "Italy"];
