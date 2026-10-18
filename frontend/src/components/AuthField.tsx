import { InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function AuthField({ label, ...inputProps }: AuthFieldProps) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input {...inputProps} />
    </label>
  );
}
