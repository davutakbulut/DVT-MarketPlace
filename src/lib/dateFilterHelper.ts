/**
 * Universal Date Filter Helper for Supabase PostgreSQL Queries
 */

export function buildDateConditions(
  searchParams: URLSearchParams,
  dateColumn: string = 'o.order_date',
  startParamIndex: number = 1
): { whereClause: string; params: any[]; nextIndex: number } {
  const period = searchParams.get('period');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let conditions: string[] = [];
  let params: any[] = [];
  let idx = startParamIndex;

  // Custom Start & End Date
  if (startDate && endDate) {
    conditions.push(`${dateColumn} >= $${idx}::timestamp AND ${dateColumn} <= ($${idx + 1}::date + TIME '23:59:59')`);
    params.push(startDate, endDate);
    idx += 2;
    return { whereClause: conditions.join(' AND '), params, nextIndex: idx };
  } else if (startDate) {
    conditions.push(`${dateColumn} >= $${idx}::timestamp`);
    params.push(startDate);
    idx++;
    return { whereClause: conditions.join(' AND '), params, nextIndex: idx };
  } else if (endDate) {
    conditions.push(`${dateColumn} <= ($${idx}::date + TIME '23:59:59')`);
    params.push(endDate);
    idx++;
    return { whereClause: conditions.join(' AND '), params, nextIndex: idx };
  }

  // Presets
  if (period) {
    if (period === '2026-05' || period === '2026-06' || period === '2026-07' || period === '2026-08') {
      conditions.push(`TO_CHAR(${dateColumn}, 'YYYY-MM') = $${idx}`);
      params.push(period);
      idx++;
    } else if (period === 'today' || period === 'bugun') {
      conditions.push(`DATE(${dateColumn}) = '2026-08-26'`);
    } else if (period === 'yesterday' || period === 'dun') {
      conditions.push(`DATE(${dateColumn}) = '2026-08-25'`);
    } else if (period === 'thisWeek' || period === 'buHafta') {
      conditions.push(`${dateColumn} >= '2026-08-19 00:00:00' AND ${dateColumn} <= '2026-08-26 23:59:59'`);
    } else if (period === 'thisMonth' || period === 'buAy') {
      conditions.push(`TO_CHAR(${dateColumn}, 'YYYY-MM') = '2026-08'`);
    } else if (period === 'lastMonth' || period === 'gecenAy') {
      conditions.push(`TO_CHAR(${dateColumn}, 'YYYY-MM') = '2026-07'`);
    } else if (period === 'last30') {
      conditions.push(`${dateColumn} >= '2026-07-27 00:00:00' AND ${dateColumn} <= '2026-08-26 23:59:59'`);
    } else if (period === 'last60') {
      conditions.push(`${dateColumn} >= '2026-06-27 00:00:00' AND ${dateColumn} <= '2026-08-26 23:59:59'`);
    } else if (period === 'last90') {
      conditions.push(`${dateColumn} >= '2026-05-27 00:00:00' AND ${dateColumn} <= '2026-08-26 23:59:59'`);
    }
  }

  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  return { whereClause, params, nextIndex: idx };
}
