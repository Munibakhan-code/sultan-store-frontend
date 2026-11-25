import * as React from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/common/Button";

export function MessageInput({
  onSend,
  isSending,
  disabled,
}: {
  onSend: (body: string) => void;
  isSending?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = React.useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = value.trim();
    if (!body || disabled) return;
    onSend(body);
    setValue("");
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 border-t border-border bg-surface/80 p-3"
    >
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) submit(event);
        }}
        rows={1}
        disabled={disabled}
        placeholder={disabled ? "Conversation unavailable" : "Write a message…"}
        aria-label="Message"
        className="max-h-32 min-h-11 flex-1 resize-none rounded-md border border-input bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      />
      <Button type="submit" size="icon" isLoading={Boolean(isSending)} disabled={disabled || !value.trim()}>
        {isSending ? null : <SendHorizonal className="h-4 w-4" />}
      </Button>
    </form>
  );
}
