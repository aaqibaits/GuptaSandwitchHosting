--
-- PostgreSQL database dump
--

\restrict H1fwRprblfq8Zx0zqa7O6KTB1bXD6oXzboiIfXCKH4tBqCXSz2HcC27tjZVjJZ4

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.1

-- Started on 2026-05-25 14:54:14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 17224)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5400 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 951 (class 1247 OID 17364)
-- Name: admin_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.admin_role_enum AS ENUM (
    'SUPER_ADMIN',
    'ADMIN'
);


ALTER TYPE public.admin_role_enum OWNER TO postgres;

--
-- TOC entry 915 (class 1247 OID 17252)
-- Name: app_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.app_role_enum AS ENUM (
    'Admin',
    'Staff'
);


ALTER TYPE public.app_role_enum OWNER TO postgres;

--
-- TOC entry 933 (class 1247 OID 17312)
-- Name: discount_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.discount_type_enum AS ENUM (
    'percentage',
    'fixed'
);


ALTER TYPE public.discount_type_enum OWNER TO postgres;

--
-- TOC entry 942 (class 1247 OID 17338)
-- Name: inventory_transaction_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inventory_transaction_type_enum AS ENUM (
    'purchase',
    'usage',
    'waste',
    'adjustment'
);


ALTER TYPE public.inventory_transaction_type_enum OWNER TO postgres;

--
-- TOC entry 930 (class 1247 OID 17300)
-- Name: kot_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.kot_status_enum AS ENUM (
    'pending',
    'preparing',
    'ready',
    'served',
    'cancelled'
);


ALTER TYPE public.kot_status_enum OWNER TO postgres;

--
-- TOC entry 939 (class 1247 OID 17328)
-- Name: ledger_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ledger_status_enum AS ENUM (
    'paid',
    'pending',
    'due',
    'overdue'
);


ALTER TYPE public.ledger_status_enum OWNER TO postgres;

--
-- TOC entry 948 (class 1247 OID 17354)
-- Name: notification_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type_enum AS ENUM (
    'order',
    'kot',
    'inventory',
    'system'
);


ALTER TYPE public.notification_type_enum OWNER TO postgres;

--
-- TOC entry 927 (class 1247 OID 17288)
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status_enum AS ENUM (
    'pending',
    'preparing',
    'ready',
    'completed',
    'cancelled'
);


ALTER TYPE public.order_status_enum OWNER TO postgres;

--
-- TOC entry 918 (class 1247 OID 17258)
-- Name: order_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_type_enum AS ENUM (
    'dine',
    'parcel',
    'swiggy',
    'zomato'
);


ALTER TYPE public.order_type_enum OWNER TO postgres;

--
-- TOC entry 921 (class 1247 OID 17268)
-- Name: payment_method_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method_enum AS ENUM (
    'cash',
    'upi',
    'card',
    'wallet',
    'online'
);


ALTER TYPE public.payment_method_enum OWNER TO postgres;

--
-- TOC entry 924 (class 1247 OID 17280)
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'pending',
    'paid',
    'refunded'
);


ALTER TYPE public.payment_status_enum OWNER TO postgres;

--
-- TOC entry 945 (class 1247 OID 17348)
-- Name: platform_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.platform_enum AS ENUM (
    'swiggy',
    'zomato'
);


ALTER TYPE public.platform_enum OWNER TO postgres;

--
-- TOC entry 909 (class 1247 OID 17236)
-- Name: status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_enum AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.status_enum OWNER TO postgres;

--
-- TOC entry 936 (class 1247 OID 17318)
-- Name: transaction_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transaction_type_enum AS ENUM (
    'sale',
    'refund',
    'expense',
    'purchase'
);


ALTER TYPE public.transaction_type_enum OWNER TO postgres;

--
-- TOC entry 912 (class 1247 OID 17242)
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role_enum AS ENUM (
    'Manager',
    'Cashier',
    'Kitchen Staff',
    'Custom'
);


ALTER TYPE public.user_role_enum OWNER TO postgres;

--
-- TOC entry 275 (class 1255 OID 18016)
-- Name: calculate_order_total(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_order_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.total_amount = NEW.subtotal - NEW.discount_amount + NEW.packing_charge + NEW.delivery_charge + NEW.service_charge + NEW.gst_amount;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.calculate_order_total() OWNER TO postgres;

--
-- TOC entry 276 (class 1255 OID 18018)
-- Name: update_inventory_on_order_completion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_inventory_on_order_completion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.order_status = 'completed' AND OLD.order_status != 'completed' THEN
        -- Insert inventory usage records for each item in the order
        INSERT INTO inventory_transactions (outlet_id, ingredient_id, transaction_type, quantity, reference_id, created_by)
        SELECT 
            NEW.outlet_id,
            di.ingredient_id,
            'usage',
            (oi.quantity * di.quantity_required * (1 + di.wastage_percent/100)),
            NEW.order_number,
            NEW.created_by
        FROM order_items oi
        JOIN dish_ingredients di ON oi.dish_id = di.dish_id
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


ALTER FUNCTION public.update_inventory_on_order_completion() OWNER TO postgres;

--
-- TOC entry 274 (class 1255 OID 18007)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 248 (class 1259 OID 17806)
-- Name: accounting_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounting_ledger (
    id integer NOT NULL,
    transaction_id character varying(50) NOT NULL,
    order_id integer,
    outlet_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    transaction_type public.transaction_type_enum NOT NULL,
    payment_date date,
    bill_uploaded boolean DEFAULT false,
    bill_url character varying(500),
    status public.ledger_status_enum DEFAULT 'pending'::public.ledger_status_enum,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.accounting_ledger OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 17805)
-- Name: accounting_ledger_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accounting_ledger_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounting_ledger_id_seq OWNER TO postgres;

--
-- TOC entry 5401 (class 0 OID 0)
-- Dependencies: 247
-- Name: accounting_ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounting_ledger_id_seq OWNED BY public.accounting_ledger.id;


--
-- TOC entry 258 (class 1259 OID 17946)
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    outlet_id integer,
    admin_id integer,
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 17945)
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5402 (class 0 OID 0)
-- Dependencies: 257
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- TOC entry 221 (class 1259 OID 17370)
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone character varying(20),
    role public.admin_role_enum DEFAULT 'ADMIN'::public.admin_role_enum NOT NULL,
    is_super_admin boolean DEFAULT false,
    permissions jsonb DEFAULT '{"all": true}'::jsonb,
    status public.status_enum DEFAULT 'active'::public.status_enum,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17369)
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_id_seq OWNER TO postgres;

