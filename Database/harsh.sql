--
-- PostgreSQL database dump
--

\restrict mpo4U8uLVexsoyJF92oj8X6iP6qgCy1xswBciIrczExFtSkldnGHew0g9bYxCac

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-29 15:13:26

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
-- TOC entry 2 (class 3079 OID 16389)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5501 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 909 (class 1247 OID 16401)
-- Name: admin_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.admin_role_enum AS ENUM (
    'SUPER_ADMIN',
    'ADMIN'
);


ALTER TYPE public.admin_role_enum OWNER TO postgres;

--
-- TOC entry 912 (class 1247 OID 16406)
-- Name: app_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.app_role_enum AS ENUM (
    'Admin',
    'Staff'
);


ALTER TYPE public.app_role_enum OWNER TO postgres;

--
-- TOC entry 915 (class 1247 OID 16412)
-- Name: discount_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.discount_type_enum AS ENUM (
    'percentage',
    'fixed'
);


ALTER TYPE public.discount_type_enum OWNER TO postgres;

--
-- TOC entry 918 (class 1247 OID 16418)
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
-- TOC entry 921 (class 1247 OID 16428)
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
-- TOC entry 924 (class 1247 OID 16440)
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
-- TOC entry 927 (class 1247 OID 16450)
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
-- TOC entry 930 (class 1247 OID 16460)
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
-- TOC entry 933 (class 1247 OID 16472)
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
-- TOC entry 936 (class 1247 OID 16482)
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
-- TOC entry 939 (class 1247 OID 16494)
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'pending',
    'paid',
    'refunded'
);


ALTER TYPE public.payment_status_enum OWNER TO postgres;

--
-- TOC entry 942 (class 1247 OID 16502)
-- Name: platform_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.platform_enum AS ENUM (
    'swiggy',
    'zomato'
);


ALTER TYPE public.platform_enum OWNER TO postgres;

--
-- TOC entry 945 (class 1247 OID 16508)
-- Name: status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_enum AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.status_enum OWNER TO postgres;

--
-- TOC entry 948 (class 1247 OID 16514)
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
-- TOC entry 951 (class 1247 OID 16524)
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
-- TOC entry 274 (class 1255 OID 16533)
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
-- TOC entry 286 (class 1255 OID 16534)
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
-- TOC entry 287 (class 1255 OID 16535)
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
-- TOC entry 220 (class 1259 OID 16536)
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
-- TOC entry 221 (class 1259 OID 16550)
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
-- TOC entry 5502 (class 0 OID 0)
-- Dependencies: 221
-- Name: accounting_ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounting_ledger_id_seq OWNED BY public.accounting_ledger.id;


--
-- TOC entry 222 (class 1259 OID 16551)
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
-- TOC entry 223 (class 1259 OID 16559)
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
-- TOC entry 5503 (class 0 OID 0)
-- Dependencies: 223
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- TOC entry 224 (class 1259 OID 16560)
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
-- TOC entry 225 (class 1259 OID 16578)
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
-- TOC entry 5504 (class 0 OID 0)
-- Dependencies: 225
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- TOC entry 226 (class 1259 OID 16579)
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
-- TOC entry 227 (class 1259 OID 16591)
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
-- TOC entry 5505 (class 0 OID 0)
-- Dependencies: 227
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 228 (class 1259 OID 16592)
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
-- TOC entry 229 (class 1259 OID 16618)
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
-- TOC entry 230 (class 1259 OID 16634)
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
-- TOC entry 231 (class 1259 OID 16639)
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
-- TOC entry 232 (class 1259 OID 16647)
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
-- TOC entry 233 (class 1259 OID 16657)
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
    image_url character varying(500),
    CONSTRAINT dishes_dine_price_check CHECK ((dine_price >= (0)::numeric)),
    CONSTRAINT dishes_parcel_price_check CHECK ((parcel_price >= (0)::numeric)),
    CONSTRAINT dishes_swiggy_price_check CHECK ((swiggy_price >= (0)::numeric)),
    CONSTRAINT dishes_zomato_price_check CHECK ((zomato_price >= (0)::numeric))
);


ALTER TABLE public.dishes OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16675)
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
-- TOC entry 5506 (class 0 OID 0)
-- Dependencies: 234
-- Name: dishes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dishes_id_seq OWNED BY public.dishes.id;


--
-- TOC entry 235 (class 1259 OID 16676)
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
-- TOC entry 236 (class 1259 OID 16688)
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
-- TOC entry 5507 (class 0 OID 0)
-- Dependencies: 236
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- TOC entry 237 (class 1259 OID 16689)
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
-- TOC entry 238 (class 1259 OID 16700)
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
-- TOC entry 5508 (class 0 OID 0)
-- Dependencies: 238
-- Name: ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredients_id_seq OWNED BY public.ingredients.id;


--
-- TOC entry 239 (class 1259 OID 16701)
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
-- TOC entry 240 (class 1259 OID 16705)
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
-- TOC entry 241 (class 1259 OID 16716)
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
-- TOC entry 5509 (class 0 OID 0)
-- Dependencies: 241
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- TOC entry 242 (class 1259 OID 16717)
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
-- TOC entry 243 (class 1259 OID 16728)
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
-- TOC entry 5510 (class 0 OID 0)
-- Dependencies: 243
-- Name: kot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kot_id_seq OWNED BY public.kot.id;


--
-- TOC entry 244 (class 1259 OID 16729)
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
-- TOC entry 245 (class 1259 OID 16739)
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
-- TOC entry 5511 (class 0 OID 0)
-- Dependencies: 245
-- Name: kot_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kot_items_id_seq OWNED BY public.kot_items.id;


--
-- TOC entry 246 (class 1259 OID 16740)
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
-- TOC entry 247 (class 1259 OID 16745)
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
-- TOC entry 248 (class 1259 OID 16756)
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
-- TOC entry 5512 (class 0 OID 0)
-- Dependencies: 248
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 249 (class 1259 OID 16757)
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
-- TOC entry 250 (class 1259 OID 16774)
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
-- TOC entry 5513 (class 0 OID 0)
-- Dependencies: 250
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 251 (class 1259 OID 16775)
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
-- TOC entry 5514 (class 0 OID 0)
-- Dependencies: 251
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 252 (class 1259 OID 16776)
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
-- TOC entry 253 (class 1259 OID 16785)
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
-- TOC entry 5515 (class 0 OID 0)
-- Dependencies: 253
-- Name: outlet_creation_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.outlet_creation_log_id_seq OWNED BY public.outlet_creation_log.id;


--
-- TOC entry 254 (class 1259 OID 16786)
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
-- TOC entry 5516 (class 0 OID 0)
-- Dependencies: 254
-- Name: outlets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.outlets_id_seq OWNED BY public.outlets.id;


--
-- TOC entry 255 (class 1259 OID 16787)
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
-- TOC entry 256 (class 1259 OID 16794)
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
-- TOC entry 257 (class 1259 OID 16810)
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
-- TOC entry 5517 (class 0 OID 0)
-- Dependencies: 257
-- Name: sales_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_summary_id_seq OWNED BY public.sales_summary.id;


