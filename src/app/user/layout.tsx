import ProtectedLayout from "@/components/ProtectedLayout";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