--
-- TOC entry 5403 (class 0 OID 0)
-- Dependencies: 220
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- TOC entry 229 (class 1259 OID 17484)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    name character varying(100) NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17483)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- TOC entry 5404 (class 0 OID 0)
-- Dependencies: 228
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 240 (class 1259 OID 17658)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    order_number character varying(50) NOT NULL,
    outlet_id integer NOT NULL,
    order_type public.order_type_enum NOT NULL,
    table_number character varying(10),
    customer_name character varying(100),
    customer_phone character varying(20),
    customer_email character varying(100),
    delivery_address text,
    special_instructions text,
    subtotal numeric(10,2) NOT NULL,
    discount_type public.discount_type_enum DEFAULT 'percentage'::public.discount_type_enum,
    discount_value numeric(10,2) DEFAULT 0,
    discount_amount numeric(10,2) DEFAULT 0,
    packing_charge numeric(10,2) DEFAULT 0,
    delivery_charge numeric(10,2) DEFAULT 0,
    service_charge numeric(10,2) DEFAULT 0,
    gst_amount numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2) NOT NULL,
    payment_method public.payment_method_enum DEFAULT 'cash'::public.payment_method_enum,
    payment_status public.payment_status_enum DEFAULT 'pending'::public.payment_status_enum,
    order_status public.order_status_enum DEFAULT 'pending'::public.order_status_enum,
    platform_order_id character varying(100),
    order_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    delivery_time timestamp without time zone,
    payment_time timestamp without time zone,
    created_by integer,
    kot_sent boolean DEFAULT false,
    kot_sent_time timestamp without time zone,
    completed_time timestamp without time zone,
    CONSTRAINT orders_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT orders_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17398)
-- Name: outlets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.outlets (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    name character varying(100) NOT NULL,
    address text NOT NULL,
    phone character varying(20) NOT NULL,
    manager character varying(100) NOT NULL,
    email character varying(100),
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    status public.status_enum DEFAULT 'active'::public.status_enum,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.outlets OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 18020)
-- Name: daily_sales_report; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.daily_sales_report AS
 SELECT date(o.order_time) AS sale_date,
    o.outlet_id,
    "out".name AS outlet_name,
    count(DISTINCT o.id) AS total_orders,
    sum(o.total_amount) AS total_revenue,
    sum(
        CASE
            WHEN (o.order_type = ANY (ARRAY['swiggy'::public.order_type_enum, 'zomato'::public.order_type_enum])) THEN o.total_amount
            ELSE (0)::numeric
        END) AS online_revenue,
    sum(
        CASE
            WHEN (o.order_type = ANY (ARRAY['dine'::public.order_type_enum, 'parcel'::public.order_type_enum])) THEN o.total_amount
            ELSE (0)::numeric
        END) AS offline_revenue,
    sum(o.gst_amount) AS total_gst
   FROM (public.orders o
     JOIN public.outlets "out" ON ((o.outlet_id = "out".id)))
  WHERE (o.order_status = 'completed'::public.order_status_enum)
  GROUP BY (date(o.order_time)), o.outlet_id, "out".name;


ALTER VIEW public.daily_sales_report OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 17604)
-- Name: dish_ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dish_ingredients (
    dish_id integer NOT NULL,
    ingredient_id integer NOT NULL,
    quantity_required numeric(10,2) NOT NULL,
    wastage_percent numeric(5,2) DEFAULT 0,
    CONSTRAINT dish_ingredients_quantity_required_check CHECK ((quantity_required > (0)::numeric))
);


ALTER TABLE public.dish_ingredients OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 17544)
-- Name: dish_outlets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dish_outlets (
    dish_id integer NOT NULL,
    outlet_id integer NOT NULL,
    is_available boolean DEFAULT true,
    custom_price_dine numeric(10,2),
    custom_price_parcel numeric(10,2),
    custom_price_swiggy numeric(10,2),
    custom_price_zomato numeric(10,2),
    CONSTRAINT dish_outlets_custom_price_dine_check CHECK ((custom_price_dine >= (0)::numeric)),
    CONSTRAINT dish_outlets_custom_price_parcel_check CHECK ((custom_price_parcel >= (0)::numeric)),
    CONSTRAINT dish_outlets_custom_price_swiggy_check CHECK ((custom_price_swiggy >= (0)::numeric)),
    CONSTRAINT dish_outlets_custom_price_zomato_check CHECK ((custom_price_zomato >= (0)::numeric))
);


ALTER TABLE public.dish_outlets OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17509)
-- Name: dishes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dishes (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    name character varying(200) NOT NULL,
    category_id integer,
    cat character varying(100),
    dine_price numeric(10,2) NOT NULL,
    parcel_price numeric(10,2) NOT NULL,
    swiggy_price numeric(10,2),
    zomato_price numeric(10,2),
    ingredients text[],
    emoji character varying(10),
    veg boolean DEFAULT true,
    time_required character varying(50),
    is_available boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dishes_dine_price_check CHECK ((dine_price >= (0)::numeric)),
    CONSTRAINT dishes_parcel_price_check CHECK ((parcel_price >= (0)::numeric)),
    CONSTRAINT dishes_swiggy_price_check CHECK ((swiggy_price >= (0)::numeric)),
    CONSTRAINT dishes_zomato_price_check CHECK ((zomato_price >= (0)::numeric))
);