--
-- TOC entry 258 (class 1259 OID 16811)
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
-- TOC entry 259 (class 1259 OID 16819)
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
-- TOC entry 5518 (class 0 OID 0)
-- Dependencies: 259
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- TOC entry 260 (class 1259 OID 16820)
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
-- TOC entry 261 (class 1259 OID 16834)
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
-- TOC entry 5519 (class 0 OID 0)
-- Dependencies: 261
-- Name: tax_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tax_records_id_seq OWNED BY public.tax_records.id;


--
-- TOC entry 262 (class 1259 OID 16835)
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
-- TOC entry 263 (class 1259 OID 16851)
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
-- TOC entry 5520 (class 0 OID 0)
-- Dependencies: 263
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 5029 (class 2604 OID 17230)
-- Name: accounting_ledger id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger ALTER COLUMN id SET DEFAULT nextval('public.accounting_ledger_id_seq'::regclass);


--
-- TOC entry 5034 (class 2604 OID 17231)
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- TOC entry 5036 (class 2604 OID 17232)
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- TOC entry 5044 (class 2604 OID 17233)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 5071 (class 2604 OID 17234)
-- Name: dishes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes ALTER COLUMN id SET DEFAULT nextval('public.dishes_id_seq'::regclass);


--
-- TOC entry 5077 (class 2604 OID 17235)
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- TOC entry 5079 (class 2604 OID 17236)
-- Name: ingredients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients ALTER COLUMN id SET DEFAULT nextval('public.ingredients_id_seq'::regclass);


--
-- TOC entry 5086 (class 2604 OID 17237)
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- TOC entry 5088 (class 2604 OID 17238)
-- Name: kot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot ALTER COLUMN id SET DEFAULT nextval('public.kot_id_seq'::regclass);


--
-- TOC entry 5092 (class 2604 OID 17239)
-- Name: kot_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items ALTER COLUMN id SET DEFAULT nextval('public.kot_items_id_seq'::regclass);


--
-- TOC entry 5094 (class 2604 OID 17240)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 5098 (class 2604 OID 17241)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 5050 (class 2604 OID 17242)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 5102 (class 2604 OID 17243)
-- Name: outlet_creation_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log ALTER COLUMN id SET DEFAULT nextval('public.outlet_creation_log_id_seq'::regclass);


--
-- TOC entry 5064 (class 2604 OID 17244)
-- Name: outlets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets ALTER COLUMN id SET DEFAULT nextval('public.outlets_id_seq'::regclass);


--
-- TOC entry 5105 (class 2604 OID 17245)
-- Name: sales_summary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_summary ALTER COLUMN id SET DEFAULT nextval('public.sales_summary_id_seq'::regclass);


--
-- TOC entry 5116 (class 2604 OID 17246)
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- TOC entry 5118 (class 2604 OID 17247)
-- Name: tax_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records ALTER COLUMN id SET DEFAULT nextval('public.tax_records_id_seq'::regclass);


--
-- TOC entry 5126 (class 2604 OID 17248)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5455 (class 0 OID 16536)
-- Dependencies: 220
-- Data for Name: accounting_ledger; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounting_ledger (id, transaction_id, order_id, outlet_id, amount, transaction_type, payment_date, bill_uploaded, bill_url, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5457 (class 0 OID 16551)
-- Dependencies: 222
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, outlet_id, admin_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at) FROM stdin;
\.


--
-- TOC entry 5459 (class 0 OID 16560)
-- Dependencies: 224
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (id, uuid, name, email, username, password_hash, phone, role, is_super_admin, permissions, status, last_login, created_at, updated_at) FROM stdin;
1	fc7b2f89-9c5d-4558-9498-3a26252d98e2	System Super Admin	superadmin@guptasandwich.com	superadmin	$2b$10$nsibZBPTloa.8lLCE7jbvO29b8TpW6Fyu/YcWGAbH9SVaKvjAiXfy	\N	SUPER_ADMIN	t	{"all": true}	active	2026-05-29 13:39:16.312944	2026-05-25 14:23:11.13301	2026-05-29 13:39:16.312944
\.


--
-- TOC entry 5461 (class 0 OID 16579)
-- Dependencies: 226
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, uuid, name, description, display_order, is_active, created_by, created_at, updated_at) FROM stdin;
1	7e0d85c2-0b59-4cfd-a016-cf41cf6fd09c	Grilled Sandwiches	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
2	24c40318-b891-42b5-9441-089c732ae012	Special Grilled / Panini	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
3	db69eb8f-f6aa-4646-bf7b-9d7a44a15e8e	Sandwiches	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
4	a8e3af31-b714-4ce2-81c7-fde308e5278b	Panini (Multi-grain)	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
5	6fa54016-13cb-431b-8f0f-224bff13249d	Pizza	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
6	64a68425-4b56-4feb-8800-a2e9003b2ccf	Burgers	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
7	e1112bb2-aeef-4d15-8118-9240719349d9	Appetizers	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
8	8c7ee5d7-da7f-4871-9342-dbf6bf4ddb64	Mocktails	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
9	56b7c5dc-d4ab-4607-a29c-8317d0715f19	Shakes & Smoothies	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
10	d76da458-41a9-4c5f-9db7-d790354bc735	Combos	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
11	4a53c57d-7975-45e6-a649-a201e11f54b5	Party Combo Boxes	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
12	b84179c1-0491-4388-83fc-939eb9e076db	Extra Add-ons	\N	0	t	\N	2026-05-26 16:06:15.935568	2026-05-26 16:10:20.216161
\.


--
-- TOC entry 5465 (class 0 OID 16639)
-- Dependencies: 231
-- Data for Name: dish_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dish_ingredients (dish_id, ingredient_id, quantity_required, wastage_percent) FROM stdin;
\.


--
-- TOC entry 5466 (class 0 OID 16647)
-- Dependencies: 232
-- Data for Name: dish_outlets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dish_outlets (dish_id, outlet_id, is_available, custom_price_dine, custom_price_parcel, custom_price_swiggy, custom_price_zomato) FROM stdin;
4	9	t	\N	\N	\N	\N
5	9	t	\N	\N	\N	\N
\.


--
-- TOC entry 5467 (class 0 OID 16657)
-- Dependencies: 233
-- Data for Name: dishes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dishes (id, uuid, name, category_id, cat, dine_price, parcel_price, swiggy_price, zomato_price, ingredients, emoji, veg, time_required, is_available, created_by, created_at, updated_at, image_url) FROM stdin;
2	d363c5b3-2de8-4462-aaaa-9c5397702bdd	Coca Cola	9	\N	50.00	60.00	58.00	58.00	{Cola}	\N	t	\N	t	\N	2026-05-28 15:59:11.474009	2026-05-28 19:07:18.936555	/uploads/dishes/590572b9-363c-491a-aabd-84237ce7ba38.jpeg
1	df196bf6-58cd-40bd-8319-c616813db61e	Double Grilled Sandwiches	3	\N	200.00	210.00	210.00	210.00	{Bread}	\N	t	\N	t	\N	2026-05-28 15:53:27.872871	2026-05-28 19:07:28.81579	/uploads/dishes/c490bdf9-74c7-4daf-b6e2-0b0c19c480c6.jpg
3	31449e48-e4a2-4afb-ad48-bbee559ba100	7 in 1	5	\N	500.00	520.00	520.00	520.00	{Mayo,Cheeze}	\N	t	\N	t	\N	2026-05-28 19:15:34.680706	2026-05-28 19:15:34.680706	/uploads/dishes/f72b95b4-a011-41a1-9c66-d74bda18bcff.jpg
4	3ceec357-0473-4972-9913-5fb41ab9d60f	Burger Combo	10	\N	90.00	100.00	100.00	100.00	{Cheeze,Sauce}	\N	t	\N	t	\N	2026-05-29 13:28:01.892392	2026-05-29 13:28:01.892392	/uploads/dishes/76424be4-577a-44a8-918d-2cc22be32afd.jpg
5	cd138bbf-3366-4161-bba9-f9374602e358	Double Sandwich Combo	10	\N	100.00	110.00	200.00	210.00	{Cheese,Bread}	\N	t	\N	t	\N	2026-05-29 13:38:10.342923	2026-05-29 13:39:37.734421	/uploads/dishes/70cb2d70-57eb-48a5-b2f9-6825a401bda2.jpg
\.


