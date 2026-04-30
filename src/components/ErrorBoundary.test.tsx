import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("@/lib/observability", () => ({
  captureException: vi.fn(),
}));

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("kaboom");
  return <div>safe content</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <div>child</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("renders fallback UI when child throws", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it("forwards captured error to observability layer", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { captureException } = await import("@/lib/observability");
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(captureException).toHaveBeenCalledTimes(1);
    const [err, ctx] = (captureException as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((err as Error).message).toBe("kaboom");
    expect(ctx).toHaveProperty("componentStack");
    errorSpy.mockRestore();
  });

  it("renders the custom fallback when provided", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<div>custom</div>}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText("custom")).toBeInTheDocument();
    expect(screen.queryByText("Algo deu errado")).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it("exposes 'Tentar novamente' and 'Recarregar' actions on the fallback UI", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /recarregar/i })).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
