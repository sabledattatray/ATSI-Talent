"use client";
import { useEffect, useRef } from "react";
export function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} aria-label={label}
    onCancel={event => { event.preventDefault(); onClose(); }}
    className="fixed inset-0 m-0 w-screen max-w-none h-dvh max-h-none border-0 bg-transparent p-4 open:flex items-center justify-center backdrop:bg-black/60">
    <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-xl">{children}</div>
  </dialog>;
}
