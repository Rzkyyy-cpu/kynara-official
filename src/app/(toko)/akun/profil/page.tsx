import type { Metadata } from "next";
import Link from "next/link";
import { AccountTitle, Avatar, SectionCard } from "@/components/account/AccountHeader";
import { AddressBook } from "@/components/account/AddressBook";
import { LogoutButton } from "@/components/account/AccountNav";
import { PasswordForm } from "@/components/account/PasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";
import { ChevronRightIcon } from "@/components/icons";
import { MAX_ADDRESSES, getAddresses, getProfile } from "@/lib/account";
import { toAddressCard } from "@/lib/address-view";
import { requireUser } from "@/lib/auth";
import { formatPhone, initials } from "@/lib/format";
import { getProvinces } from "@/lib/wilayah";

export const metadata: Metadata = { title: "Profil & alamat — kynara" };

// Desktop: Data diri + Buku alamat + Ubah password dalam satu halaman (desktop-akun-checkout/06).
// HP: Data diri + Ubah password; buku alamat punya layar sendiri (/akun/alamat).
export default async function ProfilPage() {
  const user = await requireUser("/akun/profil");
  const [profile, addresses] = await Promise.all([getProfile(user.id), getAddresses(user.id)]);

  // Akun Google murni tidak punya password, jadi form ubah password tidak berlaku
  const providers = (user.app_metadata.providers as string[] | undefined) ?? [];
  const hasPassword = providers.includes("email");
  const viaGoogle = providers.includes("google");
  const emailNote = [user.email_confirmed_at ? "Terverifikasi" : "Belum diverifikasi", viaGoogle && "terhubung dengan Google"]
    .filter(Boolean)
    .join(" · ");

  const rowCls = "flex min-h-14 items-center justify-between px-4 text-[15px] font-semibold";

  return (
    <>
      <AccountTitle title="Profil & alamat" mobileTitle="Profil" />

      <SectionCard
        title="Data diri"
        aside={<Avatar size="sm" initials={initials(profile?.full_name, user.email ?? "")} />}
      >
        <ProfileForm
          email={user.email ?? ""}
          emailNote={emailNote}
          initial={{
            fullName: profile?.full_name ?? "",
            phone: formatPhone(profile?.phone ?? null),
            birthDate: profile?.birth_date ?? "",
          }}
        />
      </SectionCard>

      <div className="hidden lg:block">
        <SectionCard title="Buku alamat">
          <AddressBook addresses={addresses.map(toAddressCard)} provinces={getProvinces()} max={MAX_ADDRESSES} />
        </SectionCard>
      </div>

      <SectionCard title="Ubah password">
        {hasPassword ? (
          <PasswordForm />
        ) : (
          <p className="text-sm/[21px] text-muted">
            Akunmu masuk lewat Google, jadi tidak memakai password di kynara. Kalau ingin juga bisa masuk dengan email,
            pakai{" "}
            <Link href="/lupa-password" className="font-semibold text-slate-700 underline">
              Lupa password
            </Link>{" "}
            untuk membuat password.
          </p>
        )}
      </SectionCard>

      {/* Pintasan versi HP */}
      <div className="rounded-2xl border border-line bg-paper lg:hidden">
        <Link href="/akun/alamat" className={rowCls}>
          Buku alamat <ChevronRightIcon size={18} />
        </Link>
        <div className="h-px bg-line" />
        <LogoutButton className={`${rowCls} w-full text-error`}>Keluar</LogoutButton>
      </div>
    </>
  );
}
