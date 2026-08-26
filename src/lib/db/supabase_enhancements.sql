-- ====================================================================
-- DVT-MarketPlace: Supabase Native Enhancements & High-Speed Triggers
-- 1. Status Transition & Audit Trigger
-- 2. Atomic Daily Financial Rollup Trigger
-- 3. Automatic Negative Profit / Anomaly Alert Trigger
-- 4. Order Item Product Auto-Linking Trigger
-- 5. Enable Realtime Publications
-- ====================================================================

-- 1. STATUS TRANSITION & AUDIT TRIGGER
CREATE OR REPLACE FUNCTION fn_orders_auto_status_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_history jsonb;
  v_new_entry jsonb;
BEGIN
  -- Set transition timestamps
  IF NEW.status = 'Delivered' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'Delivered') THEN
    NEW.delivered_date := COALESCE(NEW.delivered_date, NOW());
  ELSIF NEW.status = 'Shipped' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'Shipped') THEN
    NEW.dispatched_date := COALESCE(NEW.dispatched_date, NOW());
  ELSIF NEW.status = 'Cancelled' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'Cancelled') THEN
    NEW.cancellation_date := COALESCE(NEW.cancellation_date, NOW());
  ELSIF (NEW.status = 'Returned' OR NEW.status = 'UnDeliveredAndReturned') AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.return_date := COALESCE(NEW.return_date, NOW());
  END IF;

  -- Append to status_history in raw_metadata if status changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_history := COALESCE(NEW.raw_metadata->'status_history', '[]'::jsonb);
    IF jsonb_typeof(v_history) != 'array' THEN
      v_history := '[]'::jsonb;
    END IF;

    v_new_entry := jsonb_build_object(
      'from', OLD.status,
      'to', NEW.status,
      'at', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'tracking', NEW.tracking_code
    );

    NEW.raw_metadata := jsonb_set(
      COALESCE(NEW.raw_metadata, '{}'::jsonb),
      '{status_history}',
      v_history || v_new_entry
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_auto_status_audit ON orders;
CREATE TRIGGER trg_orders_auto_status_audit
BEFORE INSERT OR UPDATE OF status, tracking_code ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_orders_auto_status_audit();


-- 2. ATOMIC DAILY FINANCIAL ROLLUP TRIGGER
CREATE OR REPLACE FUNCTION fn_orders_auto_daily_rollup()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id uuid;
  v_company_id uuid;
  v_rollup_date date;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_store_id := OLD.store_id;
    v_company_id := OLD.company_id;
    v_rollup_date := OLD.order_date::date;
  ELSE
    v_store_id := NEW.store_id;
    v_company_id := NEW.company_id;
    v_rollup_date := NEW.order_date::date;
  END IF;

  IF v_store_id IS NOT NULL AND v_rollup_date IS NOT NULL THEN
    INSERT INTO daily_financial_rollups (
      company_id, store_id, rollup_date, total_orders, total_items_sold,
      total_gross_revenue, total_cogs, total_commission, total_shipping_cost,
      total_service_fee, total_withholding, total_net_vat, total_extra_costs,
      total_net_profit, missing_cost_items_count, updated_at
    )
    SELECT 
      v_company_id,
      v_store_id,
      v_rollup_date,
      COUNT(o.id) as total_orders,
      COALESCE(SUM(oi.quantity), 0) as total_items_sold,
      COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.paid_amount END), 0) as total_gross_revenue,
      COALESCE(SUM(o.total_cost), 0) as total_cogs,
      COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.total_commission END), 0) as total_commission,
      COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.total_shipping_cost END), 0) as total_shipping_cost,
      COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.service_fee END), 0) as total_service_fee,
      COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.withholding_tax END), 0) as total_withholding,
      COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.net_vat END), 0) as total_net_vat,
      COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.extra_cost END), 0) as total_extra_costs,
      COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.net_profit END), 0) as total_net_profit,
      COALESCE(SUM(CASE WHEN o.has_missing_cost THEN 1 ELSE 0 END), 0) as missing_cost_items_count,
      NOW() as updated_at
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.store_id = v_store_id AND o.order_date::date = v_rollup_date
    GROUP BY o.company_id, o.store_id, o.order_date::date
    ON CONFLICT (store_id, rollup_date) DO UPDATE SET
      total_orders = EXCLUDED.total_orders,
      total_items_sold = EXCLUDED.total_items_sold,
      total_gross_revenue = EXCLUDED.total_gross_revenue,
      total_cogs = EXCLUDED.total_cogs,
      total_commission = EXCLUDED.total_commission,
      total_shipping_cost = EXCLUDED.total_shipping_cost,
      total_service_fee = EXCLUDED.total_service_fee,
      total_withholding = EXCLUDED.total_withholding,
      total_net_vat = EXCLUDED.total_net_vat,
      total_extra_costs = EXCLUDED.total_extra_costs,
      total_net_profit = EXCLUDED.total_net_profit,
      missing_cost_items_count = EXCLUDED.missing_cost_items_count,
      updated_at = NOW();
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_auto_daily_rollup ON orders;
CREATE TRIGGER trg_orders_auto_daily_rollup
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_orders_auto_daily_rollup();


-- 3. AUTOMATIC NEGATIVE PROFIT / ANOMALY ALERT TRIGGER
CREATE OR REPLACE FUNCTION fn_orders_anomaly_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.net_profit < 0 AND NEW.status != 'Cancelled' THEN
    INSERT INTO system_notifications (
      company_id, title, message, type, category, action_url, is_read, created_at
    )
    SELECT 
      NEW.company_id,
      '⚠️ Zararına Satış Tespit Edildi',
      format('Sipariş #%s için net zarar: -₺%s (Müşteri: %s, Tutar: ₺%s)', 
             NEW.marketplace_order_number, 
             ABS(ROUND(NEW.net_profit, 2)), 
             COALESCE(NEW.customer_name, 'Müşteri'), 
             ROUND(NEW.paid_amount, 2)),
      'warning',
      'order_anomaly',
      '/live-analysis',
      false,
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM system_notifications 
      WHERE message LIKE format('%%%s%%', NEW.marketplace_order_number) 
        AND created_at > NOW() - INTERVAL '1 day'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_anomaly_alert ON orders;
CREATE TRIGGER trg_orders_anomaly_alert
AFTER INSERT OR UPDATE OF net_profit, status ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_orders_anomaly_alert();


-- 4. ORDER ITEM PRODUCT AUTO-LINKING TRIGGER
CREATE OR REPLACE FUNCTION fn_order_items_product_autolink()
RETURNS TRIGGER AS $$
DECLARE
  v_prod_id uuid;
  v_store_id uuid;
BEGIN
  IF NEW.product_id IS NULL AND NEW.barcode IS NOT NULL AND NEW.barcode != 'NO_BARCODE' THEN
    SELECT o.store_id INTO v_store_id FROM orders o WHERE o.id = NEW.order_id LIMIT 1;
    IF v_store_id IS NOT NULL THEN
      SELECT p.id INTO v_prod_id FROM products p WHERE p.store_id = v_store_id AND p.barcode = NEW.barcode LIMIT 1;
      IF v_prod_id IS NOT NULL THEN
        NEW.product_id := v_prod_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_items_product_autolink ON order_items;
CREATE TRIGGER trg_order_items_product_autolink
BEFORE INSERT OR UPDATE OF barcode, product_id ON order_items
FOR EACH ROW
EXECUTE FUNCTION fn_order_items_product_autolink();


-- 5. ENABLE SUPABASE REALTIME REPLICATION
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_financial_rollups;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE system_notifications;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
