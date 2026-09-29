import { z } from "zod";
import { AICostController } from "../ai/provider";
import { db } from "@/providers/db";
import { contentCandidates, contentDrafts, githubEvidence } from "@/providers/db/schema";
import { eq } from "drizzle-orm";

// ----------------------------------------------------------------------
// AI CONTENT LAB (Rule 18 & 19)
// ----------------------------------------------------------------------
// This module converts raw evidence into highly technical, LinkedIn-ready
// content. 
//
// CRITICAL RULE (Rule 18): We NEVER use one giant prompt. The generation
// must happen in discrete stages to ensure factual accuracy and prevent
// the AI from adopting a generic "LinkedIn Bro" voice.
// ----------------------------------------------------------------------

const StoryAngleSchema = z.object({
  hook: z.string().describe("A technical, non-clickbaity opening line."),
  coreMessage: z.string().describe("The primary technical takeaway or lesson."),
  structure: z.array(z.string()).describe("Bullet points outlining the flow of the post."),
});

const DraftReviewSchema = z.object({
  isFactual: z.boolean().describe("Does the draft strictly adhere to the provided evidence without inventing details?"),
  hallucinationsFound: z.array(z.string()).describe("List of any fabricated claims found, or empty if none."),
  brandVoiceCompliant: z.boolean().describe("Is the tone technical, humble, and professional? (No emojis, no hype)."),
  suggestedRevisions: z.string().describe("Specific instructions for fixing tone or facts if needed."),
});

export class ContentGenerator {
  private ai: AICostController;

  constructor(ai: AICostController) {
    this.ai = ai;
  }

  /**
   * Transforms a Content Candidate into a Draft through a multi-stage pipeline.
   * Only processes candidates that have an explicitly linked Evidence record.
   */
  async generateFromCandidate(candidateId: string, userId: string) {
    console.log(`[Content Lab] Starting generation pipeline for candidate ${candidateId}...`);

    // 1. Fetch Candidate and its strictly linked Evidence (Rule 06: Truth Engine)
    const candidate = await db.query.contentCandidates.findFirst({
      where: eq(contentCandidates.id, candidateId)
    });

    if (!candidate || candidate.status !== "IDEA") {
      throw new Error(`Candidate ${candidateId} is not in IDEA state or does not exist.`);
    }

    if (candidate.sourceType !== "github" || !candidate.sourceId) {
      throw new Error(`Currently only GitHub evidence generation is implemented (V1).`);
    }

    const evidence = await db.query.githubEvidence.findFirst({
      where: eq(githubEvidence.id, candidate.sourceId)
    });

    if (!evidence) {
      // TRUTH ENGINE FAIL-SAFE: Cannot generate without evidence.
      throw new Error(`No evidence found for candidate ${candidateId}. Aborting generation.`);
    }

    // ------------------------------------------------------------------
    // STAGE 1: STORY ANGLE (Rule 19: Post Structure)
    // ------------------------------------------------------------------
    console.log(`[Content Lab] Stage 1: Determining Story Angle...`);
    const anglePrompt = `
      You are a Senior Data/Software Engineer.
      Review the following verified technical evidence:
      Claim: ${evidence.claim}
      Files Changed: ${(evidence.fileReferences as string[] || []).join(", ")}
      
      Determine the best angle for a technical post. Avoid generic hype.
      Focus on Problem -> Solution or Technical Lessons learned.
    `;
    const angle = await this.ai.routeStructured('complex', anglePrompt, StoryAngleSchema);

    // ------------------------------------------------------------------
    // STAGE 2: DRAFTING
    // ------------------------------------------------------------------
    console.log(`[Content Lab] Stage 2: Drafting...`);
    const draftPrompt = `
      Write a short, highly technical LinkedIn post based strictly on this evidence:
      Claim: ${evidence.claim}
      Files: ${(evidence.fileReferences as string[] || []).join(", ")}
      
      Follow this structure:
      Hook: ${angle.hook}
      Message: ${angle.coreMessage}
      Flow: ${angle.structure.join(" -> ")}
      
      Rules:
      - DO NOT invent production metrics (e.g., "improved speed by 50%") unless in the evidence.
      - DO NOT invent personal feelings (e.g., "I'm thrilled to announce").
      - Keep sentences short. Use technical terminology accurately.
    `;
    // Text-only generation doesn't need Zod, but requires a complex model for good prose.
    let draftText = await this.ai.routeStructured('complex', draftPrompt, z.object({ post: z.string() })).then(res => res.post);

    // ------------------------------------------------------------------
    // STAGE 3: FACT CHECK & BRAND VOICE REVIEW (Rule 18)
    // ------------------------------------------------------------------
    console.log(`[Content Lab] Stage 3: Automated Review...`);
    const reviewPrompt = `
      Review the following draft against the original evidence.
      
      Evidence Claim: ${evidence.claim}
      Draft: ${draftText}
      
      Does the draft invent any facts? Is it overly promotional?
    `;
    const review = await this.ai.routeStructured('complex', reviewPrompt, DraftReviewSchema);

    // ------------------------------------------------------------------
    // STAGE 4: REVISION (If needed)
    // ------------------------------------------------------------------
    if (!review.isFactual || !review.brandVoiceCompliant) {
      console.warn(`[Content Lab] Draft failed internal review. Hallucinations: ${review.hallucinationsFound.join(", ")}`);
      console.log(`[Content Lab] Stage 4: Revising Draft...`);
      
      const revisionPrompt = `
        Revise this draft based on the following feedback:
        ${review.suggestedRevisions}
        
        Original Draft: ${draftText}
        Ensure no facts are invented.
      `;
      draftText = await this.ai.routeStructured('complex', revisionPrompt, z.object({ post: z.string() })).then(res => res.post);
    }

    // ------------------------------------------------------------------
    // FINAL STAGE: SAVE TO DATABASE (Awaiting Human Review)
    // ------------------------------------------------------------------
    console.log(`[Content Lab] Draft finalized. Saving for human review...`);
    
    // Save the Draft
    await db.insert(contentDrafts).values({
      candidateId: candidate.id,
      content: draftText,
      status: "HUMAN_REVIEW", // Rule 61: Explicit state machine transition
    });

    // Update the Candidate state
    await db.update(contentCandidates)
      .set({ status: "DRAFTED" })
      .where(eq(contentCandidates.id, candidate.id));

    return draftText;
  }
}
