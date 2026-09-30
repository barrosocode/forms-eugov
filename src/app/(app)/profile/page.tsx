import { ProfileForm } from "@/components/profile/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Perfil" };

export default function ProfilePage() {
  return <ProfileForm />;
}
