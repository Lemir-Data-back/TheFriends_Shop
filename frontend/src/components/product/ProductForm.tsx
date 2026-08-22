"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Upload, Loader2, Trash2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Product, ProductCategorie, ProductOccasion } from "@/types/product";

const CATEGORIES: { value: ProductCategorie; label: string }[] = [
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "enfant", label: "Enfant" },
];

const OCCASIONS: { value: ProductOccasion; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "bureau", label: "Bureau" },
  { value: "ceremonie", label: "Cérémonie" },
  { value: "traditionnel", label: "Traditionnel" },
  { value: "mariage", label: "Mariage" },
  { value: "sport", label: "Sport" },
];

const TISSUS = ["Wax", "Bazin", "Kente", "Coton", "Soie", "Lin"];

interface TailleRow { taille: string; poitrine: string; tailleCm: string }
interface StockRow { taille: string; couleur: string; quantite: string }

function tailleRowsFromGuide(guide?: Record<string, Record<string, string>>): TailleRow[] {
  if (!guide) return [];
  return Object.entries(guide).map(([taille, mesures]) => ({
    taille,
    poitrine: mesures.poitrine ?? "",
    tailleCm: mesures.taille ?? "",
  }));
}

function stockRowsFromStock(stock?: Record<string, Record<string, number>>): StockRow[] {
  if (!stock) return [];
  const rows: StockRow[] = [];
  for (const [taille, couleurs] of Object.entries(stock)) {
    for (const [couleur, quantite] of Object.entries(couleurs)) {
      rows.push({ taille, couleur, quantite: String(quantite) });
    }
  }
  return rows;
}