--
-- TOC entry 5469 (class 0 OID 16676)
-- Dependencies: 235
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, outlet_id, expense_type, amount, expense_date, vendor_name, bill_number, bill_url, notes, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5471 (class 0 OID 16689)
-- Dependencies: 237
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredients (id, uuid, name, unit, cost_per_unit, current_stock, reorder_level, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5473 (class 0 OID 16705)
-- Dependencies: 240
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_transactions (id, outlet_id, ingredient_id, transaction_type, quantity, notes, reference_id, transaction_date, created_by) FROM stdin;
\.


--
-- TOC entry 5475 (class 0 OID 16717)
-- Dependencies: 242
-- Data for Name: kot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kot (id, kot_number, order_id, outlet_id, table_number, order_type, status, is_urgent, sent_time, ready_time, served_time, created_by) FROM stdin;
9	KOT-8-20260528-0006	9	8	\N	parcel	served	f	2026-05-28 20:09:39.184438	2026-05-28 20:09:44.887586	2026-05-28 20:09:46.455842	\N
10	KOT-8-20260528-0007	10	8	\N	dine	served	f	2026-05-28 20:11:34.294851	2026-05-28 20:11:39.095168	2026-05-28 20:11:42.69573	\N
11	KOT-8-20260528-0008	11	8	\N	dine	served	f	2026-05-28 20:13:56.113123	2026-05-28 20:14:00.232854	2026-05-28 20:14:00.922362	\N
12	KOT-8-20260528-0009	12	8	\N	parcel	served	f	2026-05-28 20:14:44.823407	2026-05-28 20:14:49.441544	2026-05-28 20:14:54.014248	\N
13	KOT-9-20260529-0001	13	9	\N	dine	served	f	2026-05-29 13:31:05.0841	2026-05-29 13:31:18.585464	2026-05-29 13:31:21.518665	\N
14	KOT-9-20260529-0002	14	9	\N	dine	served	f	2026-05-29 13:31:36.430889	2026-05-29 13:31:40.998975	2026-05-29 13:31:41.878376	\N
15	KOT-9-20260529-0003	15	9	\N	parcel	served	f	2026-05-29 13:32:07.015577	2026-05-29 13:32:10.267404	2026-05-29 13:32:11.17753	\N
16	KOT-9-20260529-0004	16	9	\N	parcel	served	f	2026-05-29 13:38:32.350069	2026-05-29 13:38:43.733261	2026-05-29 13:38:44.884915	\N
1	KOT-8-20260528-0001	1	8	\N	parcel	served	f	2026-05-28 16:17:22.040349	2026-05-28 16:19:22.557816	2026-05-28 16:19:23.768352	\N
3	KOT-8-20260528-0003	3	8	\N	dine	served	f	2026-05-28 16:21:55.966789	2026-05-28 16:22:01.989211	2026-05-28 16:22:02.65507	\N
2	KOT-8-20260528-0002	2	8	\N	dine	served	f	2026-05-28 16:19:37.06807	2026-05-28 16:21:59.890473	2026-05-28 16:22:03.964326	\N
4	KOT-7-20260528-0001	4	7	\N	dine	served	f	2026-05-28 16:22:31.188301	2026-05-28 16:22:34.439872	2026-05-28 16:22:35.981003	\N
5	KOT-7-20260528-0002	5	7	\N	dine	served	f	2026-05-28 16:26:08.823826	2026-05-28 16:27:07.64583	2026-05-28 16:27:09.435601	\N
6	KOT-8-20260528-0004	6	8	\N	dine	served	f	2026-05-28 16:28:49.92349	2026-05-28 16:28:54.018192	2026-05-28 16:28:55.123783	\N
7	KOT-7-20260528-0003	7	7	\N	parcel	served	f	2026-05-28 16:33:01.779167	2026-05-28 16:33:07.119717	2026-05-28 16:33:08.549192	\N
8	KOT-8-20260528-0005	8	8	\N	parcel	served	f	2026-05-28 20:06:55.384721	2026-05-28 20:07:13.055208	2026-05-28 20:07:13.988514	\N
\.


--
-- TOC entry 5477 (class 0 OID 16729)
-- Dependencies: 244
-- Data for Name: kot_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kot_items (id, kot_id, order_item_id, dish_name, quantity, is_ready, ready_time) FROM stdin;
1	1	1	Coca Cola	1	t	2026-05-28 16:19:22.557816
2	2	2	Coca Cola	1	t	2026-05-28 16:21:59.890473
3	3	3	Coca Cola	1	t	2026-05-28 16:22:01.989211
4	4	4	Double Grilled Sandwiches	1	t	2026-05-28 16:22:34.439872
5	5	5	Double Grilled Sandwiches	1	t	2026-05-28 16:27:07.64583
6	6	6	Coca Cola	1	t	2026-05-28 16:28:54.018192
7	7	7	Double Grilled Sandwiches	1	t	2026-05-28 16:33:07.119717
8	8	8	7 in 1	1	t	2026-05-28 20:07:13.055208
9	9	9	7 in 1	1	t	2026-05-28 20:09:44.887586
10	10	10	7 in 1	1	t	2026-05-28 20:11:39.095168
11	11	11	7 in 1	1	t	2026-05-28 20:14:00.232854
12	12	12	7 in 1	1	t	2026-05-28 20:14:49.441544
13	13	13	Burger Combo	1	t	2026-05-29 13:31:18.585464
14	14	14	Burger Combo	1	t	2026-05-29 13:31:40.998975
15	15	15	Burger Combo	1	t	2026-05-29 13:32:10.267404
16	16	16	Double Sandwiches Combo	1	t	2026-05-29 13:38:43.733261
\.


--
-- TOC entry 5479 (class 0 OID 16745)
-- Dependencies: 247
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, outlet_id, user_id, admin_id, title, message, type, is_read, created_at, read_at) FROM stdin;
\.


