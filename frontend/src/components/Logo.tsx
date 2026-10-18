type LogoProps = {
  className?: string;
};

export default function Logo({ className = "" }: LogoProps) {
  return <span className={`logo ${className}`} role="img" aria-label="groSharey logo" />;
}