export function ProductForm({ mode, productId }: { mode: "create" | "edit"; productId?: number }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isCouturier = user?.role === "couturier";
  const terme = isCouturier ? "modèle" : "article";

  const { data: existing } = useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => (await api.get(`/products/${productId}`)).data,
    enabled: mode === "edit" && !!productId,
  });

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState<ProductCategorie>("femme");
  const [occasion, setOccasion] = useState<ProductOccasion | "">("");
  const [style, setStyle] = useState("");
  const [tissu, setTissu] = useState("");
  const [prix, setPrix] = useState("");
  const [prixPromo, setPrixPromo] = useState("");
  const [isSurMesure, setIsSurMesure] = useState(false);
  const [prixPlancher, setPrixPlancher] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tailleRows, setTailleRows] = useState<TailleRow[]>([]);
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [seuilStockFaible, setSeuilStockFaible] = useState("");
  const [stagedFiles, setStagedFiles] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!existing) return;
    setTitre(existing.titre);
    setDescription(existing.description ?? "");
    setCategorie(existing.categorie);
    setOccasion(existing.occasion ?? "");
    setStyle(existing.style ?? "");
    setTissu(existing.tissu ?? "");
    setPrix(String(existing.prix));
    setPrixPromo(existing.prix_promo ? String(existing.prix_promo) : "");
    setIsSurMesure(existing.is_sur_mesure);
    setPrixPlancher(existing.prix_plancher_negociation ? String(existing.prix_plancher_negociation) : "");
    setTags(existing.tags ?? []);
    setTailleRows(tailleRowsFromGuide(existing.tailles_guide));
    setStockRows(stockRowsFromStock(existing.stock));
    setSeuilStockFaible(existing.seuil_stock_faible != null ? String(existing.seuil_stock_faible) : "");
  }, [existing]);

  function buildPayload() {
    const tailles_guide = tailleRows.reduce((acc, r) => {
      if (!r.taille.trim()) return acc;
      acc[r.taille.trim()] = { poitrine: r.poitrine.trim(), taille: r.tailleCm.trim() };
      return acc;
    }, {} as Record<string, Record<string, string>>);

    const stock = stockRows.reduce((acc, r) => {
      if (!r.taille.trim() || !r.couleur.trim()) return acc;
      acc[r.taille.trim()] = acc[r.taille.trim()] ?? {};
      acc[r.taille.trim()][r.couleur.trim()] = parseInt(r.quantite, 10) || 0;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return {
      titre: titre.trim(),
      description: description.trim() || undefined,
      categorie,
      occasion: occasion || undefined,
      style: style.trim() || undefined,
      tissu: tissu || undefined,
      prix: parseInt(prix, 10),
      prix_promo: prixPromo ? parseInt(prixPromo, 10) : undefined,
      is_sur_mesure: isSurMesure,
      prix_plancher_negociation: isSurMesure && prixPlancher ? parseInt(prixPlancher, 10) : undefined,
      tags: tags.length > 0 ? tags : undefined,
      tailles_guide: Object.keys(tailles_guide).length > 0 ? tailles_guide : undefined,
      stock: Object.keys(stock).length > 0 ? stock : undefined,
      seuil_stock_faible: seuilStockFaible ? parseInt(seuilStockFaible, 10) : undefined,
    };
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/products", buildPayload());
      for (const { file } of stagedFiles) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post(`/products/${data.id}/images`, fd, { headers: { "Content-Type": undefined } });
      }
      return data;
    },
    onSuccess: (data) => router.push(`/boutique/produits/${data.id}/modifier`),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/products/${productId}`, buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product", productId] });
      setError("");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const uploadImage = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.post(`/products/${productId}/images`, fd, { headers: { "Content-Type": undefined } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product", productId] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const deleteImage = useMutation({
    mutationFn: (imageId: number) => api.delete(`/products/${productId}/images/${imageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product", productId] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!titre.trim() || !prix) {
      setError("Le titre et le prix sont obligatoires.");
      return;
    }
    if (mode === "create") createMutation.mutate();
    else updateMutation.mutate();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (mode === "edit") {
      Array.from(files).forEach((file) => uploadImage.mutate(file));
    } else {
      const nouveaux = Array.from(files).map((file) => ({ file, url: URL.createObjectURL(file) }));
      setStagedFiles((prev) => [...prev, ...nouveaux].slice(0, 6));
    }
    e.target.value = "";
  }

  function removeStagedFile(index: number) {
    setStagedFiles((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const nbImages = mode === "edit" ? existing?.images.length ?? 0 : stagedFiles.length;

  return (
    <form onSubmit={handleSubmit} className="max-w-screen-md mx-auto px-4 py-8 space-y-6">
      <div>
        <p className="font-sans text-[13px] text-tf-text-muted">
          {mode === "create" ? `Nouveau ${terme}` : `Modifier le ${terme}`}
        </p>
        <h1 className="font-serif text-h1 text-tf-black">
          {mode === "create" ? `Ajouter un ${terme}` : titre || `Modifier le ${terme}`}
        </h1>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-xl border border-tf-border p-5">
        <h2 className="font-sans text-[13px] font-semibold text-tf-text mb-3">
          {isCouturier ? "Photo du modèle" : "Photos"} ({nbImages}/6)
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {mode === "edit" ? (
            <>
              {existing?.images.map((img) => (
                <div key={img.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-tf-gray-soft group">
                  <Image src={img.url_cloudinary} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => deleteImage.mutate(img.id)}
                    aria-label="Supprimer cette photo"
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {nbImages < 6 && (
                <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-tf-border flex flex-col items-center justify-center gap-1.5 text-tf-text-muted hover:border-tf-gold hover:text-tf-gold transition-colors cursor-pointer">
                  {uploadImage.isPending ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                  <span className="font-sans text-[11px] font-medium">Ajouter</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleFileChange} disabled={uploadImage.isPending} />
                </label>
              )}
            </>
          ) : (
            <>
              {stagedFiles.map((staged, i) => (
                <div key={staged.url} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-tf-gray-soft group">
                  <Image src={staged.url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeStagedFile(i)}
                    aria-label="Retirer cette photo"
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {stagedFiles.length < 6 && (
                <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-tf-border flex flex-col items-center justify-center gap-1.5 text-tf-text-muted hover:border-tf-gold hover:text-tf-gold transition-colors cursor-pointer">
                  <Upload size={20} />
                  <span className="font-sans text-[11px] font-medium">Ajouter</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleFileChange} />
                </label>
              )}
            </>
          )}
        </div>
        <p className="font-sans text-[11px] text-tf-text-muted mt-2">JPG, PNG ou WebP — 5 Mo max par photo.</p>
      </div>

      {/* Infos principales */}
      <div className="bg-white rounded-xl border border-tf-border p-5 space-y-4">
        <div>
          <label className="input-label">Titre *</label>
          <input className="input-field" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Robe wax portefeuille" required />
        </div>
        <div>
          <label className="input-label">Description</label>
          <textarea className="input-field" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décris l'article, la matière, la coupe..." />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="input-label">Catégorie *</label>
            <select className="input-field" value={categorie} onChange={(e) => setCategorie(e.target.value as ProductCategorie)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Occasion</label>
            <select className="input-field" value={occasion} onChange={(e) => setOccasion(e.target.value as ProductOccasion)}>
              <option value="">—</option>
              {OCCASIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Tissu</label>
            <select className="input-field" value={tissu} onChange={(e) => setTissu(e.target.value)}>
              <option value="">—</option>
              {TISSUS.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="input-label">Style</label>
          <input className="input-field" value={style} onChange={(e) => setStyle(e.target.value)} placeholder="Ex. portefeuille, ample, ajusté..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Prix (FCFA) *</label>
            <input className="input-field" type="number" min={1} value={prix} onChange={(e) => setPrix(e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Prix promo (FCFA)</label>
            <input className="input-field" type="number" min={1} value={prixPromo} onChange={(e) => setPrixPromo(e.target.value)} placeholder="Optionnel" />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="input-label">Tags</label>
          <div className="flex gap-2">
            <input
              className="input-field"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="wax, mariage, cérémonie..."
            />
            <button type="button" onClick={addTag} className="btn-outline px-4 shrink-0">Ajouter</button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-sm bg-tf-gray-soft font-sans text-[11px] uppercase tracking-wide text-tf-text-muted">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} aria-label={`Retirer le tag ${tag}`}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sur mesure */}
      <div className="bg-white rounded-xl border border-tf-border p-5 space-y-4">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={isSurMesure} onChange={(e) => setIsSurMesure(e.target.checked)} className="w-4 h-4 accent-tf-gold" />
          <span className="font-sans text-[13px] font-semibold text-tf-text">Article sur mesure</span>
        </label>

        {isSurMesure && (
          <div>
            <label className="input-label">Prix plancher négociable (optionnel)</label>
            <input className="input-field" type="number" min={1} value={prixPlancher} onChange={(e) => setPrixPlancher(e.target.value)} placeholder="Ex. 30000" />
            <p className="font-sans text-[11px] text-tf-text-muted mt-1.5">
              Le prix en dessous duquel tu n&apos;acceptes pas de négocier avec un client. Laisse vide pour négocier librement, sans plancher imposé par la plateforme.
            </p>
          </div>
        )}
      </div>

      {/* Guide des tailles */}
      <div className="bg-white rounded-xl border border-tf-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-sans text-[13px] font-semibold text-tf-text">Guide des tailles</h2>
          <button
            type="button"
            onClick={() => setTailleRows([...tailleRows, { taille: "", poitrine: "", tailleCm: "" }])}
            className="flex items-center gap-1 font-sans text-[12px] font-semibold text-tf-gold-dark hover:underline"
          >
            <Plus size={13} /> Ajouter une taille
          </button>
        </div>
        {tailleRows.length === 0 ? (
          <p className="font-sans text-[12px] text-tf-text-muted">Aucune taille renseignée — la recommandation automatique ne sera pas disponible.</p>
        ) : (
          <div className="space-y-2">
            {tailleRows.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="input-field !py-2 w-20" placeholder="Taille" value={row.taille} onChange={(e) => setTailleRows(tailleRows.map((r, j) => j === i ? { ...r, taille: e.target.value } : r))} />
                <input className="input-field !py-2" placeholder="Poitrine (ex. 80-84)" value={row.poitrine} onChange={(e) => setTailleRows(tailleRows.map((r, j) => j === i ? { ...r, poitrine: e.target.value } : r))} />
                <input className="input-field !py-2" placeholder="Taille en cm (ex. 60-64)" value={row.tailleCm} onChange={(e) => setTailleRows(tailleRows.map((r, j) => j === i ? { ...r, tailleCm: e.target.value } : r))} />
                <button type="button" onClick={() => setTailleRows(tailleRows.filter((_, j) => j !== i))} aria-label="Supprimer cette taille" className="text-tf-text-muted hover:text-tf-error shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock */}
      <div className="bg-white rounded-xl border border-tf-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-sans text-[13px] font-semibold text-tf-text">Stock par taille / couleur</h2>
          <button
            type="button"
            onClick={() => setStockRows([...stockRows, { taille: "", couleur: "", quantite: "" }])}
            className="flex items-center gap-1 font-sans text-[12px] font-semibold text-tf-gold-dark hover:underline"
          >
            <Plus size={13} /> Ajouter une ligne
          </button>
        </div>
        {stockRows.length === 0 ? (
          <p className="font-sans text-[12px] text-tf-text-muted">Aucun stock renseigné.</p>
        ) : (
          <div className="space-y-2">
            {stockRows.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="input-field !py-2 w-20" placeholder="Taille" value={row.taille} onChange={(e) => setStockRows(stockRows.map((r, j) => j === i ? { ...r, taille: e.target.value } : r))} />
                <input className="input-field !py-2" placeholder="Couleur" value={row.couleur} onChange={(e) => setStockRows(stockRows.map((r, j) => j === i ? { ...r, couleur: e.target.value } : r))} />
                <input className="input-field !py-2 w-24" type="number" min={0} placeholder="Qté" value={row.quantite} onChange={(e) => setStockRows(stockRows.map((r, j) => j === i ? { ...r, quantite: e.target.value } : r))} />
                <button type="button" onClick={() => setStockRows(stockRows.filter((_, j) => j !== i))} aria-label="Supprimer cette ligne" className="text-tf-text-muted hover:text-tf-error shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-tf-border">
          <label className="input-label">Seuil d&apos;alerte stock faible</label>
          <input
            className="input-field w-32"
            type="number"
            min={0}
            value={seuilStockFaible}
            onChange={(e) => setSeuilStockFaible(e.target.value)}
            placeholder="Ex. 3"
          />
          <p className="font-sans text-[11px] text-tf-text-muted mt-1.5">
            Quand le stock total tombe à ce nombre ou en dessous, un badge « Stock faible » apparaît sur la fiche produit. Laisse vide pour désactiver l&apos;alerte.
          </p>
        </div>
      </div>

      {error && <p className="font-sans text-[13px] text-tf-error">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-gold flex-1 flex items-center justify-center gap-2">
          {saving && <Loader2 size={15} className="animate-spin" />}
          {mode === "create" ? `Créer le ${terme}` : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