--
-- TOC entry 5481 (class 0 OID 16757)
-- Dependencies: 249
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, dish_id, quantity, unit_price, total_price, special_instructions, is_ready, ready_time, created_at) FROM stdin;
1	1	2	1	60.00	60.00	\N	t	2026-05-28 16:19:22.557816	2026-05-28 16:17:22.040349
2	2	2	1	50.00	50.00	\N	t	2026-05-28 16:21:59.890473	2026-05-28 16:19:37.06807
3	3	2	1	50.00	50.00	\N	t	2026-05-28 16:22:01.989211	2026-05-28 16:21:55.966789
4	4	1	1	200.00	200.00	\N	t	2026-05-28 16:22:34.439872	2026-05-28 16:22:31.188301
5	5	1	1	200.00	200.00	\N	t	2026-05-28 16:27:07.64583	2026-05-28 16:26:08.823826
6	6	2	1	50.00	50.00	\N	t	2026-05-28 16:28:54.018192	2026-05-28 16:28:49.92349
7	7	1	1	210.00	210.00	\N	t	2026-05-28 16:33:07.119717	2026-05-28 16:33:01.779167
8	8	3	1	520.00	520.00	\N	t	2026-05-28 20:07:13.055208	2026-05-28 20:06:55.384721
9	9	3	1	520.00	520.00	\N	t	2026-05-28 20:09:44.887586	2026-05-28 20:09:39.184438
10	10	3	1	500.00	500.00	\N	t	2026-05-28 20:11:39.095168	2026-05-28 20:11:34.294851
11	11	3	1	500.00	500.00	\N	t	2026-05-28 20:14:00.232854	2026-05-28 20:13:56.113123
12	12	3	1	520.00	520.00	\N	t	2026-05-28 20:14:49.441544	2026-05-28 20:14:44.823407
13	13	4	1	90.00	90.00	\N	t	2026-05-29 13:31:18.585464	2026-05-29 13:31:05.0841
14	14	4	1	90.00	90.00	\N	t	2026-05-29 13:31:40.998975	2026-05-29 13:31:36.430889
15	15	4	1	100.00	100.00	\N	t	2026-05-29 13:32:10.267404	2026-05-29 13:32:07.015577
16	16	5	1	210.00	210.00	\N	t	2026-05-29 13:38:43.733261	2026-05-29 13:38:32.350069
\.


--
-- TOC entry 5463 (class 0 OID 16592)
-- Dependencies: 228
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, uuid, order_number, outlet_id, order_type, table_number, customer_name, customer_phone, customer_email, delivery_address, special_instructions, subtotal, discount_type, discount_value, discount_amount, packing_charge, delivery_charge, service_charge, gst_amount, total_amount, payment_method, payment_status, order_status, platform_order_id, order_time, delivery_time, payment_time, created_by, kot_sent, kot_sent_time, completed_time) FROM stdin;
1	674ada04-2ea8-45d0-b755-e801649dd562	ORD-8-20260528-0001	8	parcel	\N	\N	\N	\N	\N	\N	60.00	percentage	0.00	0.00	20.00	30.00	0.00	19.80	129.80	cash	paid	completed	\N	2026-05-28 16:17:22.040349	\N	2026-05-28 16:17:22.040349	\N	t	2026-05-28 16:17:22.040349	2026-05-28 16:19:23.768352
3	8921035f-9b92-4d9b-88d3-720ebc15ff0c	ORD-8-20260528-0003	8	dine	\N	\N	\N	\N	\N	\N	50.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	50.00	cash	paid	completed	\N	2026-05-28 16:21:55.966789	\N	2026-05-28 16:21:55.966789	\N	t	2026-05-28 16:21:55.966789	2026-05-28 16:22:02.65507
2	b57368b5-667a-4341-b797-551d2240d391	ORD-8-20260528-0002	8	dine	\N	\N	\N	\N	\N	\N	50.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	50.00	cash	paid	completed	\N	2026-05-28 16:19:37.06807	\N	2026-05-28 16:19:37.06807	\N	t	2026-05-28 16:19:37.06807	2026-05-28 16:22:03.964326
4	0860eb89-3f07-485b-9a28-4570d7b4b816	ORD-7-20260528-0001	7	dine	\N	\N	\N	\N	\N	\N	200.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	200.00	cash	paid	completed	\N	2026-05-28 16:22:31.188301	\N	2026-05-28 16:22:31.188301	\N	t	2026-05-28 16:22:31.188301	2026-05-28 16:22:35.981003
5	f363e785-18a2-4bf3-82b9-8f4533b1604c	ORD-7-20260528-0002	7	dine	\N	\N	\N	\N	\N	\N	200.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	200.00	cash	paid	completed	\N	2026-05-28 16:26:08.823826	\N	2026-05-28 16:26:08.823826	\N	t	2026-05-28 16:26:08.823826	2026-05-28 16:27:09.435601
6	8dda25d2-3e58-4324-a7a6-e369efb1c47b	ORD-8-20260528-0004	8	dine	\N	\N	\N	\N	\N	\N	50.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	50.00	cash	paid	completed	\N	2026-05-28 16:28:49.92349	\N	2026-05-28 16:28:49.92349	\N	t	2026-05-28 16:28:49.92349	2026-05-28 16:28:55.123783
7	3628c8de-7243-41b5-bb89-2bd73a4bf8cb	ORD-7-20260528-0003	7	parcel	\N	\N	\N	\N	\N	\N	210.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	210.00	cash	paid	completed	\N	2026-05-28 16:33:01.779167	\N	2026-05-28 16:33:01.779167	\N	t	2026-05-28 16:33:01.779167	2026-05-28 16:33:08.549192
8	3f40960b-4dbf-46c0-a453-ddd47a4d46ee	ORD-8-20260528-0005	8	parcel	\N	\N	\N	\N	\N	\N	520.00	percentage	0.00	0.00	20.00	30.00	0.00	102.60	672.60	online	paid	completed	\N	2026-05-28 20:06:55.384721	\N	2026-05-28 20:06:55.384721	\N	t	2026-05-28 20:06:55.384721	2026-05-28 20:07:13.988514
9	21f97dfd-774c-4943-9c86-6be9b82ea754	ORD-8-20260528-0006	8	parcel	\N	\N	\N	\N	\N	\N	520.00	percentage	0.00	0.00	20.00	30.00	0.00	102.60	672.60	cash	paid	completed	\N	2026-05-28 20:09:39.184438	\N	2026-05-28 20:09:39.184438	\N	t	2026-05-28 20:09:39.184438	2026-05-28 20:09:46.455842
10	6c310c44-aaa9-46ac-82b2-607db9110614	ORD-8-20260528-0007	8	dine	\N	\N	\N	\N	\N	\N	500.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	500.00	cash	paid	completed	\N	2026-05-28 20:11:34.294851	\N	2026-05-28 20:11:34.294851	\N	t	2026-05-28 20:11:34.294851	2026-05-28 20:11:42.69573
11	b6ef12ce-bddf-4bc8-b930-131debb5d52b	ORD-8-20260528-0008	8	dine	\N	\N	\N	\N	\N	\N	500.00	fixed	100.00	100.00	0.00	0.00	0.00	0.00	400.00	cash	paid	completed	\N	2026-05-28 20:13:56.113123	\N	2026-05-28 20:13:56.113123	\N	t	2026-05-28 20:13:56.113123	2026-05-28 20:14:00.922362
12	1620accb-3bef-4b96-8951-1661a58e0ba9	ORD-8-20260528-0009	8	parcel	\N	\N	\N	\N	\N	\N	520.00	percentage	25.00	130.00	0.00	0.00	0.00	0.00	390.00	cash	paid	completed	\N	2026-05-28 20:14:44.823407	\N	2026-05-28 20:14:44.823407	\N	t	2026-05-28 20:14:44.823407	2026-05-28 20:14:54.014248
13	e3d86c0a-6401-4918-b3a8-9683cec08343	ORD-9-20260529-0001	9	dine	\N	\N	\N	\N	\N	\N	90.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	90.00	cash	paid	completed	\N	2026-05-29 13:31:05.0841	\N	2026-05-29 13:31:05.0841	\N	t	2026-05-29 13:31:05.0841	2026-05-29 13:31:21.518665
14	0563545c-b14a-4855-abb9-e56cb9201ba7	ORD-9-20260529-0002	9	dine	\N	\N	\N	\N	\N	\N	90.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	90.00	cash	paid	completed	\N	2026-05-29 13:31:36.430889	\N	2026-05-29 13:31:36.430889	\N	t	2026-05-29 13:31:36.430889	2026-05-29 13:31:41.878376
15	fa882682-6f3c-48e0-9a6c-5bc997ef1d2f	ORD-9-20260529-0003	9	parcel	\N	\N	\N	\N	\N	\N	100.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	100.00	cash	paid	completed	\N	2026-05-29 13:32:07.015577	\N	2026-05-29 13:32:07.015577	\N	t	2026-05-29 13:32:07.015577	2026-05-29 13:32:11.17753
16	6a7ceac7-4ef6-42e5-b859-5cb609e24907	ORD-9-20260529-0004	9	parcel	\N	\N	\N	\N	\N	\N	210.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	210.00	cash	paid	completed	\N	2026-05-29 13:38:32.350069	\N	2026-05-29 13:38:32.350069	\N	t	2026-05-29 13:38:32.350069	2026-05-29 13:38:44.884915
\.


