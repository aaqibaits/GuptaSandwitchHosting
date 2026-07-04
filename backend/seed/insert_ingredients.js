const { pool } = require('../config/database');

const sql = `
-- Drop constraint if exists to make script idempotent
ALTER TABLE public.ingredients
  DROP CONSTRAINT IF EXISTS ingredients_unit_check;

-- CHANGE 1: Fix the default value of 'unit' column
ALTER TABLE public.ingredients
  ALTER COLUMN unit SET DEFAULT 'kg';

-- CHANGE 2: Add CHECK constraint to restrict unit column
ALTER TABLE public.ingredients
  ADD CONSTRAINT ingredients_unit_check
  CHECK (unit IN ('litre', 'kg', 'pack'));

-- CHANGE 3: Add unit_cost column to inventory_transactions
ALTER TABLE public.inventory_transactions 
  ADD COLUMN IF NOT EXISTS unit_cost numeric(10,4) DEFAULT 0;

-- CHANGE 4: Populate unit_cost for existing transactions
UPDATE public.inventory_transactions it
  SET unit_cost = i.cost_per_unit
  FROM public.ingredients i
  WHERE i.id = it.ingredient_id;

-- CHANGE 5: Update trigger function to record ingredient price at time of sale
CREATE OR REPLACE FUNCTION public.update_inventory_on_order_completion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.order_status = 'completed' AND OLD.order_status != 'completed' THEN
        -- Insert inventory usage records with live cost snapshots
        INSERT INTO inventory_transactions (outlet_id, ingredient_id, transaction_type, quantity, reference_id, created_by, unit_cost)
        SELECT 
            NEW.outlet_id,
            di.ingredient_id,
            'usage',
            (oi.quantity * di.quantity_required * (1 + di.wastage_percent/100)),
            NEW.order_number,
            NEW.created_by,
            i.cost_per_unit
        FROM order_items oi
        JOIN dish_ingredients di ON oi.dish_id = di.dish_id
        JOIN ingredients i ON i.id = di.ingredient_id
        WHERE oi.order_id = NEW.id;
        
        -- Update current stock in ingredients table
        UPDATE ingredients i
        SET current_stock = current_stock - sub.total_used
        FROM (
            SELECT 
                di.ingredient_id,
                SUM(oi.quantity * di.quantity_required * (1 + di.wastage_percent/100)) as total_used
            FROM order_items oi
            JOIN dish_ingredients di ON oi.dish_id = di.dish_id
            WHERE oi.order_id = NEW.id
            GROUP BY di.ingredient_id
        ) sub
        WHERE i.id = sub.ingredient_id;
    END IF;
    RETURN NEW;
END;
$$;

-- CHANGE 6: Add is_deleted column to ingredients for soft-deletion support
ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
`;

async function seed() {
  console.log('Starting DB seeding for ingredients module...');
  try {
    await pool.query(sql);
    console.log('🌱 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error executing seed queries:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Database pool connection closed.');
  }
}

seed();
