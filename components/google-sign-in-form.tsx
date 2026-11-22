type GoogleSignInFormProps = {
  nextPath: string;
  from: "login" | "register";
};

export function GoogleSignInForm({ nextPath, from }: GoogleSignInFormProps) {
  return (
    <form action="/auth/google" className="google-signin-form" method="get">
      <input name="next" type="hidden" value={nextPath} />
      <input name="from" type="hidden" value={from} />
      <button className="google-signin-button" type="submit">
        Continue with Google
      </button>
    </form>
  );
}
