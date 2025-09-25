import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EngraveForm } from "../../components/EngraveForm";

describe("Engrave UI validation (T008)", () => {
  it("disables Save for invalid names and while pending; re-enables after ack", async () => {
    const onSubmit = jest.fn().mockImplementation(() => new Promise<void>((res) => setTimeout(res, 10)));
    await act(async () => {
        render(<EngraveForm runId="run-1" onSubmit={onSubmit} />);
    });

    const nameInput = screen.getByLabelText("engrave-name");
    const saveBtn = screen.getByLabelText("save-engrave") as HTMLButtonElement;
    
    // Initially invalid (empty)
    expect(saveBtn.disabled).toBe(true);

    // Too long (25 chars)
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "X".repeat(25) } });
    });
    expect(saveBtn.disabled).toBe(true);
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "PlayerOne" } });
    });
    expect(saveBtn.disabled).toBe(false);
    await act(async () => {
      fireEvent.click(saveBtn);
    });
    expect(onSubmit).toHaveBeenCalledWith("PlayerOne");
    expect(saveBtn.disabled).toBe(true);
    // Submit → pending disables
    fireEvent.click(saveBtn);
    expect(onSubmit).toHaveBeenCalledWith("PlayerOne");
    expect(saveBtn.disabled).toBe(true);

    // Wait for ack (onSubmit resolves) — jest fake timers not required due to short delay
    await new Promise((r) => setTimeout(r, 20));
    // After pending ends and value still valid, button re-enables
    expect(saveBtn.disabled).toBe(false);
  });
});
