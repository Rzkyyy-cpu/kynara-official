"use client";

import type { AddressCardData } from "@/components/account/AddressBook";
import { RegionSelect } from "@/components/account/RegionSelect";
import { Checkbox, TextAreaField, TextField } from "@/components/form/Field";
import { PlusIcon } from "@/components/icons";
import { formatPhone } from "@/lib/format";
import { ADDRESS_LABELS } from "@/lib/validation/account";

// Langkah 1: pilih alamat tersimpan, atau isi alamat baru.
// choice = id alamat tersimpan, atau "new" untuk form alamat baru.
export function AddressStep({
  addresses,
  provinces,
  choice,
  onChoose,
  formRef,
  errors,
}: {
  addresses: AddressCardData[];
  provinces: [string, string][];
  choice: string;
  onChoose: (choice: string) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
  errors: Record<string, string>;
}) {
  const isNew = choice === "new";

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <h1 className="text-lg font-bold lg:font-serif lg:text-5xl/[56px] lg:font-medium">Kirim ke mana?</h1>

      {addresses.length > 0 && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[13px] text-muted lg:text-[15px]">Pilih alamat tersimpan</legend>
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-4">
            {addresses.map((a) => {
              const on = choice === a.id;
              return (
                <label
                  key={a.id}
                  className={`grid cursor-pointer grid-cols-[24px_minmax(0,1fr)] gap-3 rounded-2xl bg-paper p-4 lg:p-5 ${
                    on ? "border-[1.5px] border-slate-900" : "border-[1.5px] border-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={on}
                    onChange={() => onChoose(a.id)}
                    className="mt-0.5 size-5 accent-slate-700"
                  />
                  <span className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 text-[15px] font-bold">
                      {a.label}
                      {a.isDefault && (
                        <span className="flex h-5 items-center rounded-full bg-sky-tint px-2 text-[11px] font-semibold text-status-kirim">
                          Utama
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-semibold">
                      {a.recipientName} · {formatPhone(a.phone)}
                    </span>
                    <span className="text-sm/[21px] text-muted">{a.fullText}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {!isNew && (
        <button
          type="button"
          onClick={() => onChoose("new")}
          className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-line-dashed text-[15px] font-semibold lg:h-14"
        >
          <PlusIcon size={18} /> Pakai alamat baru
        </button>
      )}

      {isNew && (
        <form
          ref={formRef}
          noValidate
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4 lg:p-7"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Alamat baru</h2>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => onChoose(addresses[0].id)}
                className="text-sm font-semibold text-slate-700"
              >
                Batal
              </button>
            )}
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-semibold">Label alamat</legend>
            <div className="flex flex-wrap gap-2">
              {ADDRESS_LABELS.map((l) => (
                <label key={l} className="cursor-pointer">
                  <input type="radio" name="label" value={l} defaultChecked={l === "Rumah"} className="peer sr-only" />
                  <span className="inline-flex h-10 items-center rounded-full border border-line-strong bg-paper px-3.5 text-sm font-medium peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-slate">
                    {l}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TextField label="Nama penerima" name="recipientName" autoComplete="name" error={errors.recipientName} />
            <TextField
              label="Nomor HP"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08xx xxxx xxxx"
              error={errors.phone}
            />
          </div>
          <RegionSelect provinces={provinces} initial={{ provinceCode: "", cityCode: "", districtCode: "" }} errors={errors} />
          <TextField
            label="Kode pos"
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            error={errors.postalCode}
          />
          <TextAreaField
            label="Alamat lengkap"
            name="street"
            autoComplete="street-address"
            placeholder="Nama jalan, nomor rumah, RT/RW"
            error={errors.street}
          />
          <TextField
            label="Patokan untuk kurir"
            name="landmark"
            optional
            placeholder="Contoh: pagar hijau, dekat masjid"
            error={errors.landmark}
          />
          <Checkbox name="save" defaultChecked>
            Simpan ke buku alamat
          </Checkbox>
        </form>
      )}
    </div>
  );
}
