import "server-only";

import type { AddressCardData } from "@/components/account/AddressBook";
import type { Address } from "@/lib/account";
import { formatAddress } from "@/lib/format";
import { findRegionCodes } from "@/lib/wilayah";

// Baris tabel addresses -> data kartu & isian awal form (nama wilayah diubah balik menjadi kode dropdown).
export function toAddressCard(a: Address): AddressCardData {
  return {
    id: a.id,
    label: a.label,
    recipientName: a.recipient_name,
    phone: a.phone,
    ...findRegionCodes(a.province, a.city, a.district),
    postalCode: a.postal_code,
    street: a.street,
    landmark: a.landmark ?? "",
    isDefault: a.is_default,
    fullText: formatAddress(a),
  };
}
