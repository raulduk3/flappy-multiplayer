import React, { useState } from "react";

export interface EngraveFormProps {
  runId: string;
  onSubmit: (name: string) => Promise<void> | void;
}

export const EngraveForm: React.FC<EngraveFormProps> = ({ runId, onSubmit }) => {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  const isValid = name.length >= 1 && name.length <= 24;
  const disabled = !isValid || pending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setPending(true);
    try {
      await onSubmit(name);
      // caller should handle transition; keep simple here
    } finally {
      setPending(false);
    }
  }

  return (
    <form aria-label="engrave-form" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="engrave-name">Name</label>
        <input
          id="engrave-name"
          aria-label="engrave-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button aria-label="save-engrave" disabled={disabled} type="submit">
        Save
      </button>
      <input type="hidden" value={runId} readOnly />
    </form>
  );
};
