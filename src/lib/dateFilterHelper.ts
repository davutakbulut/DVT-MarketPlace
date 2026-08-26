/**
 * Universal Date Filter Helper for Supabase / PostgreSQL Queries
 * Ensures exact boundary filtering for days:
 * Start of day: 00:00:01
 * End of day: 23:59:59.999
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

  // Custom Start & End Date (or standard range from useDateStore)
  if (startDate && endDate) {
    conditions.push(
      `${dateColumn} >= ($${idx} || ' 00:00:01')::timestamptz AND ${dateColumn} <= ($${idx + 1} || ' 23:59:59.999')::timestamptz`
    );
    params.push(startDate.trim().slice(0, 10), endDate.trim().slice(0, 10));
    idx += 2;
    return { whereClause: conditions.join(' AND '), params, nextIndex: idx };
  } else if (startDate) {
    conditions.push(`${dateColumn} >= ($${idx} || ' 00:00:01')::timestamptz`);
    params.push(startDate.trim().slice(0, 10));
    idx++;
    return { whereClause: conditions.join(' AND '), params, nextIndex: idx };
  } else if (endDate) {
    conditions.push(`${dateColumn} <= ($${idx} || ' 23:59:59.999')::timestamptz`);
    params.push(endDate.trim().slice(0, 10));
    idx++;
    return { whereClause: conditions.join(' AND '), params, nextIndex: idx };
  }

  // Presets Fallback when exact dates are not passed
  if (period) {
    if (period === 'today' || period === 'bugun') {
      conditions.push(
        `${dateColumn} >= (CURRENT_DATE || ' 00:00:01')::timestamptz AND ${dateColumn} <= (CURRENT_DATE || ' 23:59:59.999')::timestamptz`
      );
    } else if (period === 'yesterday' || period === 'dun') {
      conditions.push(
        `${dateColumn} >= ((CURRENT_DATE - INTERVAL '1 day')::date || ' 00:00:01')::timestamptz AND ${dateColumn} <= ((CURRENT_DATE - INTERVAL '1 day')::date || ' 23:59:59.999')::timestamptz`
      );
    } else if (period === 'last_7_days' || period === 'thisWeek' || period === 'buHafta') {
      conditions.push(
        `${dateColumn} >= ((CURRENT_DATE - INTERVAL '6 days')::date || ' 00:00:01')::timestamptz AND ${dateColumn} <= (CURRENT_DATE || ' 23:59:59.999')::timestamptz`
      );
    } else if (period === 'last_15_days') {
      conditions.push(
        `${dateColumn} >= ((CURRENT_DATE - INTERVAL '14 days')::date || ' 00:00:01')::timestamptz AND ${dateColumn} <= (CURRENT_DATE || ' 23:59:59.999')::timestamptz`
      );
    } else if (period === 'last_30_days' || period === 'last30') {
      conditions.push(
        `${dateColumn} >= ((CURRENT_DATE - INTERVAL '29 days')::date || ' 00:00:01')::timestamptz AND ${dateColumn} <= (CURRENT_DATE || ' 23:59:59.999')::timestamptz`
      );
    } else if (period === 'this_month' || period === 'thisMonth' || period === 'buAy') {
      conditions.push(
        `${dateColumn} >= (DATE_TRUNC('month', CURRENT_DATE)::date || ' 00:00:01')::timestamptz AND ${dateColumn} <= ((DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date || ' 23:59:59.999')::timestamptz`
      );
    } else if (period === 'last_month' || period === 'lastMonth' || period === 'gecenAy') {
      conditions.push(
        `${dateColumn} >= ((DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::date || ' 00:00:01')::timestamptz AND ${dateColumn} <= ((DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::date || ' 23:59:59.999')::timestamptz`
      );
    } else if (period.startsWith('2026-') || period.startsWith('2025-')) {
      conditions.push(`TO_CHAR(${dateColumn}, 'YYYY-MM') = $${idx}`);
      params.push(period);
      idx++;
    }
  }

  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  return { whereClause, params, nextIndex: idx };
}