ALTER TABLE public.dishes OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17508)
-- Name: dishes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dishes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dishes_id_seq OWNER TO postgres;

--
-- TOC entry 5405 (class 0 OID 0)
-- Dependencies: 230
-- Name: dishes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dishes_id_seq OWNED BY public.dishes.id;


--
-- TOC entry 252 (class 1259 OID 17866)
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    outlet_id integer NOT NULL,
    expense_type character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    expense_date date NOT NULL,
    vendor_name character varying(200),
    bill_number character varying(100),
    bill_url character varying(500),
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expenses_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 17865)
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO postgres;

--
-- TOC entry 5406 (class 0 OID 0)
-- Dependencies: 251
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- TOC entry 235 (class 1259 OID 17581)
-- Name: ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingredients (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    name character varying(100) NOT NULL,
    unit character varying(20) DEFAULT 'grams'::character varying,
    cost_per_unit numeric(10,4) DEFAULT 0,
    current_stock numeric(10,2) DEFAULT 0,
    reorder_level numeric(10,2),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ingredients OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17580)
-- Name: ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingredients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredients_id_seq OWNER TO postgres;

--
-- TOC entry 5407 (class 0 OID 0)
-- Dependencies: 234
-- Name: ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredients_id_seq OWNED BY public.ingredients.id;


--
-- TOC entry 263 (class 1259 OID 18030)
-- Name: inventory_stock_status; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.inventory_stock_status AS
 SELECT id,
    name,
    unit,
    current_stock,
    reorder_level,
        CASE
            WHEN (current_stock <= reorder_level) THEN 'Low Stock'::text
            WHEN (current_stock <= (reorder_level * 1.5)) THEN 'Need Reorder'::text
            ELSE 'In Stock'::text
        END AS stock_status
   FROM public.ingredients i;


ALTER VIEW public.inventory_stock_status OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17625)
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_transactions (
    id integer NOT NULL,
    outlet_id integer NOT NULL,
    ingredient_id integer NOT NULL,
    transaction_type public.inventory_transaction_type_enum NOT NULL,
    quantity numeric(10,2) NOT NULL,
    notes text,
    reference_id character varying(100),
    transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


ALTER TABLE public.inventory_transactions OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17624)
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transactions_id_seq OWNER TO postgres;

--
-- TOC entry 5408 (class 0 OID 0)
-- Dependencies: 237
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- TOC entry 244 (class 1259 OID 17739)
-- Name: kot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kot (
    id integer NOT NULL,
    kot_number character varying(50) NOT NULL,
    order_id integer NOT NULL,
    outlet_id integer NOT NULL,
    table_number character varying(10),
    order_type public.order_type_enum NOT NULL,
    status public.kot_status_enum DEFAULT 'pending'::public.kot_status_enum,
    is_urgent boolean DEFAULT false,
    sent_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ready_time timestamp without time zone,
    served_time timestamp without time zone,
    created_by integer
);


ALTER TABLE public.kot OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 17738)
-- Name: kot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kot_id_seq OWNER TO postgres;

--
-- TOC entry 5409 (class 0 OID 0)
-- Dependencies: 243
-- Name: kot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kot_id_seq OWNED BY public.kot.id;


--
-- TOC entry 246 (class 1259 OID 17773)
-- Name: kot_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kot_items (
    id integer NOT NULL,
    kot_id integer NOT NULL,
    order_item_id integer NOT NULL,
    dish_name character varying(200) NOT NULL,
    quantity integer NOT NULL,
    is_ready boolean DEFAULT false,
    ready_time timestamp without time zone,
    CONSTRAINT kot_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.kot_items OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 17772)
-- Name: kot_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kot_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kot_items_id_seq OWNER TO postgres;

--
-- TOC entry 5410 (class 0 OID 0)
-- Dependencies: 245
-- Name: kot_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kot_items_id_seq OWNED BY public.kot_items.id;


--
-- TOC entry 262 (class 1259 OID 18025)
-- Name: kot_pending_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.kot_pending_summary AS
 SELECT k.outlet_id,
    "out".name AS outlet_name,
    count(
        CASE
            WHEN (k.status = 'pending'::public.kot_status_enum) THEN 1
            ELSE NULL::integer
        END) AS pending_count,
    count(
        CASE
            WHEN (k.status = 'preparing'::public.kot_status_enum) THEN 1
            ELSE NULL::integer
        END) AS preparing_count,
    count(
        CASE
            WHEN (k.status = 'ready'::public.kot_status_enum) THEN 1
            ELSE NULL::integer
        END) AS ready_count,
    count(k.id) AS total_active_kot
   FROM (public.kot k
     JOIN public.outlets "out" ON ((k.outlet_id = "out".id)))
  WHERE (k.status <> ALL (ARRAY['served'::public.kot_status_enum, 'cancelled'::public.kot_status_enum]))
  GROUP BY k.outlet_id, "out".name;


ALTER VIEW public.kot_pending_summary OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 17976)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    outlet_id integer,
    user_id integer,
    admin_id integer,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    type public.notification_type_enum DEFAULT 'system'::public.notification_type_enum,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 17975)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5411 (class 0 OID 0)
