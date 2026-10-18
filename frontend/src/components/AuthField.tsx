import { InputHTMLAttributes } from "react";

import PasswordInput from "./PasswordInput";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function AuthField({ label, type, ...inputProps }: AuthFieldProps) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      {type === "password" ? <PasswordInput {...inputProps} /> : <input type={type} {...inputProps} />}
    </label>
  );
}
