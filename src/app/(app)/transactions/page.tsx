"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
  uploadReceipt,
  type Transaction,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileUp, Plus, RefreshCw, Trash2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type TransactionForm = {
  amount: number;
  payment_status?: string;
  payment_method?: string;
  description?: string;
  transaction_date?: string;
  customer_id?: string | number;
  product_id?: string | number;
  notes?: string;
};

export default function TransactionsPage() {
  const { token, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [filters, setFilters] = useState<{
    status: string;
    start_date: string;
    end_date: string;
  }>({ status: "", start_date: "", end_date: "" });
  const [form, setForm] = useState<TransactionForm>({
    amount: 0,
    payment_status: "paid",
    payment_method: "cash",
    transaction_date: new Date().toISOString().slice(0, 10),
    description: "",
    notes: "",
  });

  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const umkmId = useMemo(
    () => (user?.umkm_id as string) || "",
    [user?.umkm_id],
  );
  const isAdmin = user?.role?.toLowerCase?.() === "admin";

  const fetchTransactions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getTransactions(token, {
        umkm_id: umkmId || undefined,
        payment_status: filters.status || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      });
      const normalized = (data || []).map((tx) => {
        const normalizedAmount =
          Number(
            tx.final_amount ?? tx.total_amount ?? tx.amount ?? 0,
          ) || 0;
        return {
          ...tx,
          amount: normalizedAmount,
          final_amount: tx.final_amount ?? normalizedAmount,
          total_amount: tx.total_amount ?? normalizedAmount,
        };
      });
      setTransactions(normalized);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to load transactions right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, umkmId]);

  const resetForm = () => {
    setForm({
      amount: 0,
      payment_status: "paid",
      payment_method: "cash",
      transaction_date: new Date().toISOString().slice(0, 10),
      description: "",
      notes: "",
    });
    setEditingId(null);
  };

  const openForEdit = (transaction: Transaction) => {
    setEditingId(transaction.id || null);
    const normalizedAmount =
      Number(
        transaction.final_amount ?? transaction.total_amount ?? transaction.amount ?? 0,
      ) || 0;
    setForm({
      amount: normalizedAmount,
      payment_status: transaction.payment_status,
      payment_method: transaction.payment_method,
      transaction_date: transaction.transaction_date,
      description: transaction.description,
      notes: transaction.notes,
      customer_id: transaction.customer_id,
      product_id: transaction.product_id,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!token) return;
    const payload: Transaction = {
      ...form,
      umkm_id: umkmId || undefined,
      total_amount: form.amount,
      final_amount: form.amount,
    };

    try {
      if (editingId) {
        await updateTransaction(token, editingId, payload);
        toast.success("Transaction updated");
      } else {
        await createTransaction(token, payload, user?.id);
        toast.success("Transaction created");
      }
      setDialogOpen(false);
      resetForm();
      fetchTransactions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to save transaction.",
      );
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!token) return;
    try {
      await deleteTransaction(token, id);
      toast.success("Transaction removed");
      fetchTransactions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to delete transaction.",
      );
    }
  };

  const handleOcrUpload = async () => {
    if (!token || !ocrFile) return;
    setOcrLoading(true);
    setOcrText(null);
    try {
      const result = await uploadReceipt(token, ocrFile, {
        umkm_id: umkmId,
      });
      setOcrText(result.text);
      toast.success("OCR result ready");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to process receipt.",
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const applyOcrToForm = () => {
    if (ocrText) {
      setForm((f) => ({ ...f, description: ocrText, notes: "OCR import" }));
      setOcrOpen(false);
      setDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Cashflow
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Transactions
            </h1>
            <p className="text-sm text-muted-foreground">
              Capture sales, returns, and payouts. Use the OCR flow to import
              from receipts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Status (paid/pending/failed)"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="w-52"
            />
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters((f) => ({ ...f, start_date: e.target.value }))
              }
            />
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                setFilters((f) => ({ ...f, end_date: e.target.value }))
              }
            />
            <Button variant="outline" onClick={fetchTransactions}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  New transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit transaction" : "Create transaction"}
                  </DialogTitle>
                  <DialogDescription>
                    This will POST/PUT to the FastAPI transactions endpoint with
                    your JWT.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Amount (IDR)</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          amount: Number(e.target.value) || 0,
                        }))
                      }
                      placeholder="100000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Payment status</Label>
                    <Input
                      value={form.payment_status || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, payment_status: e.target.value }))
                      }
                      placeholder="paid / pending / failed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Payment method</Label>
                    <Input
                      value={form.payment_method || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, payment_method: e.target.value }))
                      }
                      placeholder="cash, transfer, qris..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.transaction_date || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          transaction_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Product ID</Label>
                    <Input
                      value={form.product_id || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, product_id: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Customer ID</Label>
                    <Input
                      value={form.customer_id || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, customer_id: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={form.description || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="e.g., Penjualan offline di toko utama"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Notes</Label>
                    <Input
                      value={form.notes || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      placeholder="Add tags, promo codes, or OCR notes"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleSubmit}>
                  {editingId ? "Save changes" : "Create transaction"}
                </Button>
              </DialogContent>
            </Dialog>
            <Dialog open={ocrOpen} onOpenChange={setOcrOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload receipt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload receipt for OCR</DialogTitle>
                  <DialogDescription>
                    Sends the image to `/api/v1/ocr/upload`, then lets you push
                    the extracted text into a transaction.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setOcrFile(e.target.files ? e.target.files[0] : null)
                    }
                  />
                  <Button
                    onClick={handleOcrUpload}
                    disabled={!ocrFile || ocrLoading}
                  >
                    {ocrLoading ? "Processing..." : "Run OCR"}
                  </Button>
                  {ocrText && (
                    <div className="space-y-2">
                      <Label>Extracted text</Label>
                      <div className="rounded-lg border border-dashed border-emerald-200 dark:border-emerald-800 bg-white/60 dark:bg-white/5 p-3 text-sm text-slate-700 dark:text-slate-200">
                        {ocrText}
                      </div>
                      <Button variant="secondary" onClick={applyOcrToForm}>
                        Use in transaction form
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Transaction list
          </h2>
        </div>
        <Table>
          <TableCaption>
            {loading ? "Loading transactions..." : "Transactions from API"}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const displayAmount =
                Number(tx.final_amount ?? tx.total_amount ?? tx.amount ?? 0) || 0;
              return (
                <TableRow key={tx.id}>
                  <TableCell>{tx.transaction_date || "—"}</TableCell>
                  <TableCell>{currency.format(displayAmount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.payment_status === "paid" ? "default" : "secondary"
                      }
                      className={
                        tx.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                          : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                      }
                    >
                      {tx.payment_status || "n/a"}
                    </Badge>
                  </TableCell>
                  <TableCell>{tx.payment_method || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {tx.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openForEdit(tx)}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes the record via FastAPI.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => tx.id && handleDelete(tx.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!transactions.length && !loading && (
          <p className="text-sm text-muted-foreground mt-3">
            No transactions yet. Start with manual entry or OCR import.
          </p>
        )}
      </Card>
    </div>
  );
}