-- Dependencies: 259
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 242 (class 1259 OID 17706)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    dish_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    special_instructions text,
    is_ready boolean DEFAULT false,
    ready_time timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_total_price_check CHECK ((total_price >= (0)::numeric)),
    CONSTRAINT order_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 17705)
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- TOC entry 5412 (class 0 OID 0)
-- Dependencies: 241
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 239 (class 1259 OID 17657)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- TOC entry 5413 (class 0 OID 0)
-- Dependencies: 239
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 225 (class 1259 OID 17427)
-- Name: outlet_creation_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.outlet_creation_log (
    id integer NOT NULL,
    outlet_id integer NOT NULL,
    created_by integer NOT NULL,
    creation_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address inet,
    user_agent text,
    notes text
);


ALTER TABLE public.outlet_creation_log OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17426)
-- Name: outlet_creation_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.outlet_creation_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.outlet_creation_log_id_seq OWNER TO postgres;

--
-- TOC entry 5414 (class 0 OID 0)
-- Dependencies: 224
-- Name: outlet_creation_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.outlet_creation_log_id_seq OWNED BY public.outlet_creation_log.id;


--
-- TOC entry 222 (class 1259 OID 17397)
-- Name: outlets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.outlets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.outlets_id_seq OWNER TO postgres;

--
-- TOC entry 5415 (class 0 OID 0)
-- Dependencies: 222
-- Name: outlets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.outlets_id_seq OWNED BY public.outlets.id;


--
-- TOC entry 233 (class 1259 OID 17566)
-- Name: platform_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_availability (
    dish_id integer NOT NULL,
    platform public.platform_enum NOT NULL,
    is_available boolean DEFAULT true,
    platform_price numeric(10,2),
    CONSTRAINT platform_availability_platform_price_check CHECK ((platform_price >= (0)::numeric))
);


ALTER TABLE public.platform_availability OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 17838)
-- Name: sales_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_summary (
    id integer NOT NULL,
    outlet_id integer NOT NULL,
    summary_date date NOT NULL,
    total_revenue numeric(12,2) DEFAULT 0,
    total_orders integer DEFAULT 0,
    total_items_sold integer DEFAULT 0,
    offline_revenue numeric(12,2) DEFAULT 0,
    online_revenue numeric(12,2) DEFAULT 0,
    cash_revenue numeric(12,2) DEFAULT 0,
    digital_revenue numeric(12,2) DEFAULT 0,
    avg_order_value numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sales_summary OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 17837)
-- Name: sales_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_summary_id_seq OWNER TO postgres;

--
-- TOC entry 5416 (class 0 OID 0)
-- Dependencies: 249
-- Name: sales_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_summary_id_seq OWNED BY public.sales_summary.id;


--
-- TOC entry 256 (class 1259 OID 17922)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    outlet_id integer,
    token character varying(500),
    login_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    logout_time timestamp without time zone,
    ip_address inet,
    user_agent text
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 17921)
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessions_id_seq OWNER TO postgres;

--
-- TOC entry 5417 (class 0 OID 0)
-- Dependencies: 255
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- TOC entry 254 (class 1259 OID 17893)
-- Name: tax_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_records (
    id integer NOT NULL,
    outlet_id integer NOT NULL,
    order_id integer,
    taxable_value numeric(12,2) DEFAULT 0 NOT NULL,
    cgst_rate numeric(5,2) DEFAULT 9.00,
    cgst_amount numeric(10,2) DEFAULT 0,
    sgst_rate numeric(5,2) DEFAULT 9.00,
    sgst_amount numeric(10,2) DEFAULT 0,
    total_gst numeric(10,2) DEFAULT 0,
    tax_period date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tax_records OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 17892)
-- Name: tax_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tax_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tax_records_id_seq OWNER TO postgres;

--
-- TOC entry 5418 (class 0 OID 0)
-- Dependencies: 253
-- Name: tax_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tax_records_id_seq OWNED BY public.tax_records.id;


--
-- TOC entry 227 (class 1259 OID 17450)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    outlet_id integer,
    name character varying(100) NOT NULL,
    email character varying(100),
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role_label public.user_role_enum NOT NULL,
    app_role public.app_role_enum NOT NULL,
    permissions jsonb DEFAULT '{"admin": [], "staff": []}'::jsonb,
    status public.status_enum DEFAULT 'active'::public.status_enum,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17449)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5419 (class 0 OID 0)
-- Dependencies: 226
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4997 (class 2604 OID 17809)
-- Name: accounting_ledger id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger ALTER COLUMN id SET DEFAULT nextval('public.accounting_ledger_id_seq'::regclass);


--
-- TOC entry 5025 (class 2604 OID 17949)
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- TOC entry 4928 (class 2604 OID 17373)
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 17487)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4955 (class 2604 OID 17512)
-- Name: dishes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes ALTER COLUMN id SET DEFAULT nextval('public.dishes_id_seq'::regclass);


--
-- TOC entry 5013 (class 2604 OID 17869)
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- TOC entry 4963 (class 2604 OID 17584)
-- Name: ingredients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients ALTER COLUMN id SET DEFAULT nextval('public.ingredients_id_seq'::regclass);


--
-- TOC entry 4971 (class 2604 OID 17628)
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- TOC entry 4991 (class 2604 OID 17742)
-- Name: kot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot ALTER COLUMN id SET DEFAULT nextval('public.kot_id_seq'::regclass);


--
-- TOC entry 4995 (class 2604 OID 17776)
-- Name: kot_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items ALTER COLUMN id SET DEFAULT nextval('public.kot_items_id_seq'::regclass);


--
-- TOC entry 5027 (class 2604 OID 17979)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4987 (class 2604 OID 17709)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 4973 (class 2604 OID 17661)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 4941 (class 2604 OID 17430)
-- Name: outlet_creation_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log ALTER COLUMN id SET DEFAULT nextval('public.outlet_creation_log_id_seq'::regclass);