--
-- TOC entry 5484 (class 0 OID 16776)
-- Dependencies: 252
-- Data for Name: outlet_creation_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.outlet_creation_log (id, outlet_id, created_by, creation_date, ip_address, user_agent, notes) FROM stdin;
\.


--
-- TOC entry 5464 (class 0 OID 16618)
-- Dependencies: 229
-- Data for Name: outlets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.outlets (id, uuid, name, address, phone, manager, email, username, password_hash, status, created_by, created_at, updated_at) FROM stdin;
7	0f57f02f-b7bf-47e1-90a7-45ced960af64	Nashik MG	MG Road	8010545021	Harsh	harsh@gmail.com	harsh	$2b$10$gmob8HbSTg.r3wGeMc.vn.HlJGDxMyg8wfrI76vkjo01lLLy8i3c6	active	\N	2026-05-28 15:11:32.502778	2026-05-28 15:55:04.767707
8	7a47adb5-5569-4cac-95f2-ae8f2eec2f73	Nashik Park	Nashik Road	8010545201	Raj	raj@gmail.com	raj	$2b$10$V0bw6OUTCvYjGPPXGXmoDOODewD7y245bSoCdf358ifAvm4.uN0Nu	active	\N	2026-05-28 15:57:34.697056	2026-05-28 15:57:34.697056
9	7df80f50-13b6-4875-9411-11ca080bef03	Amanora	Hadapsar Pune	9876543215	Pavan	pavan@gmail.com	pavan	$2b$10$8ceODh4kUYf8OYKfuJsGc.0zK8l3esqhUJTb2JJETG6nxonv//W2e	active	\N	2026-05-29 13:26:22.948062	2026-05-29 13:26:22.948062
\.


--
-- TOC entry 5487 (class 0 OID 16787)
-- Dependencies: 255
-- Data for Name: platform_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_availability (dish_id, platform, is_available, platform_price) FROM stdin;
\.


--
-- TOC entry 5488 (class 0 OID 16794)
-- Dependencies: 256
-- Data for Name: sales_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_summary (id, outlet_id, summary_date, total_revenue, total_orders, total_items_sold, offline_revenue, online_revenue, cash_revenue, digital_revenue, avg_order_value, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5490 (class 0 OID 16811)
-- Dependencies: 258
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, outlet_id, token, login_time, logout_time, ip_address, user_agent) FROM stdin;
1	4	7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjcsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2MTM1NSwiZXhwIjoxNzgwNTY2MTU1fQ.XRQb84Kwq1iU4cPTvDo3tnZzSycplfEbQ3cWFENfWs4	2026-05-28 15:12:35.317699	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
2	4	7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjcsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2Mzk2NCwiZXhwIjoxNzgwNTY4NzY0fQ.ZZE1GIHwJ8fFVCcqQhh-9j2PYyhXccozceNDX5KYPT0	2026-05-28 15:56:04.282586	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
3	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2NDE2OCwiZXhwIjoxNzgwNTY4OTY4fQ.gmza7G8Uj2-O3XQNHK9jB85_2Ek5YHX9M9hMhC4GXsI	2026-05-28 15:59:28.891001	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
4	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2NDcwOCwiZXhwIjoxNzgwNTY5NTA4fQ.E5RrVHvlENzLDYKcG47wiiHpGN0ZTKdC_hagHjVoja4	2026-05-28 16:08:28.779679	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
5	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2NDgxMSwiZXhwIjoxNzgwNTY5NjExfQ.UJquJxA4PkSAFkwuASez_4nQQzvJkYSBHuQhllxYRvk	2026-05-28 16:10:12.000179	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
6	4	7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjcsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2NTU0MCwiZXhwIjoxNzgwNTcwMzQwfQ.khVU_IZJfZjZbkgxyUaXQuKYlrygJaSrniqwxHyvPBI	2026-05-28 16:22:20.815587	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
7	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2NTkyMiwiZXhwIjoxNzgwNTcwNzIyfQ.i5fJgRWAAITWpm7YZzGuY0JLAhRAtW_MQKjEjvcJsYo	2026-05-28 16:28:42.325451	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
8	4	7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjcsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2NjE2MSwiZXhwIjoxNzgwNTcwOTYxfQ.VWdtPAtqBdkvv4-3VhEFtvwPPUFHess6G9EU4WJ-E9I	2026-05-28 16:32:41.992984	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
9	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2NjY1NywiZXhwIjoxNzgwNTcxNDU3fQ.txjN1BJ1rLfL8xX9otVgIkTvbi-jg7iVduNAbXJgnXo	2026-05-28 16:40:57.255433	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
10	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2NzQ0NywiZXhwIjoxNzgwNTcyMjQ3fQ.sbYZLmy3jGZchgxpQ_F3fmrJo_hwIEEtLy21AbqMIsU	2026-05-28 16:54:07.752684	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
11	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2NzY1NiwiZXhwIjoxNzgwNTcyNDU2fQ.ZfLwwW6uQ86NS6FJdGiQTYK2B00Ik3nH201WtmxcZUw	2026-05-28 16:57:36.88383	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
12	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2ODQxNiwiZXhwIjoxNzgwNTczMjE2fQ.2dQWzlsaGhxbAaCV69dTfaoF4SYO6vXYb7BbmsKyrqY	2026-05-28 17:10:16.338451	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
13	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk2OTU3MCwiZXhwIjoxNzgwNTc0MzcwfQ.rCA1j574L8S-hqBgYNpcuad97er3uqRGaqolU7nVNW8	2026-05-28 17:29:30.093015	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
14	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk3NDkyNywiZXhwIjoxNzgwNTc5NzI3fQ.WWKuy4e049rbTgQHv7SoO69gmQTI0SNkAmv7SqTf7ag	2026-05-28 18:58:47.231413	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
15	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk3NTAyNiwiZXhwIjoxNzgwNTc5ODI2fQ.u5hDRzT9MdbDrgQsjWfNKuEySe47NZZj_Nx46o96zVQ	2026-05-28 19:00:26.493375	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
16	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk3NTA1MSwiZXhwIjoxNzgwNTc5ODUxfQ.NvFqTESFZn_DN9xFouUsQaVQ-YfNike8defsbqo13uI	2026-05-28 19:00:51.292454	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
17	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk3NTExMiwiZXhwIjoxNzgwNTc5OTEyfQ.GfaBygzp6SOlum9PQE8wXucIHmKVubkJnLU4047HfzQ	2026-05-28 19:01:52.564016	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
18	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk3NTMyMSwiZXhwIjoxNzgwNTgwMTIxfQ.zyOOQ0x1HvbU7CnMiN8-K4Ntypd7qgi6yyKibq84PBI	2026-05-28 19:05:21.878722	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
19	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk3NTQ1NiwiZXhwIjoxNzgwNTgwMjU2fQ.oO87Q-iYNhPa8NXLM3Wzu7dUeXvuF90dnY_XpTB8GUs	2026-05-28 19:07:36.761055	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
20	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk3NTgyOSwiZXhwIjoxNzgwNTgwNjI5fQ.M3dMssEF7oA3gSO_Ai9beldzeUCSH2CeiNCLGiDOMdM	2026-05-28 19:13:49.126342	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
21	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk3NjI0NiwiZXhwIjoxNzgwNTgxMDQ2fQ.Pg9GPRnoPI-p8YJD-A58IUaOkV5vLkIiOlsHKvxS6pM	2026-05-28 19:20:46.546531	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
22	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk3NzE0OSwiZXhwIjoxNzgwNTgxOTQ5fQ.p99zjBh6C6LI9AvDK2RC_SpJGx40Iwl2A7TCr0RO-Xw	2026-05-28 19:35:49.257744	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
23	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc3OTk3OTE3MCwiZXhwIjoxNzgwNTgzOTcwfQ.MlViAouKy57ujBidK3ovkABbb4IdaZucU0iJdFfEoyQ	2026-05-28 20:09:30.812568	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
24	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc4MDAzNzYzMCwiZXhwIjoxNzgwNjQyNDMwfQ.nY4BHoul_E8VWUGcudif3EeW5tW139cC-JfyxIUu0WY	2026-05-29 12:23:50.712035	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
25	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc4MDA0MDgzNiwiZXhwIjoxNzgwNjQ1NjM2fQ.7Vakae4uPH2N3ijvrxvgxwi1oA6M5YkHgia90yyN81w	2026-05-29 13:17:16.427114	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
26	6	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjksImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc4MDA0MTQ5NSwiZXhwIjoxNzgwNjQ2Mjk1fQ.btabwX4hiuP2PcbOQ9a95uH0NQ_aTbLh0kzrcbb45n0	2026-05-29 13:28:15.985834	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
27	5	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjgsImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc4MDA0MTgxMSwiZXhwIjoxNzgwNjQ2NjExfQ.d8DPLb7EWO1sHmnHf5JrLfntSBFY9hBF33eJI-Wz2XY	2026-05-29 13:33:31.989694	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
28	6	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidHlwZSI6InVzZXIiLCJvdXRsZXRfaWQiOjksImFwcF9yb2xlIjoiQWRtaW4iLCJyb2xlX2xhYmVsIjoiTWFuYWdlciIsImlhdCI6MTc4MDA0MjEwMywiZXhwIjoxNzgwNjQ2OTAzfQ.gzEPcjXkqXn-F11F_uyQqg2BfmP54AiY0uPmYy9D_Qg	2026-05-29 13:38:23.38843	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0
\.


