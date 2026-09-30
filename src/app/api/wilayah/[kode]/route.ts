import { getChildren } from "@/lib/wilayah";

// GET /api/wilayah/32     -> daftar kota/kabupaten di Jawa Barat
// GET /api/wilayah/32.73  -> daftar kecamatan di Kota Bandung
// Data tidak berubah, jadi boleh disimpan browser & CDN selama sehari.
export async function GET(_request: Request, ctx: RouteContext<"/api/wilayah/[kode]">) {
  const { kode } = await ctx.params;
  const list = getChildren(kode);
  if (!list) return Response.json({ error: "Kode wilayah tidak dikenal." }, { status: 404 });
  return Response.json(list, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
