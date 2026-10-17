import AuthLayout from "../components/AuthLayout";
import LogInForm from "../components/LogInForm";
import { useAuth } from "../hooks/useAuth";

type LogInScreenProps = {
  onShowSignUp: () => void;
};

export default function LogInScreen({ onShowSignUp }: LogInScreenProps) {
  const { logIn } = useAuth();

  return (
    <AuthLayout title="Log In" switchPageLabel="Need an account? Create one" onSwitchPage={onShowSignUp}>
      <LogInForm onSubmit={logIn} />
    </AuthLayout>
  );
}
