import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessagesSquare, Sparkles } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { notify } from "@/components/common/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useCreateCustomDemand, useCustomDemands } from "@/hooks/useCustomDemands";
import { getApiErrorMessage } from "@/services/apiClient";
import {
  DEMAND_STATUS_CLASSES,
  DEMAND_STATUS_LABELS,
  type CreateCustomDemandPayload,
  type CustomDemand,
} from "@/types/demand";
import { formatOrderDate } from "@/types/order";
import { formatPrice } from "@/types/store";

export const Route = createFileRoute("/custom-demand")({
  head: () => ({
    meta: [
      { title: "Custom Demand — Sultan Official PUBG Store" },
      {
        name: "description",
        content:
          "Request a custom PUBG Mobile account built to your exact requirements — skins, rank, level and budget.",
      },
      { property: "og:title", content: "Custom Demand — Sultan Official PUBG Store" },
      {
        property: "og:description",
        content: "Tell us the PUBG account you want and we will source it for you.",
      },
    ],
  }),
  component: CustomDemandPage,
});

function CustomDemandPage() {
  const { isAuthenticated } = useAuth();

  return (
    <MainLayout showCustomDemand={false}>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-center font-display text-3xl font-bold uppercase text-foreground">
          Custom <span className="text-gradient-gold">Demand</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          Want a specific set of skins, a certain rank, or a maxed account within a budget? Send your
          requirements and our team will source it and open a private chat with you.
        </p>

        <div className="mt-10">
          {isAuthenticated ? (
            <DemandForm />
          ) : (
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="Sign in to submit a demand"
              description="Custom demands are tied to your account so our team can chat with you privately."
              action={
                <Link to="/login">
                  <Button size="sm">Sign in</Button>
                </Link>
              }
            />
          )}
        </div>

        {isAuthenticated ? <MyDemands /> : null}
      </div>
    </MainLayout>
  );
}

function DemandForm() {
  const create = useCreateCustomDemand();
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    requirements: "",
    desiredRank: "",
    desiredLevel: "",
    desiredSkins: "",
    budget: "",
    additionalNotes: "",
  });

  function update(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (form.requirements.trim().length < 10) {
      setError("Describe your account requirements in at least 10 characters.");
      return;
    }

    const payload: CreateCustomDemandPayload = {
      requirements: form.requirements.trim(),
      ...(form.desiredRank.trim() ? { desiredRank: form.desiredRank.trim() } : {}),
      ...(form.desiredLevel.trim() ? { desiredLevel: Number(form.desiredLevel) } : {}),
      ...(form.desiredSkins.trim() ? { desiredSkins: form.desiredSkins.trim() } : {}),
      ...(form.budget.trim() ? { budget: Number(form.budget) } : {}),
      ...(form.additionalNotes.trim() ? { additionalNotes: form.additionalNotes.trim() } : {}),
    };

    create.mutate(payload, {
      onSuccess: () => {
        notify.success("Demand submitted", "Our team will review it and contact you in chat.");
        setForm({
          requirements: "",
          desiredRank: "",
          desiredLevel: "",
          desiredSkins: "",
          budget: "",
          additionalNotes: "",
        });
      },
      onError: (err) => setError(getApiErrorMessage(err, "Could not submit your demand.")),
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-xl border border-border bg-gradient-surface p-6"
    >
      <TextArea
        id="requirements"
        label="Account requirements"
        value={form.requirements}
        onChange={update("requirements")}
        placeholder="E.g. Conqueror account with Glacier M416 and Mythic fashion set."
        rows={4}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Desired rank"
          value={form.desiredRank}
          onChange={update("desiredRank")}
          placeholder="Conqueror"
        />
        <Input
          label="Desired level"
          type="number"
          min={1}
          value={form.desiredLevel}
          onChange={update("desiredLevel")}
          placeholder="70"
        />
      </div>

      <TextArea
        id="desiredSkins"
        label="Desired skins / features"
        value={form.desiredSkins}
        onChange={update("desiredSkins")}
        placeholder="Glacier M416, Pharaoh X-Suit, Mythic outfits…"
        rows={3}
      />

      <Input
        label="Budget (PKR)"
        type="number"
        min={0}
        value={form.budget}
        onChange={update("budget")}
        placeholder="25000"
        hint="Approximate budget helps us match faster."
      />

      <TextArea
        id="additionalNotes"
        label="Additional requirements"
        value={form.additionalNotes}
        onChange={update("additionalNotes")}
        placeholder="Anything else we should know?"
        rows={3}
      />

      <ErrorMessage message={error} />

      <Button type="submit" isLoading={create.isPending} full>
        <Sparkles className="h-4 w-4" /> Submit custom demand
      </Button>
    </form>
  );
}

function TextArea({
  id,
  label,
  rows = 3,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label: string }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className="w-full resize-y rounded-md border border-input bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
        {...props}
      />
    </div>
  );
}

function MyDemands() {
  const { data: demands, isLoading, isError, error } = useCustomDemands();

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-bold uppercase text-foreground">My demands</h2>
      <div className="mt-4 space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : isError ? (
          <ErrorMessage message={getApiErrorMessage(error, "Could not load your demands.")} />
        ) : demands && demands.length > 0 ? (
          demands.map((demand) => <DemandCard key={demand.id} demand={demand} />)
        ) : (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t submitted a custom demand yet.
          </p>
        )}
      </div>
    </section>
  );
}

function DemandCard({ demand }: { demand: CustomDemand }) {
  return (
    <article className="rounded-xl border border-border bg-gradient-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground">{demand.requirements}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {[
              demand.desiredRank ? `Rank: ${demand.desiredRank}` : null,
              demand.desiredLevel ? `Level: ${demand.desiredLevel}` : null,
              demand.budget ? `Budget: ${formatPrice(demand.budget)}` : null,
              demand.createdAt ? formatOrderDate(demand.createdAt) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {demand.desiredSkins ? (
            <p className="mt-1 text-xs text-muted-foreground">Skins: {demand.desiredSkins}</p>
          ) : null}
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${DEMAND_STATUS_CLASSES[demand.status]}`}
        >
          {DEMAND_STATUS_LABELS[demand.status]}
        </span>
      </div>

      {demand.conversationId ? (
        <Link
          to="/messages/$conversationId"
          params={{ conversationId: demand.conversationId }}
          className="mt-4 inline-block"
        >
          <Button size="sm" variant="outline">
            <MessagesSquare className="h-4 w-4" /> Open conversation
          </Button>
        </Link>
      ) : null}
    </article>
  );
}
