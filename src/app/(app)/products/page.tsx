"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  type Product,
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
import { Plus, RefreshCw, Tag, Trash2 } from "lucide-react";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type ProductForm = {
  name: string;
  price?: number;
  category?: string;
  description?: string;
  is_active?: boolean;
  stock?: number;
  sku?: string;
};

export default function ProductsPage() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [filters, setFilters] = useState<{ category: string; status: string }>(
    { category: "", status: "all" },
  );
  const [form, setForm] = useState<ProductForm>({
    name: "",
    price: undefined,
    category: "",
    description: "",
    is_active: true,
    stock: 0,
    sku: "",
  });

  const umkmId = useMemo(
    () => (user?.umkm_id as string) || "",
    [user?.umkm_id],
  );

  const fetchProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getProducts(token, {
        umkm_id: umkmId || undefined,
        category: filters.category || undefined,
        is_active:
          filters.status === "all"
            ? undefined
            : filters.status === "active"
              ? true
              : false,
      });
      setProducts(data);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to load products right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resetForm = () => {
    setForm({
      name: "",
      price: undefined,
      category: "",
      description: "",
      is_active: true,
      stock: 0,
      sku: "",
    });
    setEditingId(null);
  };

  const openForEdit = (product: Product) => {
    setEditingId(product.id || null);
    setForm({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      is_active: product.is_active ?? true,
      stock: product.stock,
      sku: product.sku,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!token) return;
    const payload: Product = {
      ...form,
      umkm_id: umkmId || undefined,
    };

    try {
      if (editingId) {
        await updateProduct(token, editingId, payload);
        toast.success("Product updated");
      } else {
        await createProduct(token, payload);
        toast.success("Product created");
      }
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to save product.",
      );
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!token) return;
    try {
      await deleteProduct(token, id);
      toast.success("Product removed");
      fetchProducts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to delete product.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Catalog
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Products
            </h1>
            <p className="text-sm text-muted-foreground">
              Create, update, and retire products tied to your UMKM ID.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter by category"
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value }))
              }
              className="w-44"
            />
            <Input
              placeholder="Status: all | active | inactive"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="w-44"
            />
            <Button variant="outline" onClick={fetchProducts}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  New product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit product" : "Create product"}
                  </DialogTitle>
                  <DialogDescription>
                    Fields map to the FastAPI product schema. UMKM ID will be
                    attached automatically.
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
                      placeholder="Nama produk"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Price (IDR)</Label>
                      <Input
                        type="number"
                        value={form.price || ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            price: Number(e.target.value),
                          }))
                        }
                        placeholder="100000"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={form.stock || ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            stock: Number(e.target.value),
                          }))
                        }
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Category</Label>
                      <Input
                        value={form.category || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, category: e.target.value }))
                        }
                        placeholder="Food, service, etc."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>SKU</Label>
                      <Input
                        value={form.sku || ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, sku: e.target.value }))
                        }
                        placeholder="SKU-001"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Input
                      value={form.description || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Short description"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Input
                      value={form.is_active ? "active" : "inactive"}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          is_active: e.target.value !== "inactive",
                        }))
                      }
                      placeholder="active / inactive"
                    />
                  </div>
                  <Button className="w-full" onClick={handleSubmit}>
                    {editingId ? "Save changes" : "Create product"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-white/70 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Product list
          </h2>
        </div>
        <Table>
          <TableCaption>
            {loading ? "Loading products..." : "Products fetched from API"}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category || "-"}</TableCell>
                <TableCell>
                  {product.price
                    ? currency.format(product.price)
                    : "Not set"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={product.is_active ? "default" : "secondary"}
                    className={
                      product.is_active
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                        : "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-200"
                    }
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openForEdit(product)}
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
                            Delete {product.name}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the product via the FastAPI
                            endpoint.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              product.id && handleDelete(product.id)
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
        {!products.length && !loading && (
          <p className="text-sm text-muted-foreground mt-3">
            No products yet. Start by adding one.
          </p>
        )}
      </Card>
    </div>
  );
}