--
-- TOC entry 4936 (class 2604 OID 17401)
-- Name: outlets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets ALTER COLUMN id SET DEFAULT nextval('public.outlets_id_seq'::regclass);


--
-- TOC entry 5002 (class 2604 OID 17841)
-- Name: sales_summary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_summary ALTER COLUMN id SET DEFAULT nextval('public.sales_summary_id_seq'::regclass);


--
-- TOC entry 5023 (class 2604 OID 17925)
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- TOC entry 5015 (class 2604 OID 17896)
-- Name: tax_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records ALTER COLUMN id SET DEFAULT nextval('public.tax_records_id_seq'::regclass);


--
-- TOC entry 4943 (class 2604 OID 17453)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5382 (class 0 OID 17806)
-- Dependencies: 248
-- Data for Name: accounting_ledger; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounting_ledger (id, transaction_id, order_id, outlet_id, amount, transaction_type, payment_date, bill_uploaded, bill_url, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5392 (class 0 OID 17946)
-- Dependencies: 258
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, outlet_id, admin_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at) FROM stdin;
\.


--
-- TOC entry 5355 (class 0 OID 17370)
-- Dependencies: 221
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (id, uuid, name, email, username, password_hash, phone, role, is_super_admin, permissions, status, last_login, created_at, updated_at) FROM stdin;
2	fc7b2f89-9c5d-4558-9498-3a26252d98e2	System Super Admin	superadmin@guptasandwich.com	superadmin	$2a$10$N9qo8uLOickgx2ZMRZoMy.MrJjYqV7qJjZqV7qJjZqV7qJjZqV7q	\N	SUPER_ADMIN	t	{"all": true}	active	\N	2026-05-25 14:23:11.13301	2026-05-25 14:23:11.13301
\.


--
-- TOC entry 5363 (class 0 OID 17484)
-- Dependencies: 229
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, uuid, name, description, display_order, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5370 (class 0 OID 17604)
-- Dependencies: 236
-- Data for Name: dish_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dish_ingredients (dish_id, ingredient_id, quantity_required, wastage_percent) FROM stdin;
\.


--
-- TOC entry 5366 (class 0 OID 17544)
-- Dependencies: 232
-- Data for Name: dish_outlets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dish_outlets (dish_id, outlet_id, is_available, custom_price_dine, custom_price_parcel, custom_price_swiggy, custom_price_zomato) FROM stdin;
\.


--
-- TOC entry 5365 (class 0 OID 17509)
-- Dependencies: 231
-- Data for Name: dishes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dishes (id, uuid, name, category_id, cat, dine_price, parcel_price, swiggy_price, zomato_price, ingredients, emoji, veg, time_required, is_available, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5386 (class 0 OID 17866)
-- Dependencies: 252
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, outlet_id, expense_type, amount, expense_date, vendor_name, bill_number, bill_url, notes, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5369 (class 0 OID 17581)
-- Dependencies: 235
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredients (id, uuid, name, unit, cost_per_unit, current_stock, reorder_level, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5372 (class 0 OID 17625)
-- Dependencies: 238
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_transactions (id, outlet_id, ingredient_id, transaction_type, quantity, notes, reference_id, transaction_date, created_by) FROM stdin;
\.


--
-- TOC entry 5378 (class 0 OID 17739)
-- Dependencies: 244
-- Data for Name: kot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kot (id, kot_number, order_id, outlet_id, table_number, order_type, status, is_urgent, sent_time, ready_time, served_time, created_by) FROM stdin;
\.


--
-- TOC entry 5380 (class 0 OID 17773)
-- Dependencies: 246
-- Data for Name: kot_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kot_items (id, kot_id, order_item_id, dish_name, quantity, is_ready, ready_time) FROM stdin;
\.


--
-- TOC entry 5394 (class 0 OID 17976)
-- Dependencies: 260
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, outlet_id, user_id, admin_id, title, message, type, is_read, created_at, read_at) FROM stdin;
\.


--
-- TOC entry 5376 (class 0 OID 17706)
-- Dependencies: 242
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, dish_id, quantity, unit_price, total_price, special_instructions, is_ready, ready_time, created_at) FROM stdin;
\.


--
-- TOC entry 5374 (class 0 OID 17658)
-- Dependencies: 240
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, uuid, order_number, outlet_id, order_type, table_number, customer_name, customer_phone, customer_email, delivery_address, special_instructions, subtotal, discount_type, discount_value, discount_amount, packing_charge, delivery_charge, service_charge, gst_amount, total_amount, payment_method, payment_status, order_status, platform_order_id, order_time, delivery_time, payment_time, created_by, kot_sent, kot_sent_time, completed_time) FROM stdin;
\.


--
-- TOC entry 5359 (class 0 OID 17427)
-- Dependencies: 225
-- Data for Name: outlet_creation_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.outlet_creation_log (id, outlet_id, created_by, creation_date, ip_address, user_agent, notes) FROM stdin;
\.


--
-- TOC entry 5357 (class 0 OID 17398)
-- Dependencies: 223
-- Data for Name: outlets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.outlets (id, uuid, name, address, phone, manager, email, username, password_hash, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5367 (class 0 OID 17566)
-- Dependencies: 233
-- Data for Name: platform_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_availability (dish_id, platform, is_available, platform_price) FROM stdin;
\.


--
-- TOC entry 5384 (class 0 OID 17838)
-- Dependencies: 250
-- Data for Name: sales_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_summary (id, outlet_id, summary_date, total_revenue, total_orders, total_items_sold, offline_revenue, online_revenue, cash_revenue, digital_revenue, avg_order_value, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5390 (class 0 OID 17922)
-- Dependencies: 256
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, outlet_id, token, login_time, logout_time, ip_address, user_agent) FROM stdin;
\.


--
-- TOC entry 5388 (class 0 OID 17893)
-- Dependencies: 254
-- Data for Name: tax_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_records (id, outlet_id, order_id, taxable_value, cgst_rate, cgst_amount, sgst_rate, sgst_amount, total_gst, tax_period, created_at) FROM stdin;
\.


--
-- TOC entry 5361 (class 0 OID 17450)
-- Dependencies: 227
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, uuid, outlet_id, name, email, username, password_hash, role_label, app_role, permissions, status, created_at, updated_at, created_by) FROM stdin;
\.


