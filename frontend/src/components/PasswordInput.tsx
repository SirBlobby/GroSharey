import { InputHTMLAttributes, useState } from "react";

import { HidePasswordIcon, ShowPasswordIcon } from "./icons";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput({ className = "", ...inputProps }: PasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="password-wrap">
      <input
        type={isPasswordVisible ? "text" : "password"}
        className={`password-input ${className}`}
        {...inputProps}
      />
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
  );
}
