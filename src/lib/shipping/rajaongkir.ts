import "server-only";

import { billableKg } from "@/lib/shipping/flat";
import {
  COURIERS,
  cachedRatesSchema,
  costResponseSchema,
  destinationKey,
  destinationResponseSchema,
  pickDestination,
  toRates,
} from "@/lib/shipping/rajaongkir-map";
import type { RateRequest, ShippingDestination, ShippingProvider, ShippingRate } from "@/lib/shipping/types";
import { createAdminClient } from "@/lib/supabase/admin";

// Provider ongkir ASLI: RajaOngkir (Komerce), paket Starter gratis = 100 hit cek ongkir per hari.
// Supaya kuota awet, setiap jawaban dicatat di database (lihat migration ongkir_rajaongkir):
//   - ID tujuan: dicari sekali per kecamatan + kode pos, disimpan selamanya
//   - tarif: disimpan 24 jam per (tujuan, berat per kg)
// API Key hanya dibaca di sini, dan "server-only" menjamin file ini tidak ikut ke browser.

const BASE_URL = "https://rajaongkir.komerce.id/api/v1";
const CACHE_HOURS = 24;
// Wilayah yang tidak ditemukan juga dicatat (destination_id kosong) supaya tidak menghabiskan kuota
// setiap kali dicek. Dicoba lagi setelah 7 hari, siapa tahu data RajaOngkir sudah diperbarui.
const NOT_FOUND = "";
const NOT_FOUND_RETRY_DAYS = 7;
// Rute yang tidak dilayani kurir mana pun juga dicatat (daftar kosong), tapi hanya 1 jam.
const EMPTY_CACHE_HOURS = 1;
// API gangguan (timeout, error server, kena batas): jangan dicoba lagi selama 5 menit,
// supaya pembeli tidak menunggu timeout berulang dan kuota tidak terbuang. Disimpan di memori server.
const PAUSE_MS = 5 * 60_000;
let pausedUntil = 0;
const COURIER_PARAM = COURIERS.join(":");

export class RajaOngkirError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function config() {
  const key = process.env.RAJAONGKIR_API_KEY;
  const origin = process.env.RAJAONGKIR_ORIGIN_ID;
  if (!key) throw new RajaOngkirError("RAJAONGKIR_API_KEY belum diisi di .env.local");
  if (!origin) throw new RajaOngkirError("RAJAONGKIR_ORIGIN_ID belum diisi di .env.local");
  return { key, origin };
}

async function call(path: string, init: RequestInit = {}) {
  if (Date.now() < pausedUntil) throw new RajaOngkirError("RajaOngkir sedang dijeda setelah gangguan");
  const { key } = config();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { key, Accept: "application/json", ...init.headers },
      signal: AbortSignal.timeout(8_000), // jangan biarkan pembeli menunggu lama, langsung pakai tarif flat
      cache: "no-store", // cache-nya kita atur sendiri di database
    });
  } catch (e) {
    pausedUntil = Date.now() + PAUSE_MS; // timeout / jaringan putus
    throw new RajaOngkirError(`RajaOngkir ${path}: ${e instanceof Error ? e.message : "gagal terhubung"}`);
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status >= 500 || res.status === 429) pausedUntil = Date.now() + PAUSE_MS;
    const message = (body as { meta?: { message?: unknown } } | null)?.meta?.message;
    throw new RajaOngkirError(
      `RajaOngkir ${path}: HTTP ${res.status} ${typeof message === "string" ? message : ""}`.trim(),
      res.status,
    );
  }
  return body;
}

// Cari ID wilayah RajaOngkir. Dipakai juga sekali untuk mencari ID gudang (RAJAONGKIR_ORIGIN_ID).
export async function searchDestinations(term: string) {
  const body = await call(`/destination/domestic-destination?search=${encodeURIComponent(term)}&limit=50&offset=0`);
  const parsed = destinationResponseSchema.safeParse(body);
  if (!parsed.success) throw new RajaOngkirError("Format jawaban pencarian wilayah RajaOngkir berubah");
  return parsed.data.data ?? [];
}

