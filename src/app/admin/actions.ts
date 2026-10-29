"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { slugify, toInt } from "@/lib/utils";

async function guard() {
  const a = await requireAdmin();
  if (!a) throw new Error("Non autorisé");
  return a.supabase;
}

// ---------- Catégories ----------
export async function saveCategory(fd: FormData) {
  const db = await guard();
  const id = String(fd.get("id") || "");
  const name = String(fd.get("name") || "").trim();
  if (!name) return;
  const row = {
    name,
    description: String(fd.get("description") || "") || null,
    position: toInt(fd.get("position")),
    is_active: fd.get("is_active") === "on",
  };
  if (id) await db.from("categories").update(row).eq("id", id);
  else await db.from("categories").insert({ ...row, slug: slugify(name) + "-" + Math.random().toString(36).slice(2, 5) });
  revalidatePath("/", "layout");
}

export async function deleteCategory(fd: FormData) {
  const db = await guard();
  await db.from("categories").delete().eq("id", String(fd.get("id")));
  revalidatePath("/", "layout");
}

// ---------- Produits ----------
export async function saveProduct(fd: FormData) {
  const db = await guard();
  const id = String(fd.get("id") || "");
  const name = String(fd.get("name") || "").trim();
  const price = toInt(fd.get("price"));
  const minRaw = String(fd.get("min_price") || "").trim();
  const minPrice = minRaw === "" ? null : toInt(fd.get("min_price"));
  if (!name || price <= 0) throw new Error("Nom et prix requis.");
  if (minPrice != null && minPrice > price) throw new Error("Le prix plancher ne peut pas dépasser le prix de vente.");

  const row = {
    name,
    brand: String(fd.get("brand") || "") || null,
    category_id: String(fd.get("category_id") || "") || null,
    description: String(fd.get("description") || "") || null,
    price,
    compare_at_price: toInt(fd.get("compare_at_price")) || null,
    stock: toInt(fd.get("stock")),
    images: String(fd.get("images") || "").split("\n").map((s) => s.trim()).filter(Boolean),
    negotiable: fd.get("negotiable") === "on",
    is_active: fd.get("is_active") === "on",
    is_featured: fd.get("is_featured") === "on",
  };

  let productId = id;
  if (id) {
    const { error } = await db.from("products").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);
    const { data, error } = await db.from("products").insert({ ...row, slug }).select("id").single();
    if (error || !data) throw new Error(error?.message ?? "Création impossible");
    productId = data.id;
  }

  if (minPrice == null) await db.from("product_floors").delete().eq("product_id", productId);
  else await db.from("product_floors").upsert({ product_id: productId, min_price: minPrice });

  revalidatePath("/", "layout");
  redirect("/admin/produits");
}

export async function deleteProduct(fd: FormData) {
  const db = await guard();
  await db.from("products").delete().eq("id", String(fd.get("id")));
  revalidatePath("/", "layout");
}

// ---------- Commandes ----------
export async function updateOrderStatus(fd: FormData) {
  const db = await guard();
  const status = String(fd.get("status"));
  if (!["pending", "paid", "failed", "shipped", "delivered", "cancelled"].includes(status)) return;
  await db.from("orders").update({ status }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/commandes");
}

// ---------- Paramètres ----------
export async function saveShop(fd: FormData) {
  const db = await guard();
  await db.from("settings").upsert({
    key: "shop",
    value: {
      name: "Zone Groupe",
      phone: String(fd.get("phone") || ""),
      whatsapp: String(fd.get("whatsapp") || ""),
      address: String(fd.get("address") || ""),
    },
  });
  revalidatePath("/", "layout");
}

export async function setAvailability(fd: FormData) {
  const db = await guard();
  await db.from("settings").upsert({ key: "admin_available", value: fd.get("available") === "1" });
  revalidatePath("/admin", "layout");
}
