"use server";

import { db } from "@/providers/db";
import { profiles, users } from "@/providers/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const targetRoles = formData.get("targetRoles")?.toString().split(",").map(r => r.trim()).filter(Boolean) || [];
  const coreSkills = formData.get("coreSkills")?.toString().split(",").map(s => s.trim()).filter(Boolean) || [];
  const timeFilter = formData.get("timeFilter")?.toString() || null;
  const locationFilter = formData.getAll("locationFilter").map(s => s.toString().trim()).filter(Boolean);
  const salaryFilter = formData.getAll("salaryFilter").map(s => s.toString().trim()).filter(Boolean);
  const experienceLevel = formData.getAll("experienceLevel").map(s => s.toString().trim()).filter(Boolean);
  const currency = formData.getAll("currency").map(s => s.toString().trim()).filter(Boolean);
  
  // V1 single-user logic
  let user = await db.query.users.findFirst();
  if (!user) {
    // create a mock user for now
    [user] = await db.insert(users).values({
      email: "localuser@example.com",
      name: "Local User"
    }).returning();
  }

  let existingProfile;
  try {
    existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id)
    });
  } catch (error: any) {
    // If the database has corrupted JSON data from an older schema version
    if (error instanceof SyntaxError) {
      console.warn("Corrupted profile data found. Resetting profile for user", user.id);
      await db.delete(profiles).where(eq(profiles.userId, user.id));
      existingProfile = undefined;
    } else {
      throw error;
    }
  }

  if (existingProfile) {
    await db.update(profiles)
      .set({
        targetRoles,
        coreSkills,
        timeFilter,
        locationFilter,
        salaryFilter,
        experienceLevel,
        currency,
        updatedAt: new Date()
      })
      .where(eq(profiles.userId, user.id));
  } else {
    await db.insert(profiles).values({
      userId: user.id,
      targetRoles,
      coreSkills,
      timeFilter,
      locationFilter,
      salaryFilter,
      experienceLevel,
      currency
    });
  }

  revalidatePath("/settings");
  revalidatePath("/jobs");
}