--
-- TOC entry 5492 (class 0 OID 16820)
-- Dependencies: 260
-- Data for Name: tax_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_records (id, outlet_id, order_id, taxable_value, cgst_rate, cgst_amount, sgst_rate, sgst_amount, total_gst, tax_period, created_at) FROM stdin;
\.


--
-- TOC entry 5494 (class 0 OID 16835)
-- Dependencies: 262
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, uuid, outlet_id, name, email, username, password_hash, role_label, app_role, permissions, status, created_at, updated_at, created_by) FROM stdin;
4	201e35ae-10d5-40a7-8c92-69e2b30b92a6	7	Samarth	samarth@gmail.com	samarth	$2b$10$C8wlSCRrV0JTDIHdg6UVSuFnsOjP.ApyOT0vIj/hMSE2Pee/y0fxy	Manager	Admin	{"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}	active	2026-05-28 15:12:19.16081	2026-05-28 15:12:19.16081	\N
5	39dbc825-0702-4f22-a7d8-21935f07a3bb	8	Raj	raj@gmail.com	raj	$2b$10$V0bw6OUTCvYjGPPXGXmoDOODewD7y245bSoCdf358ifAvm4.uN0Nu	Manager	Admin	{"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}	active	2026-05-28 15:57:34.697056	2026-05-28 15:57:34.697056	\N
6	8e193e9e-5af1-46e9-a222-6d9001c18027	9	Pavan	pavan@gmail.com	pavan	$2b$10$8ceODh4kUYf8OYKfuJsGc.0zK8l3esqhUJTb2JJETG6nxonv//W2e	Manager	Admin	{"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}	active	2026-05-29 13:26:22.948062	2026-05-29 13:26:22.948062	\N
\.


--
-- TOC entry 5521 (class 0 OID 0)
-- Dependencies: 221
-- Name: accounting_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounting_ledger_id_seq', 1, false);


--
-- TOC entry 5522 (class 0 OID 0)
-- Dependencies: 223
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 1, false);


--
-- TOC entry 5523 (class 0 OID 0)
-- Dependencies: 225
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_id_seq', 2, true);


--
-- TOC entry 5524 (class 0 OID 0)
-- Dependencies: 227
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 17, true);


--
-- TOC entry 5525 (class 0 OID 0)
-- Dependencies: 234
-- Name: dishes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dishes_id_seq', 5, true);


--
-- TOC entry 5526 (class 0 OID 0)
-- Dependencies: 236
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- TOC entry 5527 (class 0 OID 0)
-- Dependencies: 238
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 1, false);


--
-- TOC entry 5528 (class 0 OID 0)
-- Dependencies: 241
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 1, false);


--
-- TOC entry 5529 (class 0 OID 0)
-- Dependencies: 243
-- Name: kot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kot_id_seq', 16, true);


--
-- TOC entry 5530 (class 0 OID 0)
-- Dependencies: 245
-- Name: kot_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kot_items_id_seq', 16, true);


--
-- TOC entry 5531 (class 0 OID 0)
-- Dependencies: 248
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 5532 (class 0 OID 0)
-- Dependencies: 250
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 16, true);


--
-- TOC entry 5533 (class 0 OID 0)
-- Dependencies: 251
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 16, true);


--
-- TOC entry 5534 (class 0 OID 0)
-- Dependencies: 253
-- Name: outlet_creation_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.outlet_creation_log_id_seq', 1, true);


--
-- TOC entry 5535 (class 0 OID 0)
-- Dependencies: 254
-- Name: outlets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.outlets_id_seq', 9, true);


