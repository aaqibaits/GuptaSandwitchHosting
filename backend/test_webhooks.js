const { Pool } = require('pg');
const http = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const dbConfig = {
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432
};

const pool = new Pool(dbConfig);

const makeRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: JSON.parse(body || '{}')
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

async function run() {
  console.log("Database config:", {
    database: dbConfig.database,
    user: dbConfig.user,
    host: dbConfig.host,
    port: dbConfig.port
  });

  try {
    // 1. Get info from the database
    const outletsRes = await pool.query("SELECT id, name FROM outlets LIMIT 3");
    console.log("\n--- Active Outlets ---");
    console.table(outletsRes.rows);

    const dishesRes = await pool.query("SELECT id, name, swiggy_price, zomato_price, dine_price FROM dishes LIMIT 3");
    console.log("\n--- Sample Dishes ---");
    console.table(dishesRes.rows);

    if (outletsRes.rows.length === 0) {
      console.log("No outlets found in database. Inserting a mock outlet for testing...");
      await pool.query("INSERT INTO outlets (name, address, phone, status) VALUES ('Test Outlet', 'Test Address', '1234567890', 'active')");
    }

    if (dishesRes.rows.length === 0) {
      console.log("No dishes found in database. Inserting a mock dish for testing...");
      await pool.query("INSERT INTO dishes (name, swiggy_price, zomato_price, dine_price) VALUES ('Mock Sandwich', 120, 130, 100)");
    }

    // Refresh outlet & dish lists
    const outlet = (await pool.query("SELECT id, name FROM outlets LIMIT 1")).rows[0];
    const dish = (await pool.query("SELECT id, name, swiggy_price, zomato_price, dine_price FROM dishes LIMIT 1")).rows[0];

    console.log(`\nUsing Outlet ID/Name: ${outlet.id} (${outlet.name})`);
    console.log(`Using Dish: ${dish.name} (Swiggy Price: ${dish.swiggy_price}, Zomato Price: ${dish.zomato_price})`);

    // 2. Test Swiggy Webhook
    console.log("\n=== Testing Swiggy Webhook ===");
    const swiggyPayload = {
      restaurant_id: outlet.id,
      order_id: `SW-${Date.now()}`,
      customer: {
        name: "Test Swiggy Customer",
        phone: "9876543210",
        email: "swiggy@test.com",
        delivery_address: "123 Swiggy Lane, Foodville"
      },
      cart: [
        {
          dish_name: dish.name,
          quantity: 2
        },
        {
          dish_name: "Non-existent Dish (Fallback Test)",
          quantity: 1
        }
      ],
      subtotal: 0, // let controller calculate or fallback
      discount: 20,
      gst: 15,
      total: 0 // let controller calculate
    };

    const swiggyOpts = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/integration/swiggy/order',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DYNO_ACCESS_KEY}`
      }
    };


    const swiggyRes = await makeRequest(swiggyOpts, swiggyPayload);
    console.log("Response Status:", swiggyRes.statusCode);
    console.log("Response Body:", JSON.stringify(swiggyRes.body, null, 2));

    // 3. Test Zomato Webhook
    console.log("\n=== Testing Zomato Webhook ===");
    const zomatoPayload = {
      res_id: outlet.id,
      customer_info: {
        name: "Test Zomato Customer",
        phone: "9123456789",
        address: "456 Zomato Street, FoodCity"
      },
      order_details: {
        zomato_order_id: `ZOM-${Date.now()}`,
        bill_amount: 0, // let controller calculate
        discount_amount: 10,
        subtotal: 0, // let controller calculate
        gst: 8,
        items: [
          {
            item_name: dish.name,
            qty: 1
          },
          {
            item_name: "Unknown Zomato Dish (Fallback Test)",
            qty: 3
          }
        ]
      }
    };

    const zomatoOpts = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/integration/zomato/order',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DYNO_ACCESS_KEY}`
      }
    };


    const zomatoRes = await makeRequest(zomatoOpts, zomatoPayload);
    console.log("Response Status:", zomatoRes.statusCode);
    console.log("Response Body:", JSON.stringify(zomatoRes.body, null, 2));

    // 4. Verify database updates
    console.log("\n=== Verifying DB Records ===");
    const recentOrders = await pool.query(`
      SELECT id, order_number, outlet_id, order_type, customer_name, total_amount, platform_order_id
      FROM orders
      ORDER BY id DESC LIMIT 5
    `);
    console.log("\n--- Latest 5 Orders in DB ---");
    console.table(recentOrders.rows);

    const latestOrderId = recentOrders.rows[0]?.id;
    if (latestOrderId) {
      const items = await pool.query(`
        SELECT oi.id, oi.dish_id, d.name AS dish_name, oi.quantity, oi.unit_price, oi.total_price
        FROM order_items oi
        JOIN dishes d ON oi.dish_id = d.id
        WHERE oi.order_id = $1
      `, [latestOrderId]);
      console.log(`\n--- Order Items for Order ID ${latestOrderId} ---`);
      console.table(items.rows);

      const kots = await pool.query(`
        SELECT id, kot_number, order_id, status
        FROM kot
        WHERE order_id = $1
      `, [latestOrderId]);
      console.log(`\n--- KOT for Order ID ${latestOrderId} ---`);
      console.table(kots.rows);

      if (kots.rows[0]) {
        const kotItems = await pool.query(`
          SELECT id, dish_name, quantity
          FROM kot_items
          WHERE kot_id = $1
        `, [kots.rows[0].id]);
        console.log(`\n--- KOT Items for KOT ID ${kots.rows[0].id} ---`);
        console.table(kotItems.rows);
      }
    }

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await pool.end();
  }
}

run();
