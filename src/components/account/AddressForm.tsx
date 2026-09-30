"use client";

import { useActionState } from "react";
import { saveAddress } from "@/app/(toko)/akun/actions";
import { RegionSelect } from "@/components/account/RegionSelect";
import { Alert } from "@/components/form/Alert";
import { Checkbox, TextAreaField, TextField } from "@/components/form/Field";
import { SubmitButton } from "@/components/form/SubmitButton";
import { type FormState, initialFormState } from "@/lib/form";
import { ADDRESS_LABELS } from "@/lib/validation/account";

export type AddressFormValues = {
  id?: string;
  label: string;
  recipientName: string;
  phone: string;
  provinceCode: string;
  cityCode: string;
  districtCode: string;
  postalCode: string;
  street: string;
  landmark: string;
  isDefault: boolean;
};

// Form tambah/ubah alamat (mobile-akun-checkout/06-buku-alamat).
export function AddressForm({
  initial,
  provinces,
  onDone,
  onCancel,
}: {
  initial?: AddressFormValues;
  provinces: [string, string][];
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  // Bungkus server action: kalau berhasil, beri tahu induknya (menutup form & menampilkan pesan)
  const [state, action] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await saveAddress(prev, formData);
    if (result.success) onDone(result.success);
    return result;
  }, initialFormState);
  const fe = state.fieldErrors ?? {};
  const v = state.values;
  const label = v?.label ?? initial?.label ?? "Rumah";

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold">Simpan sebagai</legend>
        <div className="flex flex-wrap gap-2">
          {ADDRESS_LABELS.map((l) => (
            <label key={l} className="cursor-pointer">
              <input type="radio" name="label" value={l} defaultChecked={l === label} className="peer sr-only" />
              <span className="inline-flex h-10 items-center rounded-full border border-line-strong bg-paper px-3.5 text-sm font-medium peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-slate">
                {l}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TextField
          label="Nama penerima"
          name="recipientName"
          autoComplete="name"
          defaultValue={v?.recipientName ?? initial?.recipientName}
          error={fe.recipientName}
        />
        <TextField
          label="Nomor HP"
          id="addr-phone" // beda dari kolom HP di form profil (satu halaman di desktop)
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08xx xxxx xxxx"
          defaultValue={v?.phone ?? initial?.phone}
          error={fe.phone}
        />
      </div>

      <RegionSelect
        provinces={provinces}
        initial={{
          provinceCode: v?.provinceCode ?? initial?.provinceCode ?? "",
          cityCode: v?.cityCode ?? initial?.cityCode ?? "",
          districtCode: v?.districtCode ?? initial?.districtCode ?? "",
        }}
        errors={fe}
      />

      <TextField
        label="Kode pos"
        name="postalCode"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={5}
        defaultValue={v?.postalCode ?? initial?.postalCode}
        error={fe.postalCode}
      />
      <TextAreaField
        label="Alamat lengkap"
        name="street"
        autoComplete="street-address"
        placeholder="Nama jalan, nomor rumah, RT/RW"
        defaultValue={v?.street ?? initial?.street}
        error={fe.street}
      />
      <TextField
        label="Patokan untuk kurir"
        name="landmark"
        optional
        placeholder="Contoh: pagar hijau, dekat masjid"
        defaultValue={v?.landmark ?? initial?.landmark}
        error={fe.landmark}
      />
      <Checkbox name="isDefault" defaultChecked={v ? v.isDefault === "on" : initial?.isDefault}>
        Jadikan alamat utama
      </Checkbox>

      <div className="flex flex-col gap-2 lg:flex-row">
        <SubmitButton pendingLabel="Menyimpan…" className="w-full lg:w-auto">
          Simpan Alamat
        </SubmitButton>
        <button type="button" onClick={onCancel} className="h-12 px-5 text-[15px] font-semibold text-slate-700">
          Batal
        </button>
      </div>
    </form>
  );
}