--
-- TOC entry 5536 (class 0 OID 0)
-- Dependencies: 257
-- Name: sales_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_summary_id_seq', 1, false);


--
-- TOC entry 5537 (class 0 OID 0)
-- Dependencies: 259
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 28, true);


--
-- TOC entry 5538 (class 0 OID 0)
-- Dependencies: 261
-- Name: tax_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tax_records_id_seq', 1, false);


--
-- TOC entry 5539 (class 0 OID 0)
-- Dependencies: 263
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- TOC entry 5150 (class 2606 OID 16872)
-- Name: accounting_ledger accounting_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger
    ADD CONSTRAINT accounting_ledger_pkey PRIMARY KEY (id);


--
-- TOC entry 5152 (class 2606 OID 16874)
-- Name: accounting_ledger accounting_ledger_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger
    ADD CONSTRAINT accounting_ledger_transaction_id_key UNIQUE (transaction_id);


--
-- TOC entry 5156 (class 2606 OID 16876)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5161 (class 2606 OID 16878)
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- TOC entry 5163 (class 2606 OID 16880)
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- TOC entry 5165 (class 2606 OID 16882)
-- Name: admin admin_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_username_key UNIQUE (username);


--
-- TOC entry 5167 (class 2606 OID 16884)
-- Name: admin admin_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_uuid_key UNIQUE (uuid);


--
-- TOC entry 5169 (class 2606 OID 16886)
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- TOC entry 5171 (class 2606 OID 16888)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5173 (class 2606 OID 16890)
-- Name: categories categories_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_uuid_key UNIQUE (uuid);


--
-- TOC entry 5191 (class 2606 OID 16892)
-- Name: dish_ingredients dish_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_ingredients
    ADD CONSTRAINT dish_ingredients_pkey PRIMARY KEY (dish_id, ingredient_id);


--
-- TOC entry 5193 (class 2606 OID 16894)
-- Name: dish_outlets dish_outlets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_outlets
    ADD CONSTRAINT dish_outlets_pkey PRIMARY KEY (dish_id, outlet_id);


--
-- TOC entry 5195 (class 2606 OID 16896)
-- Name: dishes dishes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (id);


--
-- TOC entry 5197 (class 2606 OID 16898)
-- Name: dishes dishes_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_uuid_key UNIQUE (uuid);


--
-- TOC entry 5201 (class 2606 OID 16900)
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- TOC entry 5204 (class 2606 OID 16902)
-- Name: ingredients ingredients_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_name_key UNIQUE (name);


--
-- TOC entry 5206 (class 2606 OID 16904)
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- TOC entry 5208 (class 2606 OID 16906)
-- Name: ingredients ingredients_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_uuid_key UNIQUE (uuid);


--
-- TOC entry 5213 (class 2606 OID 16908)
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5222 (class 2606 OID 16910)
-- Name: kot_items kot_items_kot_id_order_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_kot_id_order_item_id_key UNIQUE (kot_id, order_item_id);


--
-- TOC entry 5224 (class 2606 OID 16912)
-- Name: kot_items kot_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5217 (class 2606 OID 16914)
-- Name: kot kot_kot_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_kot_number_key UNIQUE (kot_number);


--
-- TOC entry 5219 (class 2606 OID 16916)
-- Name: kot kot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_pkey PRIMARY KEY (id);


--
-- TOC entry 5228 (class 2606 OID 16918)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5231 (class 2606 OID 16920)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5179 (class 2606 OID 16922)
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 5181 (class 2606 OID 16924)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5183 (class 2606 OID 16926)
-- Name: orders orders_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_uuid_key UNIQUE (uuid);


--
-- TOC entry 5233 (class 2606 OID 16928)
-- Name: outlet_creation_log outlet_creation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log
    ADD CONSTRAINT outlet_creation_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5185 (class 2606 OID 16930)
-- Name: outlets outlets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_pkey PRIMARY KEY (id);


--
-- TOC entry 5187 (class 2606 OID 16932)
-- Name: outlets outlets_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_username_key UNIQUE (username);


--
-- TOC entry 5189 (class 2606 OID 16934)
-- Name: outlets outlets_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_uuid_key UNIQUE (uuid);


--
-- TOC entry 5235 (class 2606 OID 16936)
-- Name: platform_availability platform_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_availability
    ADD CONSTRAINT platform_availability_pkey PRIMARY KEY (dish_id, platform);


--
-- TOC entry 5238 (class 2606 OID 16938)
-- Name: sales_summary sales_summary_outlet_id_summary_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_summary
    ADD CONSTRAINT sales_summary_outlet_id_summary_date_key UNIQUE (outlet_id, summary_date);


--
-- TOC entry 5240 (class 2606 OID 16940)
-- Name: sales_summary sales_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_summary
    ADD CONSTRAINT sales_summary_pkey PRIMARY KEY (id);


--
-- TOC entry 5244 (class 2606 OID 16942)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5247 (class 2606 OID 16944)
-- Name: tax_records tax_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records
    ADD CONSTRAINT tax_records_pkey PRIMARY KEY (id);


--
-- TOC entry 5249 (class 2606 OID 16946)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5251 (class 2606 OID 16948)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5253 (class 2606 OID 16950)
-- Name: users users_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uuid_key UNIQUE (uuid);


--
-- TOC entry 5157 (class 1259 OID 16951)
-- Name: idx_activity_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_admin ON public.activity_logs USING btree (admin_id);


--
-- TOC entry 5158 (class 1259 OID 16952)
-- Name: idx_activity_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_created ON public.activity_logs USING btree (created_at);


--
-- TOC entry 5159 (class 1259 OID 16953)
-- Name: idx_activity_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_user ON public.activity_logs USING btree (user_id);


--
-- TOC entry 5198 (class 1259 OID 16954)
-- Name: idx_dishes_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dishes_category ON public.dishes USING btree (category_id);


--
-- TOC entry 5199 (class 1259 OID 16955)
-- Name: idx_dishes_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dishes_name ON public.dishes USING gin (to_tsvector('english'::regconfig, (name)::text));


--
-- TOC entry 5202 (class 1259 OID 16956)
-- Name: idx_expenses_outlet_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_outlet_date ON public.expenses USING btree (outlet_id, expense_date);


--
-- TOC entry 5209 (class 1259 OID 16957)
-- Name: idx_inventory_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_date ON public.inventory_transactions USING btree (transaction_date);


--
-- TOC entry 5210 (class 1259 OID 16958)
-- Name: idx_inventory_ingredient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_ingredient ON public.inventory_transactions USING btree (ingredient_id);


--
-- TOC entry 5211 (class 1259 OID 16959)
-- Name: idx_inventory_outlet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_outlet ON public.inventory_transactions USING btree (outlet_id);


--
-- TOC entry 5220 (class 1259 OID 16960)
-- Name: idx_kot_items_kot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kot_items_kot ON public.kot_items USING btree (kot_id);


--
-- TOC entry 5214 (class 1259 OID 16961)
-- Name: idx_kot_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kot_order ON public.kot USING btree (order_id);


--
-- TOC entry 5215 (class 1259 OID 16962)
-- Name: idx_kot_outlet_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kot_outlet_status ON public.kot USING btree (outlet_id, status);


--
-- TOC entry 5153 (class 1259 OID 16963)
-- Name: idx_ledger_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_date ON public.accounting_ledger USING btree (payment_date);


