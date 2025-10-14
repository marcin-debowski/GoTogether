export function slugify(input: string): string {
  return (
    String(input)
      // normalizacja i usunięcie diakrytyków
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      // na małe litery
      .toLowerCase()
      // wszystko poza literami/cyframi zamień na myślnik
      .replace(/[^a-z0-9]+/g, "-")
      // usuń wielokrotne myślniki
      .replace(/-+/g, "-")
      // obetnij myślniki z końców
      .replace(/^-|-$/g, "")
  );
}
