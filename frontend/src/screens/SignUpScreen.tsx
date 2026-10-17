import AuthForm from "../components/AuthForm";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../hooks/useAuth";

type SignUpScreenProps = {
  onShowLogIn: () => void;
};

export default function SignUpScreen({ onShowLogIn }: SignUpScreenProps) {
  const { signUp } = useAuth();

  return (
    <AuthLayout title="Create Account" switchPageLabel="Already have an account? Log in" onSwitchPage={onShowLogIn}>
      <AuthForm submitLabel="Create Account" onSubmit={signUp} />
    </AuthLayout>
  );
}
