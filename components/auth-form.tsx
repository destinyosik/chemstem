"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { register, signIn, type AuthFormState } from "@/app/actions/auth";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath?: string;
};

const initialState: AuthFormState = {};

export function AuthForm({ mode, nextPath = "" }: AuthFormProps) {
  const action = mode === "login" ? signIn : register;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [motivation, setMotivation] = useState("");
  const isRegister = mode === "register";

  return (
    <form className="auth-form" action={formAction}>
      <input type="hidden" name="next" value={nextPath} />
      {isRegister && (
        <>
          <label>
            Full name
            <input autoComplete="name" maxLength={120} name="full_name" required type="text" />
          </label>
          <label>
            Email address
            <input autoComplete="email" name="email" placeholder="you@example.com" required type="email" />
          </label>
          <label>
            University
            <input autoComplete="organization" maxLength={200} name="university" required type="text" />
          </label>
          <label>
            Why did you become a chemist?
            <textarea
              maxLength={500}
              name="motivation"
              onChange={(event) => setMotivation(event.currentTarget.value)}
              required
              rows={5}
              value={motivation}
            />
            <span className="character-counter" aria-live="polite">
              {motivation.length} / 500 characters
            </span>
          </label>
        </>
      )}
      {!isRegister && (
        <label>
          Email address
          <input autoComplete="email" name="email" placeholder="you@example.com" required type="email" />
        </label>
      )}
      <label>
        Password
        <input
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 8 : undefined}
          name="password"
          placeholder={isRegister ? "At least 8 characters" : "Your password"}
          required
          type="password"
        />
      </label>
      {state.error && <p className="form-message form-error" role="alert">{state.error}</p>}
      {state.message && <p className="form-message form-success" role="status">{state.message}</p>}
      <button className="button button-dark auth-submit" disabled={isPending} type="submit">
        {isPending ? "Please wait…" : isRegister ? "Submit application & create account" : "Log in"}
      </button>
      {!isRegister && <Link className="auth-forgot-link" href="/forgot-password">Forgot your password?</Link>}
      <p className="auth-switch">
        {isRegister ? "Already have an account?" : "New to chemstem?"}{" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
