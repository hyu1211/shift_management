"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Button from "@/components/common/Button";

type ConfirmState = {
  message: string;
  resolve: (value: boolean) => void;
} | null;

type ConfirmContextValue = {
  confirm: (message: string) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  const handle = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/30 p-6 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl"
          >
            <p className="text-sm font-medium text-zinc-700">{state.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline-neutral" onClick={() => handle(false)}>
                キャンセル
              </Button>
              <Button variant="dark-compact" onClick={() => handle(true)}>
                実行する
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}
