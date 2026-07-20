"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, Check, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";
import { AvatarFallback, Avatar } from "@/components/ui/avatar";
import { executiveRoster } from "@/features/executives/mock";
import { industryOptions, stageOptions, type PitchFormValues } from "@/features/meeting-new/types";

export function PitchForm() {
  const router = useRouter();
  const [selectedExecs, setSelectedExecs] = useState<string[]>(executiveRoster.map((e) => e.id));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PitchFormValues>({
    defaultValues: { startupName: "", oneLiner: "", industry: "", stage: "", pitch: "" },
  });

  function toggleExec(id: string) {
    setSelectedExecs((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  async function onSubmit(values: PitchFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    const industryLabel =
      industryOptions.find((o) => o.value === values.industry)?.label ?? values.industry;
    const stageLabel =
      stageOptions.find((o) => o.value === values.stage)?.label ?? values.stage;

    try {
      // 1. Persist the pitch.
      const pitchRes = await fetch("/api/pitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startup_name: values.startupName,
          problem_statement: values.pitch,
          solution: values.oneLiner,
          target_audience: industryLabel,
          business_model: stageLabel,
          revenue_model: stageLabel,
        }),
      });
      if (!pitchRes.ok) throw new Error((await pitchRes.json()).error ?? "Failed to save pitch");
      const { pitch } = (await pitchRes.json()) as { pitch: { id: string } };

      // 2. Open a board meeting for it.
      const meetingRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitch_id: pitch.id }),
      });
      if (!meetingRes.ok) throw new Error((await meetingRes.json()).error ?? "Failed to start meeting");
      const { meeting } = (await meetingRes.json()) as { meeting: { id: string } };

      // 3. Kick off the AI board debate — deliberately NOT awaited. Gemini takes
      //    a while; the boardroom page polls the meeting and streams results in.
      void fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_id: meeting.id,
          startupName: values.startupName,
          industry: industryLabel,
          problem: values.pitch,
          solution: values.oneLiner,
          targetMarket: industryLabel,
          businessModel: stageLabel,
        }),
      });

      router.push(`/boardroom?meeting=${meeting.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card className="space-y-5 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="startupName">Startup name</Label>
          <Input id="startupName" placeholder="Loadbay" invalid={Boolean(errors.startupName)} {...register("startupName", { required: true })} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="oneLiner">One-liner</Label>
          <Input
            id="oneLiner"
            placeholder="Freight-matching marketplace for regional carriers"
            invalid={Boolean(errors.oneLiner)}
            {...register("oneLiner", { required: true })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Select id="industry" options={industryOptions} placeholder="Select an industry" {...register("industry", { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stage">Stage</Label>
            <Select id="stage" options={stageOptions} placeholder="Select a stage" {...register("stage", { required: true })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pitch">The pitch</Label>
          <Textarea
            id="pitch"
            rows={7}
            placeholder="Describe the problem, who has it, and how you solve it differently. Paste your one-pager if you have one."
            invalid={Boolean(errors.pitch)}
            {...register("pitch", { required: true })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-surface-elevated text-muted-foreground">
              <Upload className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Attach a deck (optional)</p>
              <p className="text-xs text-muted-foreground">PDF or PPTX, up to 20MB</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm">
            Browse
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle className="text-base">Who's seated</CardTitle>
            <CardDescription>{selectedExecs.length} of {executiveRoster.length} executives will evaluate this pitch.</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 space-y-2 p-0">
            {executiveRoster.map((exec) => {
              const isSelected = selectedExecs.includes(exec.id);
              return (
                <button
                  key={exec.id}
                  type="button"
                  onClick={() => toggleExec(exec.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    isSelected ? "border-primary/40 bg-primary/8" : "border-border hover:bg-surface-elevated",
                  )}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(exec.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{exec.name}</p>
                    <p className="text-xs text-muted-foreground">{exec.role}</p>
                  </div>
                  {isSelected && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting} disabled={selectedExecs.length === 0}>
          {!isSubmitting && (
            <>
              Convene the board
              <ArrowRight />
            </>
          )}
          {isSubmitting && "Convening the board…"}
        </Button>

        {submitError && (
          <p className="text-sm text-destructive" role="alert">
            {submitError}
          </p>
        )}
      </div>
    </form>
  );
}