--
-- TOC entry 5154 (class 1259 OID 16964)
-- Name: idx_ledger_outlet_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_outlet_status ON public.accounting_ledger USING btree (outlet_id, status);


--
-- TOC entry 5225 (class 1259 OID 16965)
-- Name: idx_notifications_admin_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_admin_unread ON public.notifications USING btree (admin_id, is_read);


--
-- TOC entry 5226 (class 1259 OID 16966)
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read);


--
-- TOC entry 5229 (class 1259 OID 16967)
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- TOC entry 5174 (class 1259 OID 16968)
-- Name: idx_orders_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_date ON public.orders USING btree (order_time);


--
-- TOC entry 5175 (class 1259 OID 16969)
-- Name: idx_orders_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_number ON public.orders USING btree (order_number);


--
-- TOC entry 5176 (class 1259 OID 16970)
-- Name: idx_orders_outlet_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_outlet_status ON public.orders USING btree (outlet_id, order_status);


--
-- TOC entry 5177 (class 1259 OID 16971)
-- Name: idx_orders_platform; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_platform ON public.orders USING btree (platform_order_id);


--
-- TOC entry 5236 (class 1259 OID 16972)
-- Name: idx_sales_summary_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sales_summary_date ON public.sales_summary USING btree (summary_date);


--
-- TOC entry 5241 (class 1259 OID 16973)
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (token);


--
-- TOC entry 5242 (class 1259 OID 16974)
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user ON public.sessions USING btree (user_id);


--
-- TOC entry 5245 (class 1259 OID 16975)
-- Name: idx_tax_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_period ON public.tax_records USING btree (tax_period);


--
-- TOC entry 5298 (class 2620 OID 16976)
-- Name: orders trigger_calculate_order_total; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_calculate_order_total BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.calculate_order_total();


--
-- TOC entry 5299 (class 2620 OID 16977)
-- Name: orders trigger_update_inventory; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_inventory AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_inventory_on_order_completion();


--
-- TOC entry 5295 (class 2620 OID 16978)
-- Name: accounting_ledger update_accounting_ledger_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_accounting_ledger_updated_at BEFORE UPDATE ON public.accounting_ledger FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5296 (class 2620 OID 16979)
-- Name: admin update_admin_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON public.admin FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5297 (class 2620 OID 16980)
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5301 (class 2620 OID 16981)
-- Name: dishes update_dishes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5302 (class 2620 OID 16982)
-- Name: ingredients update_ingredients_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5300 (class 2620 OID 16983)
-- Name: outlets update_outlets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_outlets_updated_at BEFORE UPDATE ON public.outlets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5303 (class 2620 OID 16984)
-- Name: sales_summary update_sales_summary_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_sales_summary_updated_at BEFORE UPDATE ON public.sales_summary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5304 (class 2620 OID 16985)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5254 (class 2606 OID 16986)
-- Name: accounting_ledger accounting_ledger_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger
    ADD CONSTRAINT accounting_ledger_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- TOC entry 5255 (class 2606 OID 16991)
-- Name: accounting_ledger accounting_ledger_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger
    ADD CONSTRAINT accounting_ledger_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5256 (class 2606 OID 16996)
-- Name: activity_logs activity_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5257 (class 2606 OID 17001)
-- Name: activity_logs activity_logs_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE SET NULL;


--
-- TOC entry 5258 (class 2606 OID 17006)
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5259 (class 2606 OID 17011)
-- Name: categories categories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5263 (class 2606 OID 17016)
-- Name: dish_ingredients dish_ingredients_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_ingredients
    ADD CONSTRAINT dish_ingredients_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- TOC entry 5264 (class 2606 OID 17021)
-- Name: dish_ingredients dish_ingredients_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_ingredients
    ADD CONSTRAINT dish_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- TOC entry 5265 (class 2606 OID 17026)
-- Name: dish_outlets dish_outlets_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_outlets
    ADD CONSTRAINT dish_outlets_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- TOC entry 5266 (class 2606 OID 17031)
-- Name: dish_outlets dish_outlets_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_outlets
    ADD CONSTRAINT dish_outlets_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5267 (class 2606 OID 17036)
-- Name: dishes dishes_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 5268 (class 2606 OID 17041)
-- Name: dishes dishes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5269 (class 2606 OID 17046)
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5270 (class 2606 OID 17051)
-- Name: expenses expenses_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5271 (class 2606 OID 17056)
-- Name: ingredients ingredients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5272 (class 2606 OID 17061)
-- Name: inventory_transactions inventory_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5273 (class 2606 OID 17066)
-- Name: inventory_transactions inventory_transactions_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- TOC entry 5274 (class 2606 OID 17071)
-- Name: inventory_transactions inventory_transactions_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5275 (class 2606 OID 17076)
-- Name: kot kot_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5278 (class 2606 OID 17081)
-- Name: kot_items kot_items_kot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_kot_id_fkey FOREIGN KEY (kot_id) REFERENCES public.kot(id) ON DELETE CASCADE;


--
-- TOC entry 5279 (class 2606 OID 17086)
-- Name: kot_items kot_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- TOC entry 5276 (class 2606 OID 17091)
-- Name: kot kot_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5277 (class 2606 OID 17096)
-- Name: kot kot_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5280 (class 2606 OID 17101)
-- Name: notifications notifications_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id) ON DELETE CASCADE;


--
-- TOC entry 5281 (class 2606 OID 17106)
-- Name: notifications notifications_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5282 (class 2606 OID 17111)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5283 (class 2606 OID 17116)
-- Name: order_items order_items_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE RESTRICT;


--
-- TOC entry 5284 (class 2606 OID 17121)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5260 (class 2606 OID 17126)
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5261 (class 2606 OID 17131)
-- Name: orders orders_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5285 (class 2606 OID 17136)
-- Name: outlet_creation_log outlet_creation_log_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log
    ADD CONSTRAINT outlet_creation_log_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE CASCADE;


--
-- TOC entry 5286 (class 2606 OID 17141)
-- Name: outlet_creation_log outlet_creation_log_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log
    ADD CONSTRAINT outlet_creation_log_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5262 (class 2606 OID 17146)
-- Name: outlets outlets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5287 (class 2606 OID 17151)
-- Name: platform_availability platform_availability_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_availability
    ADD CONSTRAINT platform_availability_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- TOC entry 5288 (class 2606 OID 17156)
-- Name: sales_summary sales_summary_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_summary
    ADD CONSTRAINT sales_summary_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5289 (class 2606 OID 17161)
-- Name: sessions sessions_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE SET NULL;


--
-- TOC entry 5290 (class 2606 OID 17166)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5291 (class 2606 OID 17171)
-- Name: tax_records tax_records_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records
    ADD CONSTRAINT tax_records_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- TOC entry 5292 (class 2606 OID 17176)
-- Name: tax_records tax_records_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records
    ADD CONSTRAINT tax_records_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5293 (class 2606 OID 17181)
-- Name: users users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5294 (class 2606 OID 17186)
-- Name: users users_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


-- Completed on 2026-05-29 15:13:27

--
-- PostgreSQL database dump complete
--

\unrestrict mpo4U8uLVexsoyJF92oj8X6iP6qgCy1xswBciIrczExFtSkldnGHew0g9bYxCac

