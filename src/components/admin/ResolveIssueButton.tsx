"use client";

import { useState, useTransition } from "react";
import { resolvePaymentIssue } from "@/app/admin/pesanan/actions";
import { Button } from "@/components/ui/Button";

// Tombol "Tandai sudah ditangani" untuk pembayaran terlambat / ganda / refund.
export function ResolveIssueButton({ orderNumber }: { orderNumber: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant="outline"
        loading={pending}
        onClick={() => {
          if (!window.confirm("Uang pembeli sudah dikembalikan atau pesanan sudah diproses manual?")) return;
          startTransition(async () => {
            const res = await resolvePaymentIssue(orderNumber);
            setError(res.ok ? null : res.error);
          });
        }}
      >
        Tandai sudah ditangani
      </Button>
      {error && (
        <p role="alert" className="text-xs font-semibold text-error-field">
          {error}
        </p>
      )}
    </div>
  );
}
