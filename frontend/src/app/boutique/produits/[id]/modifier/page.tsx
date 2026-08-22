"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "@/components/product/ProductForm";

export default function ModifierProduitPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-screen bg-tf-bg">
      <ProductForm mode="edit" productId={Number(id)} />
    </div>
  );
}
