import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RegisterPage from "./page";

// Mock the Turnstile component because we can't load Cloudflare in a test environment
jest.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => (
    <div data-testid="turnstile-mock">
      <button type="button" onClick={() => onSuccess("mock-token-123")}>
        I am Human
      </button>
    </div>
  ),
}));

// Mock the global fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }),
) as jest.Mock;

describe("RegisterPage Client Logic", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("validates required fields locally before submitting", async () => {
    render(<RegisterPage />);

    // Try to submit empty form
    const submitBtn = screen.getByText(/Complete Registration/i);
    fireEvent.click(submitBtn);

    // Expect validation error
    expect(
      await screen.findByText(/Full name is required/i),
    ).toBeInTheDocument();

    // API should NOT have been called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits correctly when form and security check are complete", async () => {
    render(<RegisterPage />);

    // 1. Fill out the form
    fireEvent.change(screen.getByPlaceholderText(/Your full name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/812 3456/i), {
      target: { value: "08123456789" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: "password123" },
    }); // Password

    // Find confirm password (it has the same placeholder, so we might need to be specific or use all)
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i);
    fireEvent.change(passwordInputs[1], { target: { value: "password123" } }); // Confirm Password

    // Click Consent Box
    const consentCheckbox = screen.getByRole("checkbox", {
      name: /I consent to the storage/i,
    });
    fireEvent.click(consentCheckbox);

    // 2. "Solve" the CAPTCHA (Click our mock button)
    fireEvent.click(screen.getByText("I am Human"));

    // 3. Submit
    fireEvent.click(screen.getByText(/Complete Registration/i));

    // 4. Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/register",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining(
            '"cf-turnstile-response":"mock-token-123"',
          ),
        }),
      );
    });

    // 5. Check Success Message
    expect(
      await screen.findByText(/Registration Complete!/i),
    ).toBeInTheDocument();
  });
});