--
-- TOC entry 5420 (class 0 OID 0)
-- Dependencies: 247
-- Name: accounting_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounting_ledger_id_seq', 1, false);


--
-- TOC entry 5421 (class 0 OID 0)
-- Dependencies: 257
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 1, false);


--
-- TOC entry 5422 (class 0 OID 0)
-- Dependencies: 220
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_id_seq', 2, true);


--
-- TOC entry 5423 (class 0 OID 0)
-- Dependencies: 228
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 17, true);


--
-- TOC entry 5424 (class 0 OID 0)
-- Dependencies: 230
-- Name: dishes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dishes_id_seq', 1, false);


--
-- TOC entry 5425 (class 0 OID 0)
-- Dependencies: 251
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- TOC entry 5426 (class 0 OID 0)
-- Dependencies: 234
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 1, false);


--
-- TOC entry 5427 (class 0 OID 0)
-- Dependencies: 237
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 1, false);


--
-- TOC entry 5428 (class 0 OID 0)
-- Dependencies: 243
-- Name: kot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kot_id_seq', 1, false);


--
-- TOC entry 5429 (class 0 OID 0)
-- Dependencies: 245
-- Name: kot_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kot_items_id_seq', 1, false);


--
-- TOC entry 5430 (class 0 OID 0)
-- Dependencies: 259
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 5431 (class 0 OID 0)
-- Dependencies: 241
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 1, false);


--
-- TOC entry 5432 (class 0 OID 0)
-- Dependencies: 239
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- TOC entry 5433 (class 0 OID 0)
-- Dependencies: 224
-- Name: outlet_creation_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.outlet_creation_log_id_seq', 1, true);


--
-- TOC entry 5434 (class 0 OID 0)
-- Dependencies: 222
-- Name: outlets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.outlets_id_seq', 3, true);


--
-- TOC entry 5435 (class 0 OID 0)
-- Dependencies: 249
-- Name: sales_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_summary_id_seq', 1, false);


--
-- TOC entry 5436 (class 0 OID 0)
-- Dependencies: 255
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- TOC entry 5437 (class 0 OID 0)
-- Dependencies: 253
-- Name: tax_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tax_records_id_seq', 1, false);


--
-- TOC entry 5438 (class 0 OID 0)
-- Dependencies: 226
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- TOC entry 5124 (class 2606 OID 17822)
-- Name: accounting_ledger accounting_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger
    ADD CONSTRAINT accounting_ledger_pkey PRIMARY KEY (id);


--
-- TOC entry 5126 (class 2606 OID 17824)
-- Name: accounting_ledger accounting_ledger_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger
    ADD CONSTRAINT accounting_ledger_transaction_id_key UNIQUE (transaction_id);


--
-- TOC entry 5145 (class 2606 OID 17956)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5049 (class 2606 OID 17394)
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- TOC entry 5051 (class 2606 OID 17390)
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- TOC entry 5053 (class 2606 OID 17396)
-- Name: admin admin_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_username_key UNIQUE (username);


--
-- TOC entry 5055 (class 2606 OID 17392)
-- Name: admin admin_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_uuid_key UNIQUE (uuid);


--
-- TOC entry 5071 (class 2606 OID 17502)
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- TOC entry 5073 (class 2606 OID 17498)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5075 (class 2606 OID 17500)
-- Name: categories categories_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_uuid_key UNIQUE (uuid);


--
-- TOC entry 5093 (class 2606 OID 17613)
-- Name: dish_ingredients dish_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_ingredients
    ADD CONSTRAINT dish_ingredients_pkey PRIMARY KEY (dish_id, ingredient_id);


--
-- TOC entry 5083 (class 2606 OID 17555)
-- Name: dish_outlets dish_outlets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_outlets
    ADD CONSTRAINT dish_outlets_pkey PRIMARY KEY (dish_id, outlet_id);


--
-- TOC entry 5077 (class 2606 OID 17529)
-- Name: dishes dishes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (id);


--
-- TOC entry 5079 (class 2606 OID 17531)
-- Name: dishes dishes_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_uuid_key UNIQUE (uuid);


--
-- TOC entry 5135 (class 2606 OID 17880)
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- TOC entry 5087 (class 2606 OID 17598)
-- Name: ingredients ingredients_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_name_key UNIQUE (name);


--
-- TOC entry 5089 (class 2606 OID 17594)
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- TOC entry 5091 (class 2606 OID 17596)
-- Name: ingredients ingredients_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_uuid_key UNIQUE (uuid);


--
-- TOC entry 5098 (class 2606 OID 17638)
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5120 (class 2606 OID 17787)
-- Name: kot_items kot_items_kot_id_order_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_kot_id_order_item_id_key UNIQUE (kot_id, order_item_id);


--
-- TOC entry 5122 (class 2606 OID 17785)
-- Name: kot_items kot_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5115 (class 2606 OID 17754)
-- Name: kot kot_kot_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_kot_number_key UNIQUE (kot_number);


--
-- TOC entry 5117 (class 2606 OID 17752)
-- Name: kot kot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_pkey PRIMARY KEY (id);


