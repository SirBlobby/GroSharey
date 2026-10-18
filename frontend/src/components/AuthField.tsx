import { InputHTMLAttributes, useState } from "react";

import { HidePasswordIcon, ShowPasswordIcon } from "./icons";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function AuthField({ label, type, ...inputProps }: AuthFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === "password";

  if (!isPasswordField) {
    return (
      <label className="auth-field">
        <span>{label}</span>
        <input type={type} {...inputProps} />
      </label>
    );
  }

  return (
    <label className="auth-field">
      <span>{label}</span>
      <div className="password-wrap">
        <input type={isPasswordVisible ? "text" : "password"} {...inputProps} />
        <button
          type="button"
          className="password-toggle"
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          aria-pressed={isPasswordVisible}
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          {isPasswordVisible ? <HidePasswordIcon /> : <ShowPasswordIcon />}
        </button>
      </div>
    </label>
  );
}
