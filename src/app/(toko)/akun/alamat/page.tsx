import type { Metadata } from "next";
import { AccountTitle } from "@/components/account/AccountHeader";
import { AddressBook } from "@/components/account/AddressBook";
import { MAX_ADDRESSES, getAddresses } from "@/lib/account";
import { toAddressCard } from "@/lib/address-view";
import { requireUser } from "@/lib/auth";
import { getProvinces } from "@/lib/wilayah";

export const metadata: Metadata = { title: "Buku alamat — kynara" };

// Layar "Buku alamat" untuk HP (mobile-akun-checkout/06). Di desktop, buku alamat juga tampil di Profil & alamat.
export default async function AlamatPage() {
  const user = await requireUser("/akun/alamat");
  const addresses = await getAddresses(user.id);

  return (
    <>
      <AccountTitle title="Buku alamat" />
      <AddressBook addresses={addresses.map(toAddressCard)} provinces={getProvinces()} max={MAX_ADDRESSES} />
    </>
  );
}
