"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
  type Customer,
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
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Trash2, Users } from "lucide-react";

type CustomerForm = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
};

export default function CustomersPage() {
  const { token, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CustomerForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const umkmId = useMemo(
    () => (user?.umkm_id as string) || "",
    [user?.umkm_id],
  );

  const fetchCustomers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getCustomers(token, {
        umkm_id: umkmId || undefined,
        search: search || undefined,
      });
      setCustomers(data);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to load customers right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    });
    setEditingId(null);
  };

  const openForEdit = (customer: Customer) => {
    setEditingId(customer.id || null);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!token) return;
    const payload: Customer = {
      ...form,
      umkm_id: umkmId || undefined,
    };

    try {
      if (editingId) {
        await updateCustomer(token, editingId, payload);
        toast.success("Customer updated");
      } else {
        await createCustomer(token, payload);
        toast.success("Customer created");
      }
      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to save customer.",
      );
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!token) return;
    try {
      await deleteCustomer(token, id);
      toast.success("Customer removed");
      fetchCustomers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to delete customer.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              CRM
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Customers
            </h1>
            <p className="text-sm text-muted-foreground">
              Keep buyer records clean for receipts, invoices, and credit
              checks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search name/email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            <Button variant="outline" onClick={fetchCustomers}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  New customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit customer" : "Create customer"}
                  </DialogTitle>
                  <DialogDescription>
                    Attach UMKM ID to keep analytics consistent across the
                    workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Nama pelanggan"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        value={form.email || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Phone</Label>
                      <Input
                        value={form.phone || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        placeholder="+62..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Address</Label>
                    <Input
                      value={form.address || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, address: e.target.value }))
                      }
                      placeholder="Alamat lengkap"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Input
                      value={form.notes || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      placeholder="Preferred payment, reminders, etc."
                    />
                  </div>
                  <Button className="w-full" onClick={handleSubmit}>
                    {editingId ? "Save changes" : "Create customer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Customer list
          </h2>
        </div>
        <Table>
          <TableCaption>
            {loading ? "Loading customers..." : "Customers fetched from API"}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email || "-"}</TableCell>
                <TableCell>{customer.phone || "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="max-w-[180px] truncate">
                    {customer.notes || "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openForEdit(customer)}
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
                          <AlertDialogTitle>
                            Delete {customer.name}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the customer via FastAPI and cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              customer.id && handleDelete(customer.id)
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!customers.length && !loading && (
          <p className="text-sm text-muted-foreground mt-3">
            No customers yet. Add one to start tracking transactions.
          </p>
        )}
      </Card>
    </div>
  );
}