async function resolveDestinationId(d: ShippingDestination): Promise<string> {
  const db = createAdminClient();
  const key = destinationKey(d);

  const { data: cached } = await db
    .from("shipping_destinations")
    .select("destination_id, created_at")
    .eq("lookup_key", key)
    .maybeSingle();
  if (cached?.destination_id) return cached.destination_id;
  const notFound = () => new RajaOngkirError(`Wilayah tidak ditemukan di RajaOngkir: ${key}`);
  if (cached && Date.now() - Date.parse(cached.created_at) < NOT_FOUND_RETRY_DAYS * 86400_000) throw notFound();

  // Cari pakai kode pos dulu (paling tepat), kalau kecamatannya tidak cocok cari pakai nama kecamatan.
  let row = pickDestination(await searchDestinations(d.postalCode), d);
  row ??= pickDestination(await searchDestinations(d.district), d);
  if (!row) {
    await db
      .from("shipping_destinations")
      .upsert({ lookup_key: key, destination_id: NOT_FOUND, label: "(tidak ditemukan)", created_at: new Date().toISOString() });
    throw notFound();
  }

  const destinationId = String(row.id);
  await db.from("shipping_destinations").upsert({ lookup_key: key, destination_id: destinationId, label: row.label.slice(0, 300) });
  return destinationId;
}

async function fetchRates(origin: string, destination: string, weightKg: number): Promise<ShippingRate[]> {
  const body = await call("/calculate/domestic-cost", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      origin,
      destination,
      weight: String(weightKg * 1000), // sudah dibulatkan per kg, sama dengan yang ditagih kurir
      courier: COURIER_PARAM,
      price: "lowest",
    }),
  }).catch((e: unknown) => {
    // 404 "Calculate Domestic Shipping Cost not found" = tidak ada kurir yang melayani rute ini
    if (e instanceof RajaOngkirError && e.status === 404) return { meta: { code: 404 }, data: [] };
    throw e;
  });
  const parsed = costResponseSchema.safeParse(body);
  if (!parsed.success) throw new RajaOngkirError("Format jawaban cek ongkir RajaOngkir berubah");
  return toRates(parsed.data.data ?? []);
}

export const rajaongkirProvider: ShippingProvider = {
  name: "rajaongkir",
  async getRates({ destination, weightGram }: RateRequest): Promise<ShippingRate[]> {
    const { origin } = config();
    const destinationId = await resolveDestinationId(destination);
    const weightKg = billableKg(weightGram);
    const db = createAdminClient();
    const cacheKey = { origin_id: origin, destination_id: destinationId, weight_kg: weightKg, couriers: COURIER_PARAM };

    // 1) Lihat catatan dulu. Daftar kosong (rute tidak dilayani) hanya berlaku 1 jam.
    const freshSince = new Date(Date.now() - CACHE_HOURS * 3600_000).toISOString();
    const { data: cached } = await db
      .from("shipping_rate_cache")
      .select("rates, fetched_at")
      .match(cacheKey)
      .gte("fetched_at", freshSince)
      .maybeSingle();
    const cachedRates = cachedRatesSchema.safeParse(cached?.rates);
    if (cached && cachedRates.success) {
      const emptyFresh = Date.now() - Date.parse(cached.fetched_at) < EMPTY_CACHE_HOURS * 3600_000;
      if (cachedRates.data.length > 0 || emptyFresh) return cachedRates.data;
    }

    // 2) Belum ada / basi -> tanya RajaOngkir (memakai 1 kuota), lalu catat.
    const rates = await fetchRates(origin, destinationId, weightKg);
    const { error } = await db
      .from("shipping_rate_cache")
      .upsert({ ...cacheKey, rates, fetched_at: new Date().toISOString() });
    if (error) console.error("shipping_rate_cache:", error.message);
    return rates;
  },
};
