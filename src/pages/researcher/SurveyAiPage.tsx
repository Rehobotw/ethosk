import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { SurveyRecord } from "@shared/types";
import {
  Button,
  Card,
  Icon,
  LoadingBlock,
  Notice,
  SectionHeading,
} from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";

/**
 * §4.3 AI Survey Generator — dedicated page.
 *
 * The researcher describes their research goal in a text area and the server
 * generates a draft survey via Claude. On success, the generated survey is
 * saved as a WIP and the user is taken to the builder to refine it.
 */
export function SurveyAiPage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(8);

  const generate = useMutation({
    mutationFn: async () => {
      // Step 1: Create a blank WIP survey
      const survey = await api<SurveyRecord>("/surveys", {
        body: {
          title: "AI-Generated Survey",
          description: goal.trim(),
          questions: [],
          reward_etb: 25,
          status: "wip",
        },
      });

      // Step 2: Use the AI chat endpoint to generate questions
      const aiResponse = await api<{ reply: string }>(`/surveys/${survey.id}/chat`, {
        body: {
          messages: [
            {
              role: "user",
              content: `Generate exactly ${questionCount} survey questions for the following research goal. Return ONLY a valid JSON array of question objects, where each object has: "text" (string), "type" ("single_choice" | "multi_choice" | "text"), "options" (string array for choice types, omit for text), "required" (boolean, default true). Research goal: ${goal.trim()}`,
            },
          ],
        },
      });

      // Step 3: Try to parse AI response and update the survey
      let questions;
      try {
        // Extract JSON from the AI response
        const jsonMatch = aiResponse.reply.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]).map((q: any, i: number) => ({
            ...q,
            id: `ai_q${i + 1}_${Date.now().toString(36)}`,
            required: q.required ?? true,
          }));
        }
      } catch {
        // If parsing fails, navigate to builder anyway
      }

      if (questions && questions.length > 0) {
        await api(`/surveys/${survey.id}`, {
          method: "PATCH",
          body: {
            title: `AI Draft: ${goal.trim().slice(0, 60)}`,
            questions,
            status: "wip",
          },
        });
      }

      return survey;
    },
    onSuccess: (survey) => {
      navigate(`/researcher/surveys/${survey.id}/edit`, { replace: true });
    },
  });

  return (
    <div className="space-y-stack-lg max-w-2xl mx-auto">
      <Link
        to="/researcher/surveys/new"
        className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline mb-2"
      >
        <Icon className="text-[16px]" name="arrow_back" />
        Back to Survey Creation
      </Link>

      <SectionHeading
        subtitle="Describe your research objective and our AI will draft the questions for you."
        title="AI Survey Generator"
      />

      <Card className="p-6 md:p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (goal.trim().length >= 10) generate.mutate();
          }}
          className="flex flex-col gap-6"
        >
          {/* Research Goal */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-on-surface" htmlFor="ai-goal">
              Research Goal
            </label>
            <textarea
              id="ai-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Example: I want to understand how small business owners in Addis Ababa use digital payment platforms like Telebirr and CBE Birr for their daily transactions, and what barriers prevent wider adoption."
              className="w-full p-4 rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white text-sm text-on-surface outline-none transition-all resize-none min-h-[140px]"
              rows={5}
            />
            <p className="text-xs text-on-surface-variant">
              Be specific about your target audience, research topic, and what insights you need. Minimum 10 characters.
            </p>
          </div>

          {/* Question Count */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-on-surface" htmlFor="ai-count">
              Number of Questions
            </label>
            <div className="flex items-center gap-3">
              <input
                id="ai-count"
                type="range"
                min={3}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm font-bold text-primary w-8 text-center">
                {questionCount}
              </span>
            </div>
          </div>

          {/* AI Preview Hint */}
          <div className="p-4 rounded-xl bg-[#f3e5f5]/50 border border-[#6a1b9a]/10">
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-[24px] text-[#6a1b9a] shrink-0 mt-0.5"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <div className="text-sm text-on-surface-variant">
                <p className="font-semibold text-[#6a1b9a] mb-1">How it works</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>AI reads your research goal and generates a mix of single-choice, multi-choice, and open-ended questions.</li>
                  <li>A draft survey is created in the builder so you can review and edit every question.</li>
                  <li>You have full control to add, remove, or reorder questions before submitting for review.</li>
                </ol>
              </div>
            </div>
          </div>

          {generate.error && (
            <Notice tone="error">
              {generate.error instanceof ApiRequestError
                ? generate.error.message
                : "Failed to generate survey. Please try again."}
            </Notice>
          )}

          <Button
            icon="auto_awesome"
            disabled={goal.trim().length < 10 || generate.isPending}
            type="submit"
          >
            {generate.isPending ? "Generating Your Survey…" : "Generate Survey Draft"}
          </Button>

          {generate.isPending && (
            <LoadingBlock label="AI is crafting your questions — this may take 10–20 seconds…" />
          )}
        </form>
      </Card>
    </div>
  );
}