--
-- TOC entry 5152 (class 2606 OID 17989)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5111 (class 2606 OID 17725)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5104 (class 2606 OID 17690)
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 5106 (class 2606 OID 17686)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5108 (class 2606 OID 17688)
-- Name: orders orders_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_uuid_key UNIQUE (uuid);


--
-- TOC entry 5063 (class 2606 OID 17438)
-- Name: outlet_creation_log outlet_creation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log
    ADD CONSTRAINT outlet_creation_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5057 (class 2606 OID 17416)
-- Name: outlets outlets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_pkey PRIMARY KEY (id);


--
-- TOC entry 5059 (class 2606 OID 17420)
-- Name: outlets outlets_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_username_key UNIQUE (username);


--
-- TOC entry 5061 (class 2606 OID 17418)
-- Name: outlets outlets_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_uuid_key UNIQUE (uuid);


--
-- TOC entry 5085 (class 2606 OID 17574)
-- Name: platform_availability platform_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_availability
    ADD CONSTRAINT platform_availability_pkey PRIMARY KEY (dish_id, platform);


--
-- TOC entry 5131 (class 2606 OID 17858)
-- Name: sales_summary sales_summary_outlet_id_summary_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_summary
    ADD CONSTRAINT sales_summary_outlet_id_summary_date_key UNIQUE (outlet_id, summary_date);


--
-- TOC entry 5133 (class 2606 OID 17856)
-- Name: sales_summary sales_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_summary
    ADD CONSTRAINT sales_summary_pkey PRIMARY KEY (id);


--
-- TOC entry 5143 (class 2606 OID 17932)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5139 (class 2606 OID 17909)
-- Name: tax_records tax_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records
    ADD CONSTRAINT tax_records_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 17468)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5067 (class 2606 OID 17472)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5069 (class 2606 OID 17470)
-- Name: users users_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uuid_key UNIQUE (uuid);


--
-- TOC entry 5146 (class 1259 OID 17973)
-- Name: idx_activity_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_admin ON public.activity_logs USING btree (admin_id);


--
-- TOC entry 5147 (class 1259 OID 17974)
-- Name: idx_activity_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_created ON public.activity_logs USING btree (created_at);


--
-- TOC entry 5148 (class 1259 OID 17972)
-- Name: idx_activity_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_user ON public.activity_logs USING btree (user_id);


--
-- TOC entry 5080 (class 1259 OID 17543)
-- Name: idx_dishes_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dishes_category ON public.dishes USING btree (category_id);


--
-- TOC entry 5081 (class 1259 OID 17542)
-- Name: idx_dishes_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dishes_name ON public.dishes USING gin (to_tsvector('english'::regconfig, (name)::text));


--
-- TOC entry 5136 (class 1259 OID 17891)
-- Name: idx_expenses_outlet_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_outlet_date ON public.expenses USING btree (outlet_id, expense_date);


--
-- TOC entry 5094 (class 1259 OID 17656)
-- Name: idx_inventory_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_date ON public.inventory_transactions USING btree (transaction_date);


--
-- TOC entry 5095 (class 1259 OID 17655)
-- Name: idx_inventory_ingredient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_ingredient ON public.inventory_transactions USING btree (ingredient_id);


--
-- TOC entry 5096 (class 1259 OID 17654)
-- Name: idx_inventory_outlet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_outlet ON public.inventory_transactions USING btree (outlet_id);


--
-- TOC entry 5118 (class 1259 OID 17798)
-- Name: idx_kot_items_kot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kot_items_kot ON public.kot_items USING btree (kot_id);


--
-- TOC entry 5112 (class 1259 OID 17771)
-- Name: idx_kot_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kot_order ON public.kot USING btree (order_id);


--
-- TOC entry 5113 (class 1259 OID 17770)
-- Name: idx_kot_outlet_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kot_outlet_status ON public.kot USING btree (outlet_id, status);


--
-- TOC entry 5127 (class 1259 OID 17836)
-- Name: idx_ledger_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_date ON public.accounting_ledger USING btree (payment_date);


--
-- TOC entry 5128 (class 1259 OID 17835)
-- Name: idx_ledger_outlet_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_outlet_status ON public.accounting_ledger USING btree (outlet_id, status);


--
-- TOC entry 5149 (class 1259 OID 18006)
-- Name: idx_notifications_admin_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_admin_unread ON public.notifications USING btree (admin_id, is_read);


--
-- TOC entry 5150 (class 1259 OID 18005)
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read);


--
-- TOC entry 5109 (class 1259 OID 17736)
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- TOC entry 5099 (class 1259 OID 17702)
-- Name: idx_orders_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_date ON public.orders USING btree (order_time);


--
-- TOC entry 5100 (class 1259 OID 17703)
-- Name: idx_orders_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_number ON public.orders USING btree (order_number);


--
-- TOC entry 5101 (class 1259 OID 17701)
-- Name: idx_orders_outlet_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_outlet_status ON public.orders USING btree (outlet_id, order_status);


--
-- TOC entry 5102 (class 1259 OID 17704)
-- Name: idx_orders_platform; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_platform ON public.orders USING btree (platform_order_id);


--
-- TOC entry 5129 (class 1259 OID 17864)
-- Name: idx_sales_summary_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_summary_date ON public.sales_summary USING btree (summary_date);


--
-- TOC entry 5140 (class 1259 OID 17944)
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (token);


--
-- TOC entry 5141 (class 1259 OID 17943)
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user ON public.sessions USING btree (user_id);


--
-- TOC entry 5137 (class 1259 OID 17920)
-- Name: idx_tax_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_period ON public.tax_records USING btree (tax_period);


--
-- TOC entry 5200 (class 2620 OID 18017)
-- Name: orders trigger_calculate_order_total; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_calculate_order_total BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.calculate_order_total();


--
-- TOC entry 5201 (class 2620 OID 18019)
-- Name: orders trigger_update_inventory; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_inventory AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_inventory_on_order_completion();


