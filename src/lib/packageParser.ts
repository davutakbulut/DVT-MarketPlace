/**
 * Intelligent package quantity / item count extractor for Turkish marketplace product titles.
 * Examples:
 * - "100 Ad./Pkt." -> 100
 * - "20 Ad./Kt." -> 20
 * - "(50 Adet)" -> 50
 * - "10 Adet" -> 10
 * - "4'lü Paket" -> 4
 * - "2 li Set" -> 2
 * - "5 Paket" -> 5
 * - Fallback -> 1
 */
export function extractPackageQuantity(title?: string | null): number {
  if (!title || typeof title !== 'string') return 1;
  const clean = title.trim();

  // Pattern 1: Explicit Ad./Pkt, Adet/Pkt, Ad./Kt, 100 Adet, etc.
  const adPktMatch = clean.match(/(\d+)\s*(?:ad\.\/pkt|ad\.\/kt|adet\/pkt|adet\/paket|ad\/pkt|ad\/kt|adet|ad\b|pcs\b|pieces\b)/i);
  if (adPktMatch) {
    const val = parseInt(adPktMatch[1], 10);
    if (val > 0) return val;
  }

  // Pattern 2: Parentheses count like (50 ADET), (100 PKT), (2 Lİ)
  const parenMatch = clean.match(/\(\s*(\d+)\s*(?:adet|ad|pkt|paket|parça|li|lı|lu|lü)?\s*\)/i);
  if (parenMatch) {
    const val = parseInt(parenMatch[1], 10);
    if (val > 0) return val;
  }

  // Pattern 3: X-li / X-lı / X-lu / X-lü (e.g., 2'li, 4 lü, 10'lu Set, 5'li Paket)
  const liMatch = clean.match(/(\d+)\s*['`"’]?\s*(?:li|lı|lu|lü)\b/i);
  if (liMatch) {
    const val = parseInt(liMatch[1], 10);
    if (val > 0) return val;
  }

  // Pattern 4: X Paket / X Kutu / X Pkt
  const pktMatch = clean.match(/(\d+)\s*(?:paket|pkt|kutu)\b/i);
  if (pktMatch) {
    const val = parseInt(pktMatch[1], 10);
    if (val > 0) return val;
  }

  // Pattern 5: X Parça / Parçalı
  const parcaMatch = clean.match(/(\d+)\s*(?:parça|parca)\b/i);
  if (parcaMatch) {
    const val = parseInt(parcaMatch[1], 10);
    if (val > 0) return val;
  }

  return 1;
}
