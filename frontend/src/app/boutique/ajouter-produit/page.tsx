"use client";

import { ProductForm } from "@/components/product/ProductForm";

export default function AjouterProduitPage() {
  return (
    <div className="min-h-screen bg-tf-bg">
      <ProductForm mode="create" />
    </div>
  );
}
