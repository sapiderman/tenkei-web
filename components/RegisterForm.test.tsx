// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";

// The real form hides the Turnstile widget when no site key is configured —
// provide one so the (mocked) widget mounts and mints a token.
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";

// i18n: t() returns the key — assertions match on key names.
vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "en" }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Turnstile: auto-solve on mount so the form's token guard passes.
vi.mock("@marsidev/react-turnstile", async () => {
  const { useEffect } = await import("react");
  return {
    Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => {
      useEffect(() => {
        onSuccess("mock-token-abcdefghijklmnopqrst");
      }, [onSuccess]);
      return null;
    },
  };
});

import RegisterForm from "./RegisterForm";

beforeEach(() => {
  return () => cleanup();
});

// jsdom blocks form submission while native `required` inputs are empty —
// fill them all before clicking submit.
async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^full_name/), "Test User");
  await user.type(screen.getByLabelText(/email_address/), "user@test.com");
  await user.type(screen.getByLabelText(/^password/), "hunter2hunter2");
  await user.type(screen.getByLabelText(/confirm_password/), "hunter2hunter2");
}

function submitButton() {
  return screen.getByRole("button", { name: "complete_registration" });
}

describe("RegisterForm category selector", () => {
  it("toggles the conditional fields per category", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    // Regular (default): no category-conditional fields.
    expect(screen.queryByLabelText(/^university/)).toBeNull();
    expect(screen.queryByLabelText(/^faculty/)).toBeNull();
    expect(screen.queryByLabelText(/^major/)).toBeNull();
    expect(screen.queryByLabelText(/^school_name/)).toBeNull();
    expect(screen.queryByLabelText(/^guardian_name/)).toBeNull();

    // Student: university group + still-in-school checkbox.
    await user.click(screen.getByRole("radio", { name: "category_student" }));
    expect(screen.getByLabelText(/^university/)).toBeVisible();
    expect(screen.getByLabelText(/^faculty/)).toBeVisible();
    expect(screen.getByLabelText(/^major/)).toBeVisible();
    expect(screen.getByLabelText(/student_still_in_school/)).toBeVisible();
    expect(screen.queryByLabelText(/^school_name/)).toBeNull();
    expect(screen.queryByLabelText(/^guardian_name/)).toBeNull();

    // Kids: guardian name only.
    await user.click(screen.getByRole("radio", { name: "category_kids" }));
    expect(screen.getByLabelText(/^guardian_name/)).toBeVisible();
    expect(screen.queryByLabelText(/^university/)).toBeNull();
    expect(screen.queryByLabelText(/^faculty/)).toBeNull();
    expect(screen.queryByLabelText(/^major/)).toBeNull();
    expect(screen.queryByLabelText(/^school_name/)).toBeNull();

    // Back to regular: everything hidden again.
    await user.click(screen.getByRole("radio", { name: "category_regular" }));
    expect(screen.queryByLabelText(/^university/)).toBeNull();
    expect(screen.queryByLabelText(/^guardian_name/)).toBeNull();
    expect(screen.queryByLabelText(/student_still_in_school/)).toBeNull();
  });

  it("the still-in-school checkbox swaps the university group for school name", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole("radio", { name: "category_student" }));
    await user.type(screen.getByLabelText(/^university/), "UI");

    await user.click(
      screen.getByRole("checkbox", { name: /student_still_in_school/ }),
    );
    expect(screen.getByLabelText(/^school_name/)).toBeVisible();
    expect(screen.queryByLabelText(/^university/)).toBeNull();
    expect(screen.queryByLabelText(/^faculty/)).toBeNull();
    expect(screen.queryByLabelText(/^major/)).toBeNull();

    await user.click(
      screen.getByRole("checkbox", { name: /student_still_in_school/ }),
    );
    expect(screen.getByLabelText(/^university/)).toBeVisible();
    expect(screen.queryByLabelText(/^school_name/)).toBeNull();
    // Swapped-out values do not linger.
    expect(screen.getByLabelText(/^university/)).toHaveValue("");
  });
});

describe("RegisterForm category validation", () => {
  it("student university path missing Department → inline error, nothing sent", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<RegisterForm />);

    await user.click(screen.getByRole("radio", { name: "category_student" }));
    await user.type(screen.getByLabelText(/^university/), "Universitas Indonesia");
    await user.type(screen.getByLabelText(/^major/), "Teknik Elektro");
    await fillRequired(user);
    await user.click(submitButton());

    expect(await screen.findByText("error_category_fields_student")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("kids without guardian name → inline error, nothing sent", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<RegisterForm />);

    await user.click(screen.getByRole("radio", { name: "category_kids" }));
    await fillRequired(user);
    await user.click(submitButton());

    expect(await screen.findByText("error_category_fields_kids")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("regular with no extras submits a clean payload", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<RegisterForm />);

    await fillRequired(user);
    await user.click(
      screen.getByRole("checkbox", { name: /consent_datastore_text/ }),
    );
    await user.click(submitButton());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [, init] = fetchMock.mock.calls[0] as unknown[];
    const body = JSON.parse((init as RequestInit).body as string) as {
      category: string;
      university: string;
      school_name: string;
      guardian_name: string;
      faculty: string;
      major: string;
    };
    expect(body.category).toBe("regular");
    expect(body.university).toBe("");
    expect(body.school_name).toBe("");
    expect(body.guardian_name).toBe("");
    expect(body.faculty).toBe("");
    expect(body.major).toBe("");
  });
});
