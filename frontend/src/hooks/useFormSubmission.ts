import { useState } from "react";

export function useFormSubmission<FormValues>(onSubmit: (formValues: FormValues) => Promise<void>) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(formValues: FormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit(formValues);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return { errorMessage, isSubmitting, submit, setErrorMessage };
}