--
-- TOC entry 5202 (class 2620 OID 18015)
-- Name: accounting_ledger update_accounting_ledger_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_accounting_ledger_updated_at BEFORE UPDATE ON public.accounting_ledger FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5194 (class 2620 OID 18008)
-- Name: admin update_admin_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON public.admin FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5197 (class 2620 OID 18011)
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5198 (class 2620 OID 18012)
-- Name: dishes update_dishes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5199 (class 2620 OID 18013)
-- Name: ingredients update_ingredients_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5195 (class 2620 OID 18009)
-- Name: outlets update_outlets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_outlets_updated_at BEFORE UPDATE ON public.outlets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5203 (class 2620 OID 18014)
-- Name: sales_summary update_sales_summary_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_sales_summary_updated_at BEFORE UPDATE ON public.sales_summary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5196 (class 2620 OID 18010)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5179 (class 2606 OID 17825)
-- Name: accounting_ledger accounting_ledger_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger
    ADD CONSTRAINT accounting_ledger_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- TOC entry 5180 (class 2606 OID 17830)
-- Name: accounting_ledger accounting_ledger_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger
    ADD CONSTRAINT accounting_ledger_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5188 (class 2606 OID 17967)
-- Name: activity_logs activity_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5189 (class 2606 OID 17962)
-- Name: activity_logs activity_logs_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE SET NULL;


--
-- TOC entry 5190 (class 2606 OID 17957)
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5158 (class 2606 OID 17503)
-- Name: categories categories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5165 (class 2606 OID 17614)
-- Name: dish_ingredients dish_ingredients_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_ingredients
    ADD CONSTRAINT dish_ingredients_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- TOC entry 5166 (class 2606 OID 17619)
-- Name: dish_ingredients dish_ingredients_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_ingredients
    ADD CONSTRAINT dish_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- TOC entry 5161 (class 2606 OID 17556)
-- Name: dish_outlets dish_outlets_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_outlets
    ADD CONSTRAINT dish_outlets_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- TOC entry 5162 (class 2606 OID 17561)
-- Name: dish_outlets dish_outlets_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_outlets
    ADD CONSTRAINT dish_outlets_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5159 (class 2606 OID 17532)
-- Name: dishes dishes_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 5160 (class 2606 OID 17537)
-- Name: dishes dishes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5182 (class 2606 OID 17886)
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5183 (class 2606 OID 17881)
-- Name: expenses expenses_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5164 (class 2606 OID 17599)
-- Name: ingredients ingredients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5167 (class 2606 OID 17649)
-- Name: inventory_transactions inventory_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5168 (class 2606 OID 17644)
-- Name: inventory_transactions inventory_transactions_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- TOC entry 5169 (class 2606 OID 17639)
-- Name: inventory_transactions inventory_transactions_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5174 (class 2606 OID 17765)
-- Name: kot kot_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5177 (class 2606 OID 17788)
-- Name: kot_items kot_items_kot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_kot_id_fkey FOREIGN KEY (kot_id) REFERENCES public.kot(id) ON DELETE CASCADE;


--
-- TOC entry 5178 (class 2606 OID 17793)
-- Name: kot_items kot_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- TOC entry 5175 (class 2606 OID 17755)
-- Name: kot kot_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5176 (class 2606 OID 17760)
-- Name: kot kot_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5191 (class 2606 OID 18000)
-- Name: notifications notifications_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id) ON DELETE CASCADE;


--
-- TOC entry 5192 (class 2606 OID 17990)
-- Name: notifications notifications_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5193 (class 2606 OID 17995)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5172 (class 2606 OID 17731)
-- Name: order_items order_items_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE RESTRICT;


--
-- TOC entry 5173 (class 2606 OID 17726)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 17696)
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5171 (class 2606 OID 17691)
-- Name: orders orders_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5154 (class 2606 OID 17444)
-- Name: outlet_creation_log outlet_creation_log_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log
    ADD CONSTRAINT outlet_creation_log_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE CASCADE;


--
-- TOC entry 5155 (class 2606 OID 17439)
-- Name: outlet_creation_log outlet_creation_log_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log
    ADD CONSTRAINT outlet_creation_log_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5153 (class 2606 OID 17421)
-- Name: outlets outlets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5163 (class 2606 OID 17575)
-- Name: platform_availability platform_availability_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_availability
    ADD CONSTRAINT platform_availability_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- TOC entry 5181 (class 2606 OID 17859)
-- Name: sales_summary sales_summary_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_summary
    ADD CONSTRAINT sales_summary_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5186 (class 2606 OID 17938)
-- Name: sessions sessions_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE SET NULL;


--
-- TOC entry 5187 (class 2606 OID 17933)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5184 (class 2606 OID 17915)
-- Name: tax_records tax_records_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records
    ADD CONSTRAINT tax_records_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- TOC entry 5185 (class 2606 OID 17910)
-- Name: tax_records tax_records_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records
    ADD CONSTRAINT tax_records_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5156 (class 2606 OID 17478)
-- Name: users users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5157 (class 2606 OID 17473)
-- Name: users users_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


CREATE TABLE public.outlet_integrations (
    id SERIAL PRIMARY KEY,
    outlet_id INTEGER NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    access_token VARCHAR(255) NOT NULL,
    swiggy_id VARCHAR(100),
    zomato_id VARCHAR(100)
);

ALTER TABLE public.outlet_integrations OWNER TO postgres;


-- Completed on 2026-05-25 14:54:14

--
-- PostgreSQL database dump complete
--

\unrestrict H1fwRprblfq8Zx0zqa7O6KTB1bXD6oXzboiIfXCKH4tBqCXSz2HcC27tjZVjJZ4

