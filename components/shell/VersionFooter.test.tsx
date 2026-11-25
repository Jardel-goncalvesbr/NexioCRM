import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

const state = vi.hoisted(() => ({
  data: {
    current_version: "1.2.0",
    latest_version: "v1.3.0",
    is_owner: true,
    update_available: true,
    identity: undefined as { status: string } | undefined,
  },
}));
vi.mock("@/hooks/system/useSystemVersion", () => ({ useSystemVersion: () => state }));
vi.mock("@/hooks/i18n/useT", () => ({ useT: () => (value: string) => value }));
import { VersionFooter } from "./VersionFooter";

afterEach(() => { cleanup(); state.data.update_available = true; state.data.identity = undefined; });
describe("installed version remains visible beside the update notice", () => {
  it("shows the reported installed version and the newer release separately", () => {
    render(<VersionFooter collapsed={false} />);
    expect(screen.getByText(/1\.2\.0/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /1\.3\.0/ })).toBeTruthy();
  });

  it("still shows the installed version when no update is offered", () => {
    state.data.update_available = false;
    render(<VersionFooter collapsed={false} />);
    expect(screen.getByText(/1\.2\.0/)).toBeTruthy();
  });

  it("does not flag an unconfirmed run on an install without the host agent (legacy)", () => {
    state.data.identity = { status: "legacy" };
    render(<VersionFooter collapsed={false} />);
    expect(screen.queryByText("Execução não confirmada")).toBeNull();
  });

  it("still flags an unconfirmed run when the host agent reported a partial snapshot", () => {
    state.data.identity = { status: "partial" };
    render(<VersionFooter collapsed={false} />);
    expect(screen.getByText("Execução não confirmada")).toBeTruthy();
  });
});
