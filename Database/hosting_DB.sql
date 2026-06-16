--
-- PostgreSQL database dump
--

\restrict HkGd0NXNqaocCvLIHetkUJ3qJXJHZyV1PZJBymduhNLlxGb5m9EHTjuWQ5ZHHt9

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.1

-- Started on 2026-06-16 10:44:48

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
-- TOC entry 6 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 2 (class 3079 OID 17224)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5410 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 953 (class 1247 OID 17364)
-- Name: admin_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.admin_role_enum AS ENUM (
    'SUPER_ADMIN',
    'ADMIN'
);


ALTER TYPE public.admin_role_enum OWNER TO postgres;

--
-- TOC entry 917 (class 1247 OID 17252)
-- Name: app_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.app_role_enum AS ENUM (
    'Admin',
    'Staff'
);


ALTER TYPE public.app_role_enum OWNER TO postgres;

--
-- TOC entry 935 (class 1247 OID 17312)
-- Name: discount_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.discount_type_enum AS ENUM (
    'percentage',
    'fixed'
);


ALTER TYPE public.discount_type_enum OWNER TO postgres;

--
-- TOC entry 944 (class 1247 OID 17338)
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
-- TOC entry 932 (class 1247 OID 17300)
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
-- TOC entry 941 (class 1247 OID 17328)
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
-- TOC entry 950 (class 1247 OID 17354)
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
-- TOC entry 929 (class 1247 OID 17288)
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
-- TOC entry 920 (class 1247 OID 17258)
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
-- TOC entry 923 (class 1247 OID 17268)
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
-- TOC entry 926 (class 1247 OID 17280)
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'pending',
    'paid',
    'refunded'
);


ALTER TYPE public.payment_status_enum OWNER TO postgres;

--
-- TOC entry 947 (class 1247 OID 17348)
-- Name: platform_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.platform_enum AS ENUM (
    'swiggy',
    'zomato'
);


ALTER TYPE public.platform_enum OWNER TO postgres;

--
-- TOC entry 911 (class 1247 OID 17236)
-- Name: status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_enum AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.status_enum OWNER TO postgres;

--
-- TOC entry 938 (class 1247 OID 17318)
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
-- TOC entry 914 (class 1247 OID 17242)
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
-- TOC entry 277 (class 1255 OID 18016)
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
-- TOC entry 278 (class 1255 OID 18018)
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
-- TOC entry 276 (class 1255 OID 18007)
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
-- TOC entry 262 (class 1259 OID 18203)
-- Name: accounting_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounting_ledger (
    id integer NOT NULL,
    transaction_id character varying(50) NOT NULL,
    order_id integer,
    outlet_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_date date,
    bill_uploaded boolean DEFAULT false,
    status public.ledger_status_enum DEFAULT 'pending'::public.ledger_status_enum,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    order_date date,
    delivery_date date,
    bill_url character varying(255)
);


ALTER TABLE public.accounting_ledger OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 18216)
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
-- TOC entry 5411 (class 0 OID 0)
-- Dependencies: 263
-- Name: accounting_ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounting_ledger_id_seq OWNED BY public.accounting_ledger.id;


--
-- TOC entry 256 (class 1259 OID 17946)
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
-- TOC entry 255 (class 1259 OID 17945)
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
-- TOC entry 5412 (class 0 OID 0)
-- Dependencies: 255
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
-- TOC entry 5413 (class 0 OID 0)
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
-- TOC entry 5414 (class 0 OID 0)
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_url character varying(500)
);


ALTER TABLE public.outlets OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 18020)
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
    image_url character varying(500),
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
-- TOC entry 5415 (class 0 OID 0)
-- Dependencies: 230
-- Name: dishes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dishes_id_seq OWNED BY public.dishes.id;


--
-- TOC entry 250 (class 1259 OID 17866)
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
-- TOC entry 249 (class 1259 OID 17865)
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
-- TOC entry 5416 (class 0 OID 0)
-- Dependencies: 249
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
-- TOC entry 5417 (class 0 OID 0)
-- Dependencies: 234
-- Name: ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredients_id_seq OWNED BY public.ingredients.id;


--
-- TOC entry 261 (class 1259 OID 18030)
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
-- TOC entry 5418 (class 0 OID 0)
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
-- TOC entry 5419 (class 0 OID 0)
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
-- TOC entry 5420 (class 0 OID 0)
-- Dependencies: 245
-- Name: kot_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kot_items_id_seq OWNED BY public.kot_items.id;


--
-- TOC entry 260 (class 1259 OID 18025)
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
-- TOC entry 258 (class 1259 OID 17976)
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
-- TOC entry 257 (class 1259 OID 17975)
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
-- TOC entry 5421 (class 0 OID 0)
-- Dependencies: 257
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
-- TOC entry 5422 (class 0 OID 0)
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
-- TOC entry 5423 (class 0 OID 0)
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
-- TOC entry 5424 (class 0 OID 0)
-- Dependencies: 224
-- Name: outlet_creation_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.outlet_creation_log_id_seq OWNED BY public.outlet_creation_log.id;


--
-- TOC entry 265 (class 1259 OID 18260)
-- Name: outlet_integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.outlet_integrations (
    id integer NOT NULL,
    outlet_id integer NOT NULL,
    access_token character varying(255) NOT NULL,
    swiggy_id character varying(100),
    zomato_id character varying(100)
);


ALTER TABLE public.outlet_integrations OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 18259)
-- Name: outlet_integrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.outlet_integrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.outlet_integrations_id_seq OWNER TO postgres;

--
-- TOC entry 5425 (class 0 OID 0)
-- Dependencies: 264
-- Name: outlet_integrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.outlet_integrations_id_seq OWNED BY public.outlet_integrations.id;


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
-- TOC entry 5426 (class 0 OID 0)
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
-- TOC entry 248 (class 1259 OID 17838)
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
-- TOC entry 247 (class 1259 OID 17837)
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
-- TOC entry 5427 (class 0 OID 0)
-- Dependencies: 247
-- Name: sales_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_summary_id_seq OWNED BY public.sales_summary.id;


--
-- TOC entry 254 (class 1259 OID 17922)
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
-- TOC entry 253 (class 1259 OID 17921)
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
-- TOC entry 5428 (class 0 OID 0)
-- Dependencies: 253
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- TOC entry 252 (class 1259 OID 17893)
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
-- TOC entry 251 (class 1259 OID 17892)
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
-- TOC entry 5429 (class 0 OID 0)
-- Dependencies: 251
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
-- TOC entry 5430 (class 0 OID 0)
-- Dependencies: 226
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 5031 (class 2604 OID 18217)
-- Name: accounting_ledger id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger ALTER COLUMN id SET DEFAULT nextval('public.accounting_ledger_id_seq'::regclass);


--
-- TOC entry 5025 (class 2604 OID 18218)
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- TOC entry 4933 (class 2604 OID 18219)
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- TOC entry 4954 (class 2604 OID 18220)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4960 (class 2604 OID 18221)
-- Name: dishes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes ALTER COLUMN id SET DEFAULT nextval('public.dishes_id_seq'::regclass);


--
-- TOC entry 5013 (class 2604 OID 18222)
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 18223)
-- Name: ingredients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients ALTER COLUMN id SET DEFAULT nextval('public.ingredients_id_seq'::regclass);


--
-- TOC entry 4976 (class 2604 OID 18224)
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- TOC entry 4996 (class 2604 OID 18225)
-- Name: kot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot ALTER COLUMN id SET DEFAULT nextval('public.kot_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 18226)
-- Name: kot_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items ALTER COLUMN id SET DEFAULT nextval('public.kot_items_id_seq'::regclass);


--
-- TOC entry 5027 (class 2604 OID 18227)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4992 (class 2604 OID 18228)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 4978 (class 2604 OID 18229)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 4946 (class 2604 OID 18230)
-- Name: outlet_creation_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log ALTER COLUMN id SET DEFAULT nextval('public.outlet_creation_log_id_seq'::regclass);


--
-- TOC entry 5036 (class 2604 OID 18263)
-- Name: outlet_integrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_integrations ALTER COLUMN id SET DEFAULT nextval('public.outlet_integrations_id_seq'::regclass);


--
-- TOC entry 4941 (class 2604 OID 18231)
-- Name: outlets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets ALTER COLUMN id SET DEFAULT nextval('public.outlets_id_seq'::regclass);


--
-- TOC entry 5002 (class 2604 OID 18232)
-- Name: sales_summary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_summary ALTER COLUMN id SET DEFAULT nextval('public.sales_summary_id_seq'::regclass);


--
-- TOC entry 5023 (class 2604 OID 18233)
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- TOC entry 5015 (class 2604 OID 18234)
-- Name: tax_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records ALTER COLUMN id SET DEFAULT nextval('public.tax_records_id_seq'::regclass);


--
-- TOC entry 4948 (class 2604 OID 18235)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5401 (class 0 OID 18203)
-- Dependencies: 262
-- Data for Name: accounting_ledger; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounting_ledger (id, transaction_id, order_id, outlet_id, amount, payment_date, bill_uploaded, status, notes, created_at, updated_at, order_date, delivery_date, bill_url) FROM stdin;
20	TR1234	\N	6	150000.00	\N	t	pending	\N	2026-06-04 10:42:26.308351	2026-06-04 10:43:28.359694	2026-06-04	\N	/uploads/accounting/bill-1780550008280-816002407.jpeg
21	qwq21	\N	8	19000.00	2026-06-07	t	paid	\N	2026-06-05 14:29:21.175258	2026-06-05 14:29:39.851428	2026-06-04	2026-06-07	/uploads/accounting/bill-1780649979835-569909079.png
22	TR12345	\N	9	15000.00	\N	f	pending	\N	2026-06-06 12:01:48.266281	2026-06-06 12:01:48.266281	2026-06-06	\N	\N
\.


--
-- TOC entry 5398 (class 0 OID 17946)
-- Dependencies: 256
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, outlet_id, admin_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at) FROM stdin;
1	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-02 15:08:17.188897
2	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-02 16:42:45.084738
101	\N	12	2	OUTLET_CREATE	outlet	12	\N	{"id": 12, "name": "Kharghar", "uuid": "58c46a00-9804-4294-9e40-c37fe6411e4d", "email": "avanit@gmail.com", "phone": "9820638026", "status": "active", "address": "kharghar navi mumbai", "manager": "avanit", "username": "avanit", "swiggy_id": "1234", "zomato_id": "2345", "created_at": "2026-06-06T07:35:58.743Z", "updated_at": "2026-06-06T07:35:58.743Z", "access_token": "788f83dbaa7d4c91b2435b0fc84034d5"}	::1	2026-06-06 13:05:58.934594
108	\N	\N	2	DISH_CREATE	dish	5	\N	{"id": 5, "cat": null, "veg": true, "name": "Diet Toast Sandwich", "uuid": "88a7018d-0f73-4f5e-b8c8-07e7ffd0b5af", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/a2faa71a-a1d2-4f28-b7b4-b3311a56ec88.jpg", "created_at": "2026-06-06T09:44:05.747Z", "created_by": null, "dine_price": "100.00", "updated_at": "2026-06-06T09:44:05.747Z", "category_id": 18, "ingredients": ["Fresh veggie", "green chutney", "special herbs and spices."], "is_available": true, "parcel_price": "200.00", "swiggy_price": "300.00", "zomato_price": "500.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-06 15:14:05.959365
38	\N	\N	2	DISH_UPDATE	dish	11	{"id": 11, "cat": null, "veg": true, "name": "T17", "uuid": "82ea8ffb-527c-427d-81d8-b575218c2687", "emoji": null, "outlets": ["Seewoods"], "image_url": "/uploads/dishes/9d4d4a07-1f09-4efd-9da6-581f080053df.jpg", "created_at": "2026-05-29T08:30:45.973Z", "created_by": null, "dine_price": "79.00", "updated_at": "2026-06-04T06:06:33.496Z", "category_id": 18, "ingredients": ["dscfswf"], "is_available": true, "parcel_price": "8451.00", "swiggy_price": "58.00", "zomato_price": "547.00", "category_name": "Sandwiches", "time_required": null}	{"id": 11, "cat": null, "veg": true, "name": "burger", "uuid": "82ea8ffb-527c-427d-81d8-b575218c2687", "emoji": null, "outlets": ["Seewoods"], "image_url": "/uploads/dishes/9d4d4a07-1f09-4efd-9da6-581f080053df.jpg", "created_at": "2026-05-29T08:30:45.973Z", "created_by": null, "dine_price": "79.00", "updated_at": "2026-06-04T06:19:25.083Z", "category_id": 18, "ingredients": ["dscfswf"], "is_available": true, "parcel_price": "8451.00", "swiggy_price": "58.00", "zomato_price": "547.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-04 11:49:25.342577
6	\N	\N	2	DISH_UPDATE	dish	12	{"id": 12, "cat": null, "veg": true, "name": "chicken Sandwitch", "uuid": "6b0dd1ee-4637-476b-b956-0cef13fa6971", "emoji": null, "outlets": ["Seewoods", "Nerul"], "image_url": "/uploads/dishes/da23661e-6c20-4786-8d0c-0b6e4e28faf9.jpg", "created_at": "2026-05-30T04:52:44.911Z", "created_by": null, "dine_price": "123.00", "updated_at": "2026-05-30T04:52:44.911Z", "category_id": 18, "ingredients": ["qwertyui"], "is_available": true, "parcel_price": "154.00", "swiggy_price": "154.00", "zomato_price": "154.00", "category_name": "Sandwiches", "time_required": null}	{"id": 12, "cat": null, "veg": true, "name": "chicken Sandwitch", "uuid": "6b0dd1ee-4637-476b-b956-0cef13fa6971", "emoji": null, "outlets": ["Seewoods", "Nerul", "Dombivli"], "image_url": "/uploads/dishes/da23661e-6c20-4786-8d0c-0b6e4e28faf9.jpg", "created_at": "2026-05-30T04:52:44.911Z", "created_by": null, "dine_price": "123.00", "updated_at": "2026-06-02T11:19:07.680Z", "category_id": 18, "ingredients": ["qwertyui"], "is_available": true, "parcel_price": "154.00", "swiggy_price": "154.00", "zomato_price": "154.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-02 16:49:07.89014
115	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	192.168.1.10	2026-06-06 15:36:13.630289
44	\N	\N	2	DISH_DELETE	dish	1	{"id": 1, "cat": null, "veg": true, "name": "biryani", "uuid": "1d564641-e15d-48b4-ba15-f5ddf5ade574", "emoji": null, "outlets": ["Seewoods"], "image_url": "/uploads/dishes/10644d6e-fc06-4f3e-969a-0a0d4a8ed045.jpeg", "created_at": "2026-06-04T06:20:21.872Z", "created_by": null, "dine_price": "89.00", "updated_at": "2026-06-04T06:20:21.872Z", "category_id": 18, "ingredients": ["dfghj"], "is_available": true, "parcel_price": "5.00", "swiggy_price": "85.00", "zomato_price": "4512.00", "category_name": "Sandwiches", "time_required": null}	\N	::1	2026-06-05 14:26:25.371624
48	\N	\N	2	DISH_UPDATE	dish	11	{"id": 11, "cat": null, "veg": true, "name": "burger", "uuid": "82ea8ffb-527c-427d-81d8-b575218c2687", "emoji": null, "outlets": ["Seewoods"], "image_url": "/uploads/dishes/9d4d4a07-1f09-4efd-9da6-581f080053df.jpg", "created_at": "2026-05-29T08:30:45.973Z", "created_by": null, "dine_price": "79.00", "updated_at": "2026-06-04T06:19:25.083Z", "category_id": 18, "ingredients": ["dscfswf"], "is_available": true, "parcel_price": "8451.00", "swiggy_price": "58.00", "zomato_price": "547.00", "category_name": "Sandwiches", "time_required": null}	{"id": 11, "cat": null, "veg": true, "name": "burger", "uuid": "82ea8ffb-527c-427d-81d8-b575218c2687", "emoji": null, "outlets": ["Seewoods", "lala company"], "image_url": "/uploads/dishes/9d4d4a07-1f09-4efd-9da6-581f080053df.jpg", "created_at": "2026-05-29T08:30:45.973Z", "created_by": null, "dine_price": "79.00", "updated_at": "2026-06-05T09:01:18.960Z", "category_id": 18, "ingredients": ["dscfswf"], "is_available": true, "parcel_price": "8451.00", "swiggy_price": "58.00", "zomato_price": "547.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-05 14:31:18.967954
49	\N	\N	2	DISH_UPDATE	dish	2	{"id": 2, "cat": null, "veg": true, "name": "biryani", "uuid": "6950a886-a41d-4c71-99a5-120f7a9861ca", "emoji": null, "outlets": ["Seewoods"], "image_url": "/uploads/dishes/0552058a-2584-4fb3-bd53-a48360ede2b6.png", "created_at": "2026-06-05T08:57:21.936Z", "created_by": null, "dine_price": "850.00", "updated_at": "2026-06-05T08:57:21.936Z", "category_id": 18, "ingredients": ["wertyuio"], "is_available": true, "parcel_price": "950.00", "swiggy_price": "950.00", "zomato_price": "950.00", "category_name": "Sandwiches", "time_required": null}	{"id": 2, "cat": null, "veg": true, "name": "biryani", "uuid": "6950a886-a41d-4c71-99a5-120f7a9861ca", "emoji": null, "outlets": ["Seewoods", "lala company"], "image_url": "/uploads/dishes/0552058a-2584-4fb3-bd53-a48360ede2b6.png", "created_at": "2026-06-05T08:57:21.936Z", "created_by": null, "dine_price": "850.00", "updated_at": "2026-06-05T09:01:25.897Z", "category_id": 18, "ingredients": ["wertyuio"], "is_available": true, "parcel_price": "950.00", "swiggy_price": "950.00", "zomato_price": "950.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-05 14:31:25.90578
15	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-03 17:38:57.042133
16	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-03 17:52:09.418377
21	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	10.218.95.17	2026-06-03 18:12:22.981656
102	\N	13	2	OUTLET_CREATE	outlet	13	\N	{"id": 13, "name": "Seawood", "uuid": "9c25306e-9e27-4d16-8a2b-ab16c86382ac", "email": "tabish@gmial.com", "phone": "9372475762", "status": "active", "address": "Seawood navi mumbai", "manager": "tabish", "username": "tabish", "swiggy_id": "1234", "zomato_id": "2345", "created_at": "2026-06-06T08:58:47.860Z", "updated_at": "2026-06-06T08:58:47.860Z", "access_token": "788f83dbaa7d4c91b2435b0fc84034d5"}	::1	2026-06-06 14:28:48.100655
31	\N	\N	2	DISH_UPDATE	dish	12	{"id": 12, "cat": null, "veg": true, "name": "chicken Sandwitch", "uuid": "6b0dd1ee-4637-476b-b956-0cef13fa6971", "emoji": null, "outlets": [], "image_url": "/uploads/dishes/da23661e-6c20-4786-8d0c-0b6e4e28faf9.jpg", "created_at": "2026-05-30T04:52:44.911Z", "created_by": null, "dine_price": "123.00", "updated_at": "2026-06-02T11:19:07.680Z", "category_id": 18, "ingredients": ["qwertyui"], "is_available": true, "parcel_price": "154.00", "swiggy_price": "154.00", "zomato_price": "154.00", "category_name": "Sandwiches", "time_required": null}	{"id": 12, "cat": null, "veg": true, "name": "chicken Sandwitch", "uuid": "6b0dd1ee-4637-476b-b956-0cef13fa6971", "emoji": null, "outlets": ["Seewoods"], "image_url": "/uploads/dishes/da23661e-6c20-4786-8d0c-0b6e4e28faf9.jpg", "created_at": "2026-05-30T04:52:44.911Z", "created_by": null, "dine_price": "123.00", "updated_at": "2026-06-04T06:06:30.657Z", "category_id": 18, "ingredients": ["qwertyui"], "is_available": true, "parcel_price": "154.00", "swiggy_price": "154.00", "zomato_price": "154.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-04 11:36:30.668821
32	\N	\N	2	DISH_UPDATE	dish	11	{"id": 11, "cat": null, "veg": true, "name": "T17", "uuid": "82ea8ffb-527c-427d-81d8-b575218c2687", "emoji": null, "outlets": [], "image_url": "/uploads/dishes/9d4d4a07-1f09-4efd-9da6-581f080053df.jpg", "created_at": "2026-05-29T08:30:45.973Z", "created_by": null, "dine_price": "79.00", "updated_at": "2026-05-29T08:30:45.973Z", "category_id": 18, "ingredients": ["dscfswf"], "is_available": true, "parcel_price": "8451.00", "swiggy_price": "58.00", "zomato_price": "547.00", "category_name": "Sandwiches", "time_required": null}	{"id": 11, "cat": null, "veg": true, "name": "T17", "uuid": "82ea8ffb-527c-427d-81d8-b575218c2687", "emoji": null, "outlets": ["Seewoods"], "image_url": "/uploads/dishes/9d4d4a07-1f09-4efd-9da6-581f080053df.jpg", "created_at": "2026-05-29T08:30:45.973Z", "created_by": null, "dine_price": "79.00", "updated_at": "2026-06-04T06:06:33.496Z", "category_id": 18, "ingredients": ["dscfswf"], "is_available": true, "parcel_price": "8451.00", "swiggy_price": "58.00", "zomato_price": "547.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-04 11:36:33.502541
109	\N	\N	2	DISH_CREATE	dish	6	\N	{"id": 6, "cat": null, "veg": true, "name": "Paneer Tikka Panini", "uuid": "5cf03be8-418c-46d7-8e02-d73dfc6b4500", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/614474ac-c273-4f88-b48f-9f3fd4276fe0.jpg", "created_at": "2026-06-06T09:45:10.914Z", "created_by": null, "dine_price": "100.00", "updated_at": "2026-06-06T09:45:10.914Z", "category_id": 21, "ingredients": ["Tandoori paneer", "onion", "capsicum", "cheese", "cabbage"], "is_available": true, "parcel_price": "110.00", "swiggy_price": "200.00", "zomato_price": "120.00", "category_name": "Snacks", "time_required": null}	::1	2026-06-06 15:15:10.996759
116	\N	\N	2	ADMIN_LOGOUT	admin	2	\N	\N	192.168.1.10	2026-06-06 15:37:22.352039
39	\N	\N	2	DISH_CREATE	dish	1	\N	{"id": 1, "cat": null, "veg": true, "name": "biryani", "uuid": "1d564641-e15d-48b4-ba15-f5ddf5ade574", "emoji": null, "outlets": ["Seewoods"], "image_url": "/uploads/dishes/10644d6e-fc06-4f3e-969a-0a0d4a8ed045.jpeg", "created_at": "2026-06-04T06:20:21.872Z", "created_by": null, "dine_price": "89.00", "updated_at": "2026-06-04T06:20:21.872Z", "category_id": 18, "ingredients": ["dfghj"], "is_available": true, "parcel_price": "5.00", "swiggy_price": "85.00", "zomato_price": "4512.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-04 11:50:21.949171
121	\N	\N	2	DISH_CREATE	dish	9	\N	{"id": 9, "cat": null, "veg": true, "name": "Butterscotch Milkshake", "uuid": "172db79d-344f-4f3d-ba56-ef2c30c1f4b5", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/4cd05f73-9046-468e-b9c5-7ba5ff914fae.jpg", "created_at": "2026-06-06T10:43:43.011Z", "created_by": null, "dine_price": "100.00", "updated_at": "2026-06-06T10:43:43.011Z", "category_id": 9, "ingredients": ["shake with Butterscotch"], "is_available": true, "parcel_price": "120.00", "swiggy_price": "130.00", "zomato_price": "150.00", "category_name": "Shakes & Smoothies", "time_required": null}	::1	2026-06-06 16:13:43.095031
45	\N	\N	2	DISH_CREATE	dish	2	\N	{"id": 2, "cat": null, "veg": true, "name": "biryani", "uuid": "6950a886-a41d-4c71-99a5-120f7a9861ca", "emoji": null, "outlets": ["Seewoods"], "image_url": "/uploads/dishes/0552058a-2584-4fb3-bd53-a48360ede2b6.png", "created_at": "2026-06-05T08:57:21.936Z", "created_by": null, "dine_price": "850.00", "updated_at": "2026-06-05T08:57:21.936Z", "category_id": 18, "ingredients": ["wertyuio"], "is_available": true, "parcel_price": "950.00", "swiggy_price": "950.00", "zomato_price": "950.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-05 14:27:22.196297
126	\N	\N	2	DISH_CREATE	dish	14	\N	{"id": 14, "cat": null, "veg": true, "name": "Mint Mojito Blast", "uuid": "0b477ddb-96ac-408e-9cee-91c871b5d8fa", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/498a3663-6a4f-4890-af2b-4d13d3092f48.jpg", "created_at": "2026-06-06T10:55:16.397Z", "created_by": null, "dine_price": "200.00", "updated_at": "2026-06-06T10:55:16.397Z", "category_id": 8, "ingredients": ["Mojito", "Sprite with lemon ice of mint"], "is_available": true, "parcel_price": "220.00", "swiggy_price": "230.00", "zomato_price": "240.00", "category_name": "Mocktails", "time_required": null}	::1	2026-06-06 16:25:16.472588
59	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	192.168.1.15	2026-06-05 14:39:04.864698
61	\N	\N	2	ADMIN_LOGOUT	admin	2	\N	\N	192.168.1.15	2026-06-05 14:41:35.090959
64	\N	\N	\N	USER_LOGOUT	user	7	\N	\N	192.168.1.15	2026-06-05 14:42:45.803384
50	\N	\N	2	STAFF_USER_CREATE	user	10	\N	{"id": 10, "name": "rtyui", "email": "ss@gmail.com", "status": "active", "app_role": "Staff", "username": "qwe", "role_label": "Cashier"}	::1	2026-06-05 14:32:57.899282
57	\N	\N	2	STAFF_USER_CREATE	user	11	\N	{"id": 11, "name": "dfghj", "email": "kk@gmail.com", "status": "active", "app_role": "Staff", "username": "dwdw", "role_label": "Kitchen Staff"}	::1	2026-06-05 14:36:28.203598
54	\N	\N	\N	USER_LOGIN_SUCCESS	user	10	\N	{"email": "ss@gmail.com", "username": "qwe", "outlet_id": 9}	::1	2026-06-05 14:35:36.196147
55	\N	\N	\N	ORDER_CREATE	order	14	\N	{"items": [{"dish_id": 11, "quantity": 1, "unit_price": "8451.00", "total_price": "8451.00"}], "order_type": "parcel", "order_number": "ORD-9-20260605-0001", "total_amount": "8451.00"}	::1	2026-06-05 14:35:46.436648
3	\N	\N	2	OUTLET_CREATE	outlet	6	\N	{"id": 6, "name": "Dombivli", "uuid": "aab93e1f-b4c7-4c5c-a8c7-966bed8d416e", "email": "tasz@gmail.com", "phone": "8237278995", "status": "active", "address": "navi mumbai", "manager": "tasz", "username": "tasz", "created_at": "2026-06-02T11:16:34.423Z", "updated_at": "2026-06-02T11:16:34.423Z"}	::1	2026-06-02 16:46:34.652809
11	\N	\N	2	STAFF_USER_CREATE	user	6	\N	{"id": 6, "name": "ankit", "email": "anki@gmail.com", "status": "active", "app_role": "Staff", "username": "dfgyh", "role_label": "Custom"}	::1	2026-06-02 16:53:43.326282
17	\N	\N	2	STAFF_USER_UPDATE	user	5	{"id": 5, "name": "tasz", "uuid": "a850d3ab-b9eb-4af4-ad8b-6d39abf9adf7", "email": "tasz@gmail.com", "status": "active", "app_role": "Admin", "username": "tasz", "outlet_id": 6, "created_at": "2026-06-02T11:16:34.423Z", "role_label": "Manager", "updated_at": "2026-06-02T11:16:34.423Z", "permissions": {"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}}	{"id": 5, "name": "tasz", "uuid": "a850d3ab-b9eb-4af4-ad8b-6d39abf9adf7", "email": "tasz@gmail.com", "status": "active", "app_role": "Admin", "username": "tasz", "outlet_id": 6, "created_at": "2026-06-02T11:16:34.423Z", "role_label": "Manager", "updated_at": "2026-06-03T12:24:22.268Z", "permissions": {"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}}	::1	2026-06-03 17:54:22.627003
4	\N	\N	2	USER_LOGIN_SUCCESS	user	5	\N	{"email": "tasz@gmail.com", "username": "tasz", "outlet_id": 6}	::1	2026-06-02 16:47:03.35211
5	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-02 16:47:44.972943
7	\N	\N	2	USER_LOGIN_SUCCESS	user	5	\N	{"email": "tasz@gmail.com", "username": "tasz", "outlet_id": 6}	::1	2026-06-02 16:49:19.718133
8	\N	\N	\N	ORDER_CREATE	order	4	\N	{"items": [{"dish_id": 12, "quantity": 2, "unit_price": "123.00", "total_price": "246.00"}], "order_type": "dine", "order_number": "ORD-6-20260602-0001", "total_amount": "246.00"}	::1	2026-06-02 16:49:42.40065
9	\N	\N	\N	ORDER_CREATE	order	5	\N	{"items": [{"dish_id": 12, "quantity": 1, "unit_price": "123.00", "total_price": "123.00"}], "order_type": "dine", "order_number": "ORD-6-20260602-0002", "total_amount": "123.00"}	::1	2026-06-02 16:51:34.229466
10	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-02 16:52:19.034301
18	\N	\N	2	USER_LOGIN_SUCCESS	user	5	\N	{"email": "tasz@gmail.com", "username": "tasz", "outlet_id": 6}	::1	2026-06-03 17:54:34.805799
19	\N	\N	\N	ORDER_CREATE	order	6	\N	{"items": [{"dish_id": 12, "quantity": 1, "unit_price": "123.00", "total_price": "123.00"}], "order_type": "dine", "order_number": "ORD-6-20260603-0001", "total_amount": "123.00"}	::1	2026-06-03 17:55:10.358879
20	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-03 17:59:19.236356
22	\N	\N	2	USER_LOGIN_SUCCESS	user	5	\N	{"email": "tasz@gmail.com", "username": "tasz", "outlet_id": 6}	::1	2026-06-03 18:24:53.473784
23	\N	\N	\N	ORDER_CREATE	order	7	\N	{"items": [{"dish_id": 12, "quantity": 1, "unit_price": "123.00", "total_price": "123.00"}], "order_type": "dine", "order_number": "ORD-6-20260604-0001", "total_amount": "123.00"}	::1	2026-06-04 10:24:35.252715
24	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-04 10:25:18.325422
12	\N	\N	2	USER_LOGIN_SUCCESS	user	6	\N	{"email": "anki@gmail.com", "username": "dfgyh", "outlet_id": 6}	::1	2026-06-02 16:54:03.198425
13	\N	\N	\N	USER_LOGIN_SUCCESS	user	6	\N	{"email": "anki@gmail.com", "username": "dfgyh", "outlet_id": 6}	::1	2026-06-02 17:15:34.89044
14	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-03 13:07:25.448999
103	17	13	2	USER_LOGIN_SUCCESS	user	17	\N	{"email": "tabish@gmial.com", "username": "tabish", "outlet_id": 13}	::1	2026-06-06 14:45:17.745563
110	\N	\N	2	DISH_CREATE	dish	7	\N	{"id": 7, "cat": null, "veg": true, "name": "Veg Burger", "uuid": "04d7b04d-d831-4e1d-8c92-aa6ffd12ec58", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/602f6777-5c06-466d-916c-b196e6a459e2.jpg", "created_at": "2026-06-06T09:48:40.474Z", "created_by": null, "dine_price": "200.00", "updated_at": "2026-06-06T09:48:40.474Z", "category_id": 19, "ingredients": ["Classic veggie patty in a soft bun"], "is_available": true, "parcel_price": "300.00", "swiggy_price": "100.00", "zomato_price": "200.00", "category_name": "Subs", "time_required": null}	::1	2026-06-06 15:18:40.661405
166	13	10	\N	USER_LOGOUT	user	13	\N	\N	192.168.1.22	2026-06-09 11:52:08.841983
47	\N	\N	2	DISH_UPDATE	dish	12	{"id": 12, "cat": null, "veg": true, "name": "chicken Sandwitch", "uuid": "6b0dd1ee-4637-476b-b956-0cef13fa6971", "emoji": null, "outlets": ["Seewoods"], "image_url": "/uploads/dishes/da23661e-6c20-4786-8d0c-0b6e4e28faf9.jpg", "created_at": "2026-05-30T04:52:44.911Z", "created_by": null, "dine_price": "123.00", "updated_at": "2026-06-04T06:06:30.657Z", "category_id": 18, "ingredients": ["qwertyui"], "is_available": true, "parcel_price": "154.00", "swiggy_price": "154.00", "zomato_price": "154.00", "category_name": "Sandwiches", "time_required": null}	{"id": 12, "cat": null, "veg": true, "name": "chicken Sandwitch", "uuid": "6b0dd1ee-4637-476b-b956-0cef13fa6971", "emoji": null, "outlets": ["Seewoods", "lala company"], "image_url": "/uploads/dishes/da23661e-6c20-4786-8d0c-0b6e4e28faf9.jpg", "created_at": "2026-05-30T04:52:44.911Z", "created_by": null, "dine_price": "123.00", "updated_at": "2026-06-05T09:01:15.644Z", "category_id": 18, "ingredients": ["qwertyui"], "is_available": true, "parcel_price": "154.00", "swiggy_price": "154.00", "zomato_price": "154.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-05 14:31:15.659328
28	\N	\N	2	OUTLET_CREATE	outlet	8	\N	{"id": 8, "name": "Seewoods", "uuid": "a3768ea1-08e9-40e0-99e6-d8baf2640a1b", "email": "lala@gmail.com", "phone": "8237278995", "status": "active", "address": "wertyuio", "manager": "lala", "username": "Lala_B", "created_at": "2026-06-04T06:05:57.841Z", "updated_at": "2026-06-04T06:05:57.841Z"}	::1	2026-06-04 11:35:58.023729
46	\N	\N	2	OUTLET_CREATE	outlet	9	\N	{"id": 9, "name": "lala company", "uuid": "82668501-7993-4450-91fb-25b4f6a29833", "email": "lala@gmail.com", "phone": "1234567890", "status": "active", "address": "wertyuio", "manager": "lala", "username": "wertyui", "swiggy_id": "1234", "zomato_id": "2345", "created_at": "2026-06-05T09:01:08.371Z", "updated_at": "2026-06-05T09:01:08.371Z", "access_token": "1234567890"}	::1	2026-06-05 14:31:09.070093
104	17	13	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-06 14:48:27.679935
111	\N	10	2	STAFF_USER_CREATE	user	19	\N	{"id": 19, "name": "ajit", "email": "ajit@gmail.com", "status": "active", "app_role": "Staff", "username": "ajit", "role_label": "Kitchen Staff"}	::1	2026-06-06 15:21:38.076373
117	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.10	2026-06-06 15:38:19.455576
122	\N	\N	2	DISH_CREATE	dish	10	\N	{"id": 10, "cat": null, "veg": true, "name": "Kesar Thandai Milkshake", "uuid": "20d8db31-c66e-47e6-b703-62bbe8c0dbdf", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/73d8ab5e-b67b-4913-94b8-41cc39d9861d.jpg", "created_at": "2026-06-06T10:44:37.745Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T10:44:37.745Z", "category_id": 9, "ingredients": ["Refreshing kesar thandai syrup & milk"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Shakes & Smoothies", "time_required": null}	::1	2026-06-06 16:14:38.028212
127	\N	\N	2	DISH_CREATE	dish	15	\N	{"id": 15, "cat": null, "veg": true, "name": "Blue Lagoon Mojito", "uuid": "8b5c3a41-1bd7-4675-bc9d-a15a79909d32", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/f16ac2c4-560e-4438-ae65-0ec24317d625.jpg", "created_at": "2026-06-06T10:56:45.408Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T10:56:45.408Z", "category_id": 3, "ingredients": ["Blue syrup", "lime juice mint", "sprite", "soda"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-06 16:26:45.710324
130	\N	\N	2	DISH_CREATE	dish	18	\N	{"id": 18, "cat": null, "veg": true, "name": "Mexican Cheese Burger", "uuid": "54111d71-0b65-4bd2-8409-ba09aed9b785", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/e3a89413-d599-4a27-9ec7-95cd5f8c9e52.jpg", "created_at": "2026-06-06T11:04:14.149Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T11:04:14.149Z", "category_id": 6, "ingredients": ["Mexican flavors with veggies & cheese"], "is_available": true, "parcel_price": "150.00", "swiggy_price": "170.00", "zomato_price": "180.00", "category_name": "Burgers", "time_required": null}	::1	2026-06-06 16:34:14.224275
132	\N	\N	2	DISH_CREATE	dish	20	\N	{"id": 20, "cat": null, "veg": true, "name": "Jain Cheese Burger", "uuid": "55256f4e-6a35-4675-a325-b84e2e8c1164", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/bb044141-6a00-4abb-87d3-0412cb1bcad0.jpg", "created_at": "2026-06-06T11:07:35.707Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T11:07:35.707Z", "category_id": 6, "ingredients": ["No onion or garlic", "with cheese"], "is_available": true, "parcel_price": "150.00", "swiggy_price": "160.00", "zomato_price": "170.00", "category_name": "Burgers", "time_required": null}	::1	2026-06-06 16:37:35.790155
134	\N	\N	2	DISH_CREATE	dish	22	\N	{"id": 22, "cat": null, "veg": true, "name": "Garlic Bread with Cheese [4 Pieces]", "uuid": "8c1d5230-a25d-466c-bbda-56faa12cbd49", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/3668c288-4816-448f-8239-1327944e7e53.jpg", "created_at": "2026-06-06T11:09:49.182Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T11:09:49.182Z", "category_id": 7, "ingredients": ["Garlic Bread topped with cheese"], "is_available": true, "parcel_price": "140.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Appetizers", "time_required": null}	::1	2026-06-06 16:39:49.270592
135	\N	\N	2	DISH_CREATE	dish	23	\N	{"id": 23, "cat": null, "veg": true, "name": "Garlic Bread Spicy Chatkara [4 Pieces]", "uuid": "aa9ce177-d762-4ced-ab8d-d4f5db6358c4", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/e0745d01-2538-4840-9684-0b4c83167f9a.jpg", "created_at": "2026-06-06T11:11:28.181Z", "created_by": null, "dine_price": "100.00", "updated_at": "2026-06-06T11:11:28.181Z", "category_id": 7, "ingredients": ["(Spicy) Garnished with onion", "green chilly & cheese"], "is_available": true, "parcel_price": "200.00", "swiggy_price": "300.00", "zomato_price": "400.00", "category_name": "Appetizers", "time_required": null}	::1	2026-06-06 16:41:28.255547
136	\N	\N	2	DISH_CREATE	dish	24	\N	{"id": 24, "cat": null, "veg": true, "name": "French Fries", "uuid": "2daffb04-7bbe-48be-8813-29c0c8ec5ea2", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/5431e1c2-3e71-430c-9b85-00b7525b0927.jpg", "created_at": "2026-06-06T11:12:39.719Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T11:12:39.719Z", "category_id": 7, "ingredients": ["Potato fries with exotic seasonings"], "is_available": true, "parcel_price": "120.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Appetizers", "time_required": null}	::1	2026-06-06 16:42:39.794098
137	\N	\N	2	DISH_CREATE	dish	25	\N	{"id": 25, "cat": null, "veg": true, "name": "Plain Cheese Pizza", "uuid": "e55346ae-b8f4-40dc-b12b-e456caf4a4bd", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/b9743714-9440-4ef5-be40-c4d26db3d7d0.jpg", "created_at": "2026-06-06T11:14:01.538Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T11:14:01.538Z", "category_id": 5, "ingredients": ["Topped with lots of cheese"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Pizza", "time_required": null}	::1	2026-06-06 16:44:01.678471
147	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-08 03:36:50.211072
161	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	192.168.1.22	2026-06-09 11:48:07.590819
29	\N	\N	2	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	::1	2026-06-04 11:36:08.156003
35	\N	\N	\N	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	::1	2026-06-04 11:47:39.86369
41	\N	\N	\N	ORDER_CREATE	order	11	\N	{"items": [{"dish_id": 1, "quantity": 3, "unit_price": "89.00", "total_price": "267.00"}, {"dish_id": 11, "quantity": 2, "unit_price": "79.00", "total_price": "158.00"}, {"dish_id": 12, "quantity": 1, "unit_price": "123.00", "total_price": "123.00"}], "order_type": "dine", "order_number": "ORD-8-20260604-0003", "total_amount": "548.00"}	::1	2026-06-04 11:51:31.603957
30	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-04 11:36:22.064649
52	\N	\N	\N	ORDER_CREATE	order	12	\N	{"items": [{"dish_id": 2, "quantity": 3, "unit_price": "850.00", "total_price": "2550.00"}, {"dish_id": 11, "quantity": 2, "unit_price": "79.00", "total_price": "158.00"}, {"dish_id": 12, "quantity": 1, "unit_price": "123.00", "total_price": "123.00"}], "order_type": "dine", "order_number": "ORD-8-20260605-0001", "total_amount": "2831.00"}	::1	2026-06-05 14:34:06.694995
33	\N	\N	2	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	::1	2026-06-04 11:36:43.410297
36	\N	\N	\N	ORDER_CREATE	order	10	\N	{"items": [{"dish_id": 12, "quantity": 3, "unit_price": "123.00", "total_price": "369.00"}], "order_type": "dine", "order_number": "ORD-8-20260604-0002", "total_amount": "369.00"}	::1	2026-06-04 11:48:39.038422
42	\N	\N	\N	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	::1	2026-06-05 10:41:43.625909
53	\N	\N	\N	ORDER_CREATE	order	13	\N	{"items": [{"dish_id": 12, "quantity": 1, "unit_price": "154.00", "total_price": "154.00"}], "order_type": "parcel", "order_number": "ORD-8-20260605-0002", "total_amount": "154.00"}	::1	2026-06-05 14:35:20.989729
62	\N	\N	\N	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	192.168.1.15	2026-06-05 14:41:54.627862
63	\N	\N	\N	ORDER_CREATE	order	15	\N	{"items": [{"dish_id": 11, "quantity": 1, "unit_price": "79.00", "total_price": "79.00"}], "order_type": "dine", "order_number": "ORD-8-20260605-0003", "total_amount": "79.00"}	192.168.1.15	2026-06-05 14:42:11.807616
65	\N	\N	2	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	::1	2026-06-05 14:49:05.570488
66	\N	\N	\N	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	::1	2026-06-05 15:09:06.496167
67	\N	\N	\N	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	::1	2026-06-05 15:16:47.270278
34	\N	\N	\N	ORDER_CREATE	order	9	\N	{"items": [{"dish_id": 12, "quantity": 3, "unit_price": "123.00", "total_price": "369.00"}], "order_type": "dine", "order_number": "ORD-8-20260604-0001", "total_amount": "369.00"}	::1	2026-06-04 11:37:04.675029
37	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-04 11:49:09.353677
40	\N	\N	2	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	::1	2026-06-04 11:50:35.298501
43	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-05 14:26:08.656149
51	\N	\N	2	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	::1	2026-06-05 14:33:33.978141
68	\N	\N	\N	ORDER_CREATE	order	16	\N	{"items": [{"dish_id": 12, "quantity": 1, "unit_price": "123.00", "total_price": "123.00"}, {"dish_id": 2, "quantity": 1, "unit_price": "850.00", "total_price": "850.00"}, {"dish_id": 11, "quantity": 2, "unit_price": "79.00", "total_price": "158.00"}], "order_type": "dine", "order_number": "ORD-8-20260605-0004", "total_amount": "1000.00"}	::1	2026-06-05 15:27:05.979644
69	\N	\N	\N	USER_LOGIN_SUCCESS	user	7	\N	{"email": "lala@gmail.com", "username": "Lala_B", "outlet_id": 8}	::1	2026-06-05 15:37:46.958487
70	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-05 15:38:11.11936
71	\N	\N	2	STAFF_USER_DELETE	user	7	{"id": 7, "name": "lala", "uuid": "13a98b77-ab81-4346-aa9b-8050a1f2d7fa", "email": "lala@gmail.com", "status": "active", "app_role": "Admin", "username": "Lala_B", "outlet_id": 8, "created_at": "2026-06-04T06:05:57.841Z", "created_by": null, "role_label": "Manager", "updated_at": "2026-06-04T06:05:57.841Z", "permissions": {"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}, "password_hash": "$2b$10$k1FHj/7HYsZne9beJuBU3ui4FsBjjzirz2NTb4yyq8GMX0lny3shm"}	\N	::1	2026-06-05 15:38:32.348403
105	17	13	2	USER_LOGIN_SUCCESS	user	17	\N	{"email": "tabish@gmial.com", "username": "tabish", "outlet_id": 13}	127.0.0.1	2026-06-06 14:53:27.408332
112	\N	10	2	STAFF_USER_UPDATE	user	18	{"id": 18, "name": "Default Staff", "uuid": "e3e94740-74ce-4981-9b77-e270b9c93f54", "email": "staff@guptasandwich.com", "status": "active", "app_role": "Staff", "username": "staff", "outlet_id": 10, "created_at": "2026-06-06T09:14:17.495Z", "role_label": "Cashier", "updated_at": "2026-06-06T09:14:17.495Z", "permissions": {"admin": [], "staff": ["pos", "live-orders"]}}	{"id": 18, "name": "Default Staff", "uuid": "e3e94740-74ce-4981-9b77-e270b9c93f54", "email": "staff@guptasandwich.com", "status": "active", "app_role": "Staff", "username": "staff", "outlet_id": 10, "created_at": "2026-06-06T09:14:17.495Z", "role_label": "Cashier", "updated_at": "2026-06-06T09:52:14.100Z", "permissions": {"admin": [], "staff": ["pos", "live-orders"]}}	::1	2026-06-06 15:22:14.320996
118	13	10	\N	ORDER_CREATE	order	36	\N	{"items": [{"dish_id": 5, "quantity": 1, "unit_price": "100.00", "total_price": "100.00"}, {"dish_id": 4, "quantity": 1, "unit_price": "200.00", "total_price": "200.00"}], "order_type": "dine", "order_number": "ORD-10-20260606-0004", "total_amount": "300.00"}	192.168.1.10	2026-06-06 15:38:45.400285
123	\N	\N	2	DISH_CREATE	dish	11	\N	{"id": 11, "cat": null, "veg": true, "name": "Pista Milkshake", "uuid": "1fcfc4f6-35e6-49b8-af31-39aca527c85e", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/7e5b6224-0bc6-40cd-b7f1-f9c36cdae90a.jpg", "created_at": "2026-06-06T10:45:34.600Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T10:45:34.600Z", "category_id": 9, "ingredients": ["Refreshing pista syrup"], "is_available": true, "parcel_price": "150.00", "swiggy_price": "160.00", "zomato_price": "120.00", "category_name": "Shakes & Smoothies", "time_required": null}	::1	2026-06-06 16:15:34.681281
133	\N	\N	2	DISH_CREATE	dish	21	\N	{"id": 21, "cat": null, "veg": true, "name": "Garlic Bread [4 Pieces]", "uuid": "4a9aa095-5dda-4d5d-9ee1-7f25e375cc8f", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/91ac335c-b42c-458a-85d5-4d34bd17b926.jpg", "created_at": "2026-06-06T11:08:52.728Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T11:08:52.728Z", "category_id": 7, "ingredients": ["Classic plain bread"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Appetizers", "time_required": null}	::1	2026-06-06 16:38:52.808858
84	\N	\N	2	ADMIN_LOGOUT	admin	2	\N	\N	192.168.1.15	2026-06-05 16:32:25.763658
106	17	13	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-06 15:05:05.395726
113	13	10	2	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	::1	2026-06-06 15:22:48.140406
119	13	10	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-06 16:06:53.325171
124	\N	\N	2	DISH_CREATE	dish	12	\N	{"id": 12, "cat": null, "veg": true, "name": "Fresh Lime", "uuid": "46223fea-bbe4-46a2-8b79-9b181de2bb40", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/418108ac-3c4f-4537-9f4a-1f2b21eb8960.jpg", "created_at": "2026-06-06T10:50:59.036Z", "created_by": null, "dine_price": "100.00", "updated_at": "2026-06-06T10:50:59.036Z", "category_id": 8, "ingredients": ["Fresh lime", "soda"], "is_available": true, "parcel_price": "120.00", "swiggy_price": "130.00", "zomato_price": "150.00", "category_name": "Mocktails", "time_required": null}	::1	2026-06-06 16:20:59.150305
83	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	192.168.1.15	2026-06-05 16:32:05.07984
128	\N	\N	2	DISH_CREATE	dish	16	\N	{"id": 16, "cat": null, "veg": true, "name": "Veg Cheese Burger", "uuid": "76a7a533-ec16-4aae-ba92-6369cbdda333", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/4e29f874-e2b9-4adc-983b-8ec50b503be6.jpg", "created_at": "2026-06-06T10:59:26.365Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T10:59:26.365Z", "category_id": 6, "ingredients": ["Veg burger topped with cheese"], "is_available": true, "parcel_price": "150.00", "swiggy_price": "160.00", "zomato_price": "170.00", "category_name": "Burgers", "time_required": null}	::1	2026-06-06 16:29:26.474558
131	\N	\N	2	DISH_CREATE	dish	19	\N	{"id": 19, "cat": null, "veg": true, "name": "Tandoori Cheese Burger", "uuid": "f4212fc6-8b8b-40b9-9fdd-3eb6a6dd5889", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/366d7ffd-0e50-42ad-a91b-bcd8903b3a1e.jpg", "created_at": "2026-06-06T11:05:55.122Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T11:05:55.122Z", "category_id": 6, "ingredients": ["Flavored with tandoori sauce & cheese"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Burgers", "time_required": null}	::1	2026-06-06 16:35:55.203168
146	13	10	2	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	::1	2026-06-06 16:59:29.387531
89	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-06 12:02:46.563756
148	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-08 10:49:49.310424
91	\N	\N	2	DISH_DELETE	dish	11	{"id": 11, "cat": null, "veg": true, "name": "burger", "uuid": "82ea8ffb-527c-427d-81d8-b575218c2687", "emoji": null, "outlets": ["lala company"], "image_url": "/uploads/dishes/9d4d4a07-1f09-4efd-9da6-581f080053df.jpg", "created_at": "2026-05-29T08:30:45.973Z", "created_by": null, "dine_price": "79.00", "updated_at": "2026-06-05T09:01:18.960Z", "category_id": 18, "ingredients": ["dscfswf"], "is_available": true, "parcel_price": "8451.00", "swiggy_price": "58.00", "zomato_price": "547.00", "category_name": "Sandwiches", "time_required": null}	\N	::1	2026-06-06 12:46:29.559655
92	\N	\N	2	DISH_DELETE	dish	12	{"id": 12, "cat": null, "veg": true, "name": "chicken Sandwitch", "uuid": "6b0dd1ee-4637-476b-b956-0cef13fa6971", "emoji": null, "outlets": ["lala company"], "image_url": "/uploads/dishes/da23661e-6c20-4786-8d0c-0b6e4e28faf9.jpg", "created_at": "2026-05-30T04:52:44.911Z", "created_by": null, "dine_price": "123.00", "updated_at": "2026-06-05T09:01:15.644Z", "category_id": 18, "ingredients": ["qwertyui"], "is_available": true, "parcel_price": "154.00", "swiggy_price": "154.00", "zomato_price": "154.00", "category_name": "Sandwiches", "time_required": null}	\N	::1	2026-06-06 12:46:31.388866
93	\N	\N	2	DISH_DELETE	dish	2	{"id": 2, "cat": null, "veg": true, "name": "biryani", "uuid": "6950a886-a41d-4c71-99a5-120f7a9861ca", "emoji": null, "outlets": ["lala company"], "image_url": "/uploads/dishes/0552058a-2584-4fb3-bd53-a48360ede2b6.png", "created_at": "2026-06-05T08:57:21.936Z", "created_by": null, "dine_price": "850.00", "updated_at": "2026-06-05T09:01:25.897Z", "category_id": 18, "ingredients": ["wertyuio"], "is_available": true, "parcel_price": "950.00", "swiggy_price": "950.00", "zomato_price": "950.00", "category_name": "Sandwiches", "time_required": null}	\N	::1	2026-06-06 12:46:34.180212
94	\N	10	2	OUTLET_CREATE	outlet	10	\N	{"id": 10, "name": "pune deccan", "uuid": "a1d86c61-a290-43a2-8010-5971dd5c8abb", "email": "shakya@gmail.com", "phone": "8237278995", "status": "active", "address": "deccan gymkhana", "manager": "Shakya", "username": "shakya", "swiggy_id": "1234", "zomato_id": "2345", "created_at": "2026-06-06T07:20:49.331Z", "updated_at": "2026-06-06T07:20:49.331Z", "access_token": "788f83dbaa7d4c91b2435b0fc84034d5"}	::1	2026-06-06 12:50:49.571214
95	\N	10	2	STAFF_USER_CREATE	user	14	\N	{"id": 14, "name": "Shakya", "email": "shakya@gmail.com", "status": "active", "app_role": "Staff", "username": "Shakya", "role_label": "Manager"}	::1	2026-06-06 12:52:15.114301
96	\N	11	2	OUTLET_CREATE	outlet	11	\N	{"id": 11, "name": "shrigonda", "uuid": "b15ee933-5904-4bbc-bc8c-2b945ef9a646", "email": "adita@gmail.com", "phone": "8237278996", "status": "active", "address": "shrigonda, ahilyanagar", "manager": "adita", "username": "Adita", "swiggy_id": "1234", "zomato_id": "2345", "created_at": "2026-06-06T07:25:23.265Z", "updated_at": "2026-06-06T07:25:23.265Z", "access_token": "788f83dbaa7d4c91b2435b0fc84034d5"}	::1	2026-06-06 12:55:23.47838
97	15	11	2	USER_LOGIN_SUCCESS	user	15	\N	{"email": "adita@gmail.com", "username": "Adita", "outlet_id": 11}	::1	2026-06-06 12:56:57.935828
98	15	11	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-06 12:57:19.712407
99	\N	10	2	STAFF_USER_DELETE	user	14	{"id": 14, "name": "Shakya", "uuid": "d0dacd20-0c7c-40ca-89f7-d45a296dcb88", "email": "shakya@gmail.com", "status": "active", "app_role": "Staff", "username": "Shakya", "outlet_id": 10, "created_at": "2026-06-06T07:22:15.107Z", "created_by": null, "role_label": "Manager", "updated_at": "2026-06-06T07:22:15.107Z", "permissions": {"admin": [], "staff": ["pos", "kot", "reports", "live-orders"]}, "password_hash": "$2b$10$./oQ/fdYnzGUzTWf/f/DEOojkFBD0TmRtu3qGXpltP8nnP5vs1kLi"}	\N	::1	2026-06-06 12:57:42.637342
149	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-08 12:54:39.121794
162	\N	\N	2	ADMIN_LOGOUT	admin	2	\N	\N	192.168.1.22	2026-06-09 11:48:46.049228
56	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-05 14:35:58.947486
58	\N	\N	2	USER_LOGIN_SUCCESS	user	11	\N	{"email": "kk@gmail.com", "username": "dwdw", "outlet_id": 9}	::1	2026-06-05 14:36:33.236009
60	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-05 14:39:45.722575
86	\N	\N	\N	USER_LOGOUT	user	9	\N	\N	192.168.1.15	2026-06-05 16:36:56.217427
73	\N	\N	2	STAFF_USER_UPDATE	user	9	{"id": 9, "name": "lala", "uuid": "fd2545b5-c4d5-46eb-9e07-27f0ef01023b", "email": "lala@gmail.com", "status": "active", "app_role": "Admin", "username": "wertyui", "outlet_id": 9, "created_at": "2026-06-05T09:01:08.371Z", "role_label": "Manager", "updated_at": "2026-06-05T09:01:08.371Z", "permissions": {"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}}	{"id": 9, "name": "lala", "uuid": "fd2545b5-c4d5-46eb-9e07-27f0ef01023b", "email": "lala@gmail.com", "status": "active", "app_role": "Admin", "username": "wertyui", "outlet_id": 9, "created_at": "2026-06-05T09:01:08.371Z", "role_label": "Manager", "updated_at": "2026-06-05T10:09:21.040Z", "permissions": {"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}}	::1	2026-06-05 15:39:21.39344
78	\N	\N	2	OUTLET_CREDS_UPDATE	outlet	9	{"username": "wertyui"}	{"username": "123456"}	::1	2026-06-05 15:54:09.859109
81	\N	\N	2	OUTLET_UPDATE	outlet	9	{"id": 9, "name": "lala company", "uuid": "82668501-7993-4450-91fb-25b4f6a29833", "email": "lala@gmail.com", "phone": "1234567890", "status": "active", "address": "wertyuio", "manager": "lala", "username": "123456", "image_url": null, "created_at": "2026-06-05T09:01:08.371Z", "created_by": null, "updated_at": "2026-06-05T10:24:09.844Z", "password_hash": "$2b$10$mb9M.tAHg2uKz.e685q.juO3mUnU2h8obzhOgjPAuEHgth.I5MELS"}	{"id": 9, "name": "lala company", "uuid": "82668501-7993-4450-91fb-25b4f6a29833", "email": "lala@gmail.com", "phone": "1234567890", "status": "active", "address": "wertyuio", "manager": "lala", "username": "123456", "swiggy_id": "1234", "zomato_id": "2345", "created_at": "2026-06-05T09:01:08.371Z", "updated_at": "2026-06-05T10:27:26.983Z", "access_token": "788f83dbaa7d4c91b2435b0fc84034d5"}	::1	2026-06-05 15:57:27.204759
74	\N	\N	2	USER_LOGIN_SUCCESS	user	9	\N	{"email": "lala@gmail.com", "username": "wertyui", "outlet_id": 9}	::1	2026-06-05 15:39:26.654196
75	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-05 15:51:00.644102
76	\N	\N	2	USER_LOGIN_SUCCESS	user	9	\N	{"email": "lala@gmail.com", "username": "wertyui", "outlet_id": 9}	::1	2026-06-05 15:51:43.314745
77	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-05 15:53:49.039528
79	\N	\N	2	USER_LOGIN_SUCCESS	user	9	\N	{"email": "lala@gmail.com", "username": "wertyui", "outlet_id": 9}	::1	2026-06-05 15:54:20.164894
80	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-05 15:55:02.531126
82	\N	\N	2	USER_LOGIN_SUCCESS	user	9	\N	{"email": "lala@gmail.com", "username": "wertyui", "outlet_id": 9}	::1	2026-06-05 15:57:45.00055
85	\N	\N	\N	USER_LOGIN_SUCCESS	user	9	\N	{"email": "lala@gmail.com", "username": "wertyui", "outlet_id": 9}	192.168.1.15	2026-06-05 16:33:05.696646
87	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-06 12:00:46.030363
88	\N	\N	2	USER_LOGIN_SUCCESS	user	9	\N	{"email": "lala@gmail.com", "username": "wertyui", "outlet_id": 9}	::1	2026-06-06 12:02:13.628191
90	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-06 12:46:23.023363
107	\N	\N	2	DISH_CREATE	dish	4	\N	{"id": 4, "cat": null, "veg": true, "name": "Sada Sandwich", "uuid": "e81d1a98-8af8-4131-b63b-9a360158020b", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/952a96a8-207f-4415-a07a-0fa2a2f96bda.jpg", "created_at": "2026-06-06T09:39:15.831Z", "created_by": null, "dine_price": "200.00", "updated_at": "2026-06-06T09:39:15.831Z", "category_id": 18, "ingredients": ["bread-2pc", "vegies"], "is_available": true, "parcel_price": "300.00", "swiggy_price": "400.00", "zomato_price": "500.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-06 15:09:15.9524
114	13	10	\N	ORDER_CREATE	order	33	\N	{"items": [{"dish_id": 7, "quantity": 3, "unit_price": "200.00", "total_price": "600.00"}, {"dish_id": 5, "quantity": 2, "unit_price": "100.00", "total_price": "200.00"}], "order_type": "dine", "order_number": "ORD-10-20260606-0001", "total_amount": "800.00"}	::1	2026-06-06 15:25:11.928258
120	\N	\N	2	DISH_CREATE	dish	8	\N	{"id": 8, "cat": null, "veg": true, "name": "Chocolate Shake", "uuid": "d717c4c0-6cb2-4a16-b924-d7d5b5883665", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/9455a03b-d5e0-4005-9c37-02dd99748970.jpg", "created_at": "2026-06-06T10:41:37.372Z", "created_by": null, "dine_price": "100.00", "updated_at": "2026-06-06T10:41:37.372Z", "category_id": 9, "ingredients": ["Shake with Chocolate powder", "syrup", "milk"], "is_available": true, "parcel_price": "200.00", "swiggy_price": "300.00", "zomato_price": "400.00", "category_name": "Shakes & Smoothies", "time_required": null}	::1	2026-06-06 16:11:37.475176
125	\N	\N	2	DISH_CREATE	dish	13	\N	{"id": 13, "cat": null, "veg": true, "name": "Lemon Ice- Tea", "uuid": "82f078d6-9a38-47b2-b5a3-0da9537b31d0", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/c1c29eca-e370-4dc7-8490-24e4faf61eb8.jpg", "created_at": "2026-06-06T10:53:19.986Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T10:53:19.986Z", "category_id": 8, "ingredients": ["Lemon flavour ice tea powder garnished with lemon"], "is_available": true, "parcel_price": "140.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Mocktails", "time_required": null}	::1	2026-06-06 16:23:20.074918
129	\N	\N	2	DISH_CREATE	dish	17	\N	{"id": 17, "cat": null, "veg": true, "name": "Schezwan Cheese Burger", "uuid": "73271830-ffdb-42f4-98ce-72f0f30e458c", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/52163843-0df5-42c2-bf78-a265e29b5f01.jpg", "created_at": "2026-06-06T11:01:49.281Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T11:01:49.281Z", "category_id": 6, "ingredients": ["Spicy schezwan sauce with cheese"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Burgers", "time_required": null}	::1	2026-06-06 16:31:49.363447
138	\N	\N	2	DISH_CREATE	dish	26	\N	{"id": 26, "cat": null, "veg": true, "name": "Simple Best Pizza", "uuid": "0a9b4da3-051f-4c88-8254-d8cbfe119d40", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/a680f561-4b48-4700-b4e1-6f692af27136.jpg", "created_at": "2026-06-06T11:15:54.452Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T11:15:54.452Z", "category_id": 5, "ingredients": ["Tomato", "onion", "capsicum and cheese"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Pizza", "time_required": null}	::1	2026-06-06 16:45:54.530391
139	\N	\N	2	DISH_DELETE	dish	26	{"id": 26, "cat": null, "veg": true, "name": "Simple Best Pizza", "uuid": "0a9b4da3-051f-4c88-8254-d8cbfe119d40", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/a680f561-4b48-4700-b4e1-6f692af27136.jpg", "created_at": "2026-06-06T11:15:54.452Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T11:15:54.452Z", "category_id": 5, "ingredients": ["Tomato", "onion", "capsicum and cheese"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Pizza", "time_required": null}	\N	::1	2026-06-06 16:46:02.002991
140	\N	\N	2	DISH_CREATE	dish	27	\N	{"id": 27, "cat": null, "veg": true, "name": "Simple Best Pizza", "uuid": "aaa01237-2281-46d7-916c-bcfe0e52179d", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/f67c34a8-00ba-4a07-b1ad-326ea708afed.jpg", "created_at": "2026-06-06T11:19:14.093Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T11:19:14.093Z", "category_id": 5, "ingredients": ["Tomato", "onion", "capsicum and cheese"], "is_available": true, "parcel_price": "150.00", "swiggy_price": "160.00", "zomato_price": "160.00", "category_name": "Pizza", "time_required": null}	::1	2026-06-06 16:49:14.169456
141	\N	\N	2	DISH_CREATE	dish	28	\N	{"id": 28, "cat": null, "veg": true, "name": "Hot and Spicy Pizza", "uuid": "be8c324d-b6e2-4ed6-b53e-618fa187c0da", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/c95384ea-d0c9-4d80-9b68-27ee96d1f855.jpg", "created_at": "2026-06-06T11:20:28.345Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T11:20:28.345Z", "category_id": 5, "ingredients": ["Spicy tomato", "onion and capsicum", "garnished with green chilly & cheese"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Pizza", "time_required": null}	::1	2026-06-06 16:50:28.424043
142	\N	\N	2	DISH_CREATE	dish	29	\N	{"id": 29, "cat": null, "veg": true, "name": "Chocolaty Bites Toast Sandwich", "uuid": "c4f23501-8fe9-4b3d-ac1d-c5803c1aa46b", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/758b79ac-4818-4869-b535-628128ad7d11.jpg", "created_at": "2026-06-06T11:23:52.270Z", "created_by": null, "dine_price": "200.00", "updated_at": "2026-06-06T11:23:52.270Z", "category_id": 3, "ingredients": ["Chocolate melted sauce with bread."], "is_available": true, "parcel_price": "220.00", "swiggy_price": "230.00", "zomato_price": "240.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-06 16:53:52.369961
143	\N	\N	2	DISH_CREATE	dish	30	\N	{"id": 30, "cat": null, "veg": true, "name": "Jam Toast Sandwich", "uuid": "db64187b-b1d5-4a3c-952b-b7d126710e84", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/2a1405ba-fa99-46c5-b346-7118351869ea.jpg", "created_at": "2026-06-06T11:25:18.895Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T11:25:18.895Z", "category_id": 3, "ingredients": ["Mixed fruit jam."], "is_available": true, "parcel_price": "130.00", "swiggy_price": "140.00", "zomato_price": "150.00", "category_name": "Sandwiches", "time_required": null}	::1	2026-06-06 16:55:18.977853
144	\N	\N	2	DISH_CREATE	dish	31	\N	{"id": 31, "cat": null, "veg": true, "name": "Diet Grilled", "uuid": "fccbdee6-1e0a-4135-a680-aa425da05af1", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/f423017f-cda0-4f8d-a00a-e25b53d2f9ad.jpg", "created_at": "2026-06-06T11:26:55.240Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T11:26:55.240Z", "category_id": 1, "ingredients": ["Tomato", "capsicum", "onion", "cucumber with special herbs and spices."], "is_available": true, "parcel_price": "150.00", "swiggy_price": "160.00", "zomato_price": "200.00", "category_name": "Grilled Sandwiches", "time_required": null}	::1	2026-06-06 16:56:55.410664
145	\N	\N	2	DISH_CREATE	dish	32	\N	{"id": 32, "cat": null, "veg": true, "name": "Paneer Cheesy Grilled", "uuid": "4368dd86-5f5c-4aa5-929a-12c003ebc513", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/a5a0e24b-c40f-4ad4-a681-b2459eb3b242.jpg", "created_at": "2026-06-06T11:28:40.295Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T11:28:40.295Z", "category_id": 1, "ingredients": ["Diced paneer cubes", "veggie puree melted with cheese and butter."], "is_available": true, "parcel_price": "150.00", "swiggy_price": "160.00", "zomato_price": "170.00", "category_name": "Grilled Sandwiches", "time_required": null}	::1	2026-06-06 16:58:40.373006
150	17	13	2	USER_LOGIN_SUCCESS	user	17	\N	{"email": "tabish@gmial.com", "username": "tabish", "outlet_id": 13}	::1	2026-06-08 12:55:44.623117
151	17	13	\N	USER_LOGIN_SUCCESS	user	17	\N	{"email": "tabish@gmial.com", "username": "tabish", "outlet_id": 13}	::1	2026-06-08 13:02:57.181638
152	17	13	\N	ORDER_CREATE	order	43	\N	{"items": [{"dish_id": 23, "quantity": 1, "unit_price": "100.00", "total_price": "100.00"}], "order_type": "dine", "order_number": "ORD-13-20260608-0001", "total_amount": "100.00"}	::1	2026-06-08 13:07:27.588065
153	17	13	\N	USER_LOGIN_SUCCESS	user	17	\N	{"email": "tabish@gmial.com", "username": "tabish", "outlet_id": 13}	::1	2026-06-08 15:11:32.577569
154	17	13	\N	ORDER_CREATE	order	62	\N	{"items": [{"dish_id": 17, "quantity": 5, "unit_price": "120.00", "total_price": "600.00"}, {"dish_id": 19, "quantity": 3, "unit_price": "120.00", "total_price": "360.00"}, {"dish_id": 16, "quantity": 7, "unit_price": "130.00", "total_price": "910.00"}, {"dish_id": 31, "quantity": 3, "unit_price": "130.00", "total_price": "390.00"}, {"dish_id": 12, "quantity": 1, "unit_price": "100.00", "total_price": "100.00"}, {"dish_id": 14, "quantity": 3, "unit_price": "200.00", "total_price": "600.00"}, {"dish_id": 28, "quantity": 3, "unit_price": "120.00", "total_price": "360.00"}], "order_type": "dine", "order_number": "ORD-13-20260608-0002", "total_amount": "3320.00"}	::1	2026-06-08 15:13:59.200324
155	17	13	\N	ORDER_CREATE	order	63	\N	{"items": [{"dish_id": 31, "quantity": 1, "unit_price": "130.00", "total_price": "130.00"}], "order_type": "dine", "order_number": "ORD-13-20260608-0003", "total_amount": "130.00"}	::1	2026-06-08 18:43:05.985384
156	17	13	\N	ORDER_CREATE	order	64	\N	{"items": [{"dish_id": 24, "quantity": 1, "unit_price": "120.00", "total_price": "120.00"}, {"dish_id": 31, "quantity": 1, "unit_price": "150.00", "total_price": "150.00"}, {"dish_id": 18, "quantity": 1, "unit_price": "150.00", "total_price": "150.00"}], "order_type": "parcel", "order_number": "ORD-13-20260608-0004", "total_amount": "420.00"}	::1	2026-06-08 18:44:23.485929
157	17	13	\N	ORDER_CREATE	order	65	\N	{"items": [{"dish_id": 18, "quantity": 1, "unit_price": "130.00", "total_price": "130.00"}, {"dish_id": 24, "quantity": 1, "unit_price": "130.00", "total_price": "130.00"}, {"dish_id": 31, "quantity": 1, "unit_price": "130.00", "total_price": "130.00"}, {"dish_id": 12, "quantity": 1, "unit_price": "100.00", "total_price": "100.00"}, {"dish_id": 20, "quantity": 1, "unit_price": "130.00", "total_price": "130.00"}], "order_type": "dine", "order_number": "ORD-13-20260608-0005", "total_amount": "620.00"}	::1	2026-06-08 18:44:59.554608
158	17	13	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-09 10:47:22.730022
159	\N	10	2	STAFF_USER_UPDATE	user	13	{"id": 13, "name": "Shakya", "uuid": "d9762d8c-4973-4c16-b3a6-ea676abda711", "email": "shakya@gmail.com", "status": "active", "app_role": "Admin", "username": "shakya", "outlet_id": 10, "created_at": "2026-06-06T07:20:49.331Z", "role_label": "Manager", "updated_at": "2026-06-06T07:20:49.331Z", "permissions": {"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}}	{"id": 13, "name": "Shakya", "uuid": "d9762d8c-4973-4c16-b3a6-ea676abda711", "email": "shakya@gmail.com", "status": "active", "app_role": "Admin", "username": "shakya", "outlet_id": 10, "created_at": "2026-06-06T07:20:49.331Z", "role_label": "Manager", "updated_at": "2026-06-09T05:17:46.411Z", "permissions": {"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}}	::1	2026-06-09 10:47:46.604579
160	13	10	2	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	::1	2026-06-09 10:47:52.805158
163	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.22	2026-06-09 11:48:53.562811
164	13	10	\N	ORDER_CREATE	order	80	\N	{"items": [{"dish_id": 24, "quantity": 1, "unit_price": "130.00", "total_price": "130.00"}, {"dish_id": 22, "quantity": 1, "unit_price": "130.00", "total_price": "130.00"}, {"dish_id": 20, "quantity": 1, "unit_price": "130.00", "total_price": "130.00"}], "order_type": "dine", "order_number": "ORD-10-20260609-0015", "total_amount": "340.00"}	192.168.1.22	2026-06-09 11:50:01.630441
165	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	::1	2026-06-09 11:51:00.593544
167	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.22	2026-06-09 11:53:31.479176
168	13	10	\N	ORDER_CREATE	order	87	\N	{"items": [{"dish_id": 12, "quantity": 1, "unit_price": "100.00", "total_price": "100.00"}, {"dish_id": 14, "quantity": 1, "unit_price": "200.00", "total_price": "200.00"}, {"dish_id": 25, "quantity": 1, "unit_price": "120.00", "total_price": "120.00"}, {"dish_id": 15, "quantity": 1, "unit_price": "120.00", "total_price": "120.00"}], "order_type": "dine", "order_number": "ORD-10-20260609-0022", "total_amount": "540.00"}	192.168.1.22	2026-06-09 11:54:24.917987
169	13	10	\N	USER_LOGOUT	user	13	\N	\N	192.168.1.22	2026-06-09 12:42:49.943214
170	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	192.168.1.22	2026-06-09 12:46:15.490841
171	\N	\N	2	ADMIN_LOGOUT	admin	2	\N	\N	192.168.1.22	2026-06-09 12:46:18.712541
172	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.22	2026-06-09 12:46:23.800541
173	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.22	2026-06-09 12:48:13.599486
174	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.22	2026-06-09 12:49:01.596201
175	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.22	2026-06-09 12:50:14.032925
176	13	10	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-09 14:05:41.519267
177	13	10	2	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	::1	2026-06-09 14:17:43.040124
178	13	10	\N	ORDER_CREATE	order	96	\N	{"items": [{"dish_id": 13, "quantity": 2, "unit_price": "130.00", "total_price": "260.00"}], "order_type": "dine", "order_number": "ORD-10-20260609-0031", "total_amount": "260.00"}	::1	2026-06-09 14:21:49.33376
179	13	10	\N	ORDER_CREATE	order	97	\N	{"items": [{"dish_id": 20, "quantity": 1, "unit_price": "150.00", "total_price": "150.00"}, {"dish_id": 22, "quantity": 1, "unit_price": "140.00", "total_price": "140.00"}, {"dish_id": 23, "quantity": 1, "unit_price": "200.00", "total_price": "200.00"}], "order_type": "parcel", "order_number": "ORD-10-20260609-0032", "total_amount": "465.50"}	::1	2026-06-09 14:26:16.975879
180	13	10	\N	ORDER_CREATE	order	100	\N	{"items": [{"dish_id": 24, "quantity": 5, "unit_price": "120.00", "total_price": "600.00"}, {"dish_id": 20, "quantity": 3, "unit_price": "150.00", "total_price": "450.00"}], "order_type": "parcel", "order_number": "ORD-10-20260609-0035", "total_amount": "1050.00"}	::1	2026-06-09 14:31:06.431177
181	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	192.168.1.22	2026-06-09 14:34:34.438905
182	13	10	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-09 14:35:10.032484
183	\N	\N	2	ADMIN_LOGOUT	admin	2	\N	\N	192.168.1.22	2026-06-09 14:37:03.333523
184	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.22	2026-06-09 14:37:07.58727
185	13	10	\N	ORDER_CREATE	order	101	\N	{"items": [{"dish_id": 23, "quantity": 1, "unit_price": "100.00", "total_price": "100.00"}, {"dish_id": 24, "quantity": 1, "unit_price": "130.00", "total_price": "130.00"}], "order_type": "dine", "order_number": "ORD-10-20260609-0036", "total_amount": "230.00"}	192.168.1.22	2026-06-09 14:38:19.964903
186	13	10	\N	USER_LOGOUT	user	13	\N	\N	192.168.1.22	2026-06-09 14:40:40.658041
187	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-09 14:43:09.252932
188	13	10	2	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	::1	2026-06-09 14:45:24.302788
189	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.22	2026-06-09 14:51:19.290722
190	13	10	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-09 15:09:09.565074
191	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.22	2026-06-09 16:07:15.077894
192	13	10	\N	USER_LOGOUT	user	13	\N	\N	192.168.1.22	2026-06-09 16:08:18.998397
193	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	192.168.1.22	2026-06-09 16:19:22.185455
194	\N	\N	2	DISH_UPDATE	dish	11	{"id": 11, "cat": null, "veg": true, "name": "Pista Milkshake", "uuid": "1fcfc4f6-35e6-49b8-af31-39aca527c85e", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/7e5b6224-0bc6-40cd-b7f1-f9c36cdae90a.jpg", "created_at": "2026-06-06T10:45:34.600Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-06T10:45:34.600Z", "category_id": 9, "ingredients": ["Refreshing pista syrup"], "is_available": true, "parcel_price": "150.00", "swiggy_price": "160.00", "zomato_price": "120.00", "category_name": "Shakes & Smoothies", "time_required": null}	{"id": 11, "cat": null, "veg": true, "name": "Pista Milkshake", "uuid": "1fcfc4f6-35e6-49b8-af31-39aca527c85e", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/7e5b6224-0bc6-40cd-b7f1-f9c36cdae90a.jpg", "created_at": "2026-06-06T10:45:34.600Z", "created_by": null, "dine_price": "130.00", "updated_at": "2026-06-09T10:50:20.095Z", "category_id": 9, "ingredients": ["Refreshing pista syrup"], "is_available": true, "parcel_price": "150.00", "swiggy_price": "160.00", "zomato_price": "120.00", "category_name": "Shakes & Smoothies", "time_required": null}	192.168.1.22	2026-06-09 16:20:20.241541
195	\N	\N	2	DISH_UPDATE	dish	8	{"id": 8, "cat": null, "veg": true, "name": "Chocolate Shake", "uuid": "d717c4c0-6cb2-4a16-b924-d7d5b5883665", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/9455a03b-d5e0-4005-9c37-02dd99748970.jpg", "created_at": "2026-06-06T10:41:37.372Z", "created_by": null, "dine_price": "100.00", "updated_at": "2026-06-06T10:41:37.372Z", "category_id": 9, "ingredients": ["Shake with Chocolate powder", "syrup", "milk"], "is_available": true, "parcel_price": "200.00", "swiggy_price": "300.00", "zomato_price": "400.00", "category_name": "Shakes & Smoothies", "time_required": null}	{"id": 8, "cat": null, "veg": true, "name": "Chocolate Shake", "uuid": "d717c4c0-6cb2-4a16-b924-d7d5b5883665", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/9455a03b-d5e0-4005-9c37-02dd99748970.jpg", "created_at": "2026-06-06T10:41:37.372Z", "created_by": null, "dine_price": "100.00", "updated_at": "2026-06-09T10:50:24.759Z", "category_id": 9, "ingredients": ["Shake with Chocolate powder", "syrup", "milk"], "is_available": true, "parcel_price": "200.00", "swiggy_price": "300.00", "zomato_price": "400.00", "category_name": "Shakes & Smoothies", "time_required": null}	192.168.1.22	2026-06-09 16:20:24.782103
196	\N	\N	2	DISH_UPDATE	dish	10	{"id": 10, "cat": null, "veg": true, "name": "Kesar Thandai Milkshake", "uuid": "20d8db31-c66e-47e6-b703-62bbe8c0dbdf", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/73d8ab5e-b67b-4913-94b8-41cc39d9861d.jpg", "created_at": "2026-06-06T10:44:37.745Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-06T10:44:37.745Z", "category_id": 9, "ingredients": ["Refreshing kesar thandai syrup & milk"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Shakes & Smoothies", "time_required": null}	{"id": 10, "cat": null, "veg": true, "name": "Kesar Thandai Milkshake", "uuid": "20d8db31-c66e-47e6-b703-62bbe8c0dbdf", "emoji": null, "outlets": ["pune deccan", "shrigonda", "Kharghar", "Seawood"], "image_url": "/uploads/dishes/73d8ab5e-b67b-4913-94b8-41cc39d9861d.jpg", "created_at": "2026-06-06T10:44:37.745Z", "created_by": null, "dine_price": "120.00", "updated_at": "2026-06-09T10:50:34.485Z", "category_id": 9, "ingredients": ["Refreshing kesar thandai syrup & milk"], "is_available": true, "parcel_price": "130.00", "swiggy_price": "150.00", "zomato_price": "160.00", "category_name": "Shakes & Smoothies", "time_required": null}	192.168.1.22	2026-06-09 16:20:34.507563
197	\N	\N	2	ADMIN_LOGOUT	admin	2	\N	\N	192.168.1.22	2026-06-09 16:23:24.572519
198	13	10	\N	USER_LOGIN_SUCCESS	user	13	\N	{"email": "shakya@gmail.com", "username": "shakya", "outlet_id": 10}	192.168.1.22	2026-06-09 16:23:28.487403
199	13	10	\N	ORDER_CREATE	order	102	\N	{"items": [{"dish_id": 25, "quantity": 1, "unit_price": "120.00", "total_price": "120.00"}], "order_type": "dine", "order_number": "ORD-10-20260609-0037", "total_amount": "120.00"}	192.168.1.22	2026-06-09 16:24:24.950465
200	13	10	\N	ORDER_CREATE	order	103	\N	{"items": [{"dish_id": 28, "quantity": 1, "unit_price": "120.00", "total_price": "120.00"}], "order_type": "dine", "order_number": "ORD-10-20260609-0038", "total_amount": "120.00"}	192.168.1.22	2026-06-09 16:25:07.675842
201	13	10	\N	USER_LOGOUT	user	13	\N	\N	192.168.1.22	2026-06-09 16:32:02.869716
202	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	192.168.1.22	2026-06-09 16:32:19.477227
203	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-09 18:55:26.017497
204	\N	\N	2	ADMIN_LOGIN_SUCCESS	admin	2	\N	{"email": "superadmin@guptasandwich.com", "username": "superadmin"}	::1	2026-06-11 12:40:01.966771
\.


--
-- TOC entry 5363 (class 0 OID 17370)
-- Dependencies: 221
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (id, uuid, name, email, username, password_hash, phone, role, is_super_admin, permissions, status, last_login, created_at, updated_at) FROM stdin;
3	60922bee-3966-47b2-8baa-0af89baa48e7	Default Admin	admin@guptasandwich.com	admin	$2b$10$uVkiV3aN0af9SmaEHiWg6OLg1tQuSqun6hC0pzDDoveYDdB/kyPaO	\N	ADMIN	f	{"all": true}	active	\N	2026-06-01 12:56:54.308072	2026-06-01 12:56:54.308072
2	fc7b2f89-9c5d-4558-9498-3a26252d98e2	System Super Admin	superadmin@guptasandwich.com	superadmin	$2b$10$nsibZBPTloa.8lLCE7jbvO29b8TpW6Fyu/YcWGAbH9SVaKvjAiXfy	\N	SUPER_ADMIN	t	{"all": true}	active	2026-06-11 12:40:01.916417	2026-05-25 14:23:11.13301	2026-06-11 12:40:01.916417
\.


--
-- TOC entry 5371 (class 0 OID 17484)
-- Dependencies: 229
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, uuid, name, description, display_order, is_active, created_by, created_at, updated_at) FROM stdin;
1	b7acefa5-0d47-4512-a038-bbcfefb9c9bf	Grilled Sandwiches	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
2	38091fad-20cd-4359-9804-f3fdc26f72fc	Special Grilled / Panini	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
3	7012d1c1-89b1-44be-9075-ac8ded2f5a49	Sandwiches	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
4	35f7e9a8-1885-4730-a1f8-639661187d3b	Panini (Multi-grain)	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
5	849419af-a9e6-4aa5-a0e9-b0a17ef10209	Pizza	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
6	cbbc15d3-0679-45d0-b0da-945aa07755e0	Burgers	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
7	6f761652-9c02-4f3b-a40d-9cbb29baf6da	Appetizers	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
8	09010114-f350-4277-aa28-fb3ac6fcb445	Mocktails	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
9	a6a994b3-1b92-4238-99ec-208f9195f2da	Shakes & Smoothies	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
10	fb29206b-2e5f-45a7-88e6-9fcc91766f3b	Combos	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
11	01bd6a66-9ca1-4c92-ae9e-bb54edfe0473	Party Combo Boxes	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
12	1bf35402-0eba-4555-acfe-55c426389729	Extra Add-ons	\N	0	t	\N	2026-06-06 16:05:26.71011	2026-06-06 16:05:26.71011
13	9fece03d-8739-4a6d-808a-be960dd20757	Stater	\N	0	t	\N	2026-06-09 15:09:45.906592	2026-06-09 15:09:45.906592
\.


--
-- TOC entry 5378 (class 0 OID 17604)
-- Dependencies: 236
-- Data for Name: dish_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dish_ingredients (dish_id, ingredient_id, quantity_required, wastage_percent) FROM stdin;
\.


--
-- TOC entry 5374 (class 0 OID 17544)
-- Dependencies: 232
-- Data for Name: dish_outlets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dish_outlets (dish_id, outlet_id, is_available, custom_price_dine, custom_price_parcel, custom_price_swiggy, custom_price_zomato) FROM stdin;
4	10	t	\N	\N	\N	\N
4	11	t	\N	\N	\N	\N
4	12	t	\N	\N	\N	\N
4	13	t	\N	\N	\N	\N
5	10	t	\N	\N	\N	\N
5	11	t	\N	\N	\N	\N
5	12	t	\N	\N	\N	\N
5	13	t	\N	\N	\N	\N
6	10	t	\N	\N	\N	\N
6	11	t	\N	\N	\N	\N
6	12	t	\N	\N	\N	\N
6	13	t	\N	\N	\N	\N
7	10	t	\N	\N	\N	\N
7	11	t	\N	\N	\N	\N
7	12	t	\N	\N	\N	\N
7	13	t	\N	\N	\N	\N
9	10	t	\N	\N	\N	\N
9	11	t	\N	\N	\N	\N
9	12	t	\N	\N	\N	\N
9	13	t	\N	\N	\N	\N
12	10	t	\N	\N	\N	\N
12	11	t	\N	\N	\N	\N
12	12	t	\N	\N	\N	\N
12	13	t	\N	\N	\N	\N
13	10	t	\N	\N	\N	\N
13	11	t	\N	\N	\N	\N
13	12	t	\N	\N	\N	\N
13	13	t	\N	\N	\N	\N
14	10	t	\N	\N	\N	\N
14	11	t	\N	\N	\N	\N
14	12	t	\N	\N	\N	\N
14	13	t	\N	\N	\N	\N
15	10	t	\N	\N	\N	\N
15	11	t	\N	\N	\N	\N
15	12	t	\N	\N	\N	\N
15	13	t	\N	\N	\N	\N
16	10	t	\N	\N	\N	\N
16	11	t	\N	\N	\N	\N
16	12	t	\N	\N	\N	\N
16	13	t	\N	\N	\N	\N
17	10	t	\N	\N	\N	\N
17	11	t	\N	\N	\N	\N
17	12	t	\N	\N	\N	\N
17	13	t	\N	\N	\N	\N
18	10	t	\N	\N	\N	\N
18	11	t	\N	\N	\N	\N
18	12	t	\N	\N	\N	\N
18	13	t	\N	\N	\N	\N
19	10	t	\N	\N	\N	\N
19	11	t	\N	\N	\N	\N
19	12	t	\N	\N	\N	\N
19	13	t	\N	\N	\N	\N
20	10	t	\N	\N	\N	\N
20	11	t	\N	\N	\N	\N
20	12	t	\N	\N	\N	\N
20	13	t	\N	\N	\N	\N
21	10	t	\N	\N	\N	\N
21	11	t	\N	\N	\N	\N
21	12	t	\N	\N	\N	\N
21	13	t	\N	\N	\N	\N
22	10	t	\N	\N	\N	\N
22	11	t	\N	\N	\N	\N
22	12	t	\N	\N	\N	\N
22	13	t	\N	\N	\N	\N
23	10	t	\N	\N	\N	\N
23	11	t	\N	\N	\N	\N
23	12	t	\N	\N	\N	\N
23	13	t	\N	\N	\N	\N
24	10	t	\N	\N	\N	\N
24	11	t	\N	\N	\N	\N
24	12	t	\N	\N	\N	\N
24	13	t	\N	\N	\N	\N
25	10	t	\N	\N	\N	\N
25	11	t	\N	\N	\N	\N
25	12	t	\N	\N	\N	\N
25	13	t	\N	\N	\N	\N
27	10	t	\N	\N	\N	\N
27	11	t	\N	\N	\N	\N
27	12	t	\N	\N	\N	\N
27	13	t	\N	\N	\N	\N
28	10	t	\N	\N	\N	\N
28	11	t	\N	\N	\N	\N
28	12	t	\N	\N	\N	\N
28	13	t	\N	\N	\N	\N
29	10	t	\N	\N	\N	\N
29	11	t	\N	\N	\N	\N
29	12	t	\N	\N	\N	\N
29	13	t	\N	\N	\N	\N
30	10	t	\N	\N	\N	\N
30	11	t	\N	\N	\N	\N
30	12	t	\N	\N	\N	\N
30	13	t	\N	\N	\N	\N
31	10	t	\N	\N	\N	\N
31	11	t	\N	\N	\N	\N
31	12	t	\N	\N	\N	\N
31	13	t	\N	\N	\N	\N
32	10	t	\N	\N	\N	\N
32	11	t	\N	\N	\N	\N
32	12	t	\N	\N	\N	\N
32	13	t	\N	\N	\N	\N
11	12	t	\N	\N	\N	\N
11	10	t	\N	\N	\N	\N
11	13	t	\N	\N	\N	\N
11	11	t	\N	\N	\N	\N
8	12	t	\N	\N	\N	\N
8	10	t	\N	\N	\N	\N
8	13	t	\N	\N	\N	\N
8	11	t	\N	\N	\N	\N
10	12	t	\N	\N	\N	\N
10	10	t	\N	\N	\N	\N
10	13	t	\N	\N	\N	\N
10	11	t	\N	\N	\N	\N
\.


--
-- TOC entry 5373 (class 0 OID 17509)
-- Dependencies: 231
-- Data for Name: dishes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dishes (id, uuid, name, category_id, cat, dine_price, parcel_price, swiggy_price, zomato_price, ingredients, emoji, veg, time_required, is_available, created_by, created_at, updated_at, image_url) FROM stdin;
21	4a9aa095-5dda-4d5d-9ee1-7f25e375cc8f	Garlic Bread [4 Pieces]	7	\N	120.00	130.00	150.00	160.00	{"Classic plain bread"}	\N	t	\N	t	\N	2026-06-06 16:38:52.728321	2026-06-06 16:38:52.728321	/uploads/dishes/91ac335c-b42c-458a-85d5-4d34bd17b926.jpg
22	8c1d5230-a25d-466c-bbda-56faa12cbd49	Garlic Bread with Cheese [4 Pieces]	7	\N	130.00	140.00	150.00	160.00	{"Garlic Bread topped with cheese"}	\N	t	\N	t	\N	2026-06-06 16:39:49.182214	2026-06-06 16:39:49.182214	/uploads/dishes/3668c288-4816-448f-8239-1327944e7e53.jpg
23	aa9ce177-d762-4ced-ab8d-d4f5db6358c4	Garlic Bread Spicy Chatkara [4 Pieces]	7	\N	100.00	200.00	300.00	400.00	{"(Spicy) Garnished with onion","green chilly & cheese"}	\N	t	\N	t	\N	2026-06-06 16:41:28.181324	2026-06-06 16:41:28.181324	/uploads/dishes/e0745d01-2538-4840-9684-0b4c83167f9a.jpg
24	2daffb04-7bbe-48be-8813-29c0c8ec5ea2	French Fries	7	\N	130.00	120.00	150.00	160.00	{"Potato fries with exotic seasonings"}	\N	t	\N	t	\N	2026-06-06 16:42:39.719602	2026-06-06 16:42:39.719602	/uploads/dishes/5431e1c2-3e71-430c-9b85-00b7525b0927.jpg
25	e55346ae-b8f4-40dc-b12b-e456caf4a4bd	Plain Cheese Pizza	5	\N	120.00	130.00	150.00	160.00	{"Topped with lots of cheese"}	\N	t	\N	t	\N	2026-06-06 16:44:01.538618	2026-06-06 16:44:01.538618	/uploads/dishes/b9743714-9440-4ef5-be40-c4d26db3d7d0.jpg
4	e81d1a98-8af8-4131-b63b-9a360158020b	Sada Sandwich	\N	\N	200.00	300.00	400.00	500.00	{bread-2pc,vegies}	\N	t	\N	t	\N	2026-06-06 15:09:15.83166	2026-06-06 16:05:04.21992	/uploads/dishes/952a96a8-207f-4415-a07a-0fa2a2f96bda.jpg
5	88a7018d-0f73-4f5e-b8c8-07e7ffd0b5af	Diet Toast Sandwich	\N	\N	100.00	200.00	300.00	500.00	{"Fresh veggie","green chutney","special herbs and spices."}	\N	t	\N	t	\N	2026-06-06 15:14:05.747716	2026-06-06 16:05:04.21992	/uploads/dishes/a2faa71a-a1d2-4f28-b7b4-b3311a56ec88.jpg
7	04d7b04d-d831-4e1d-8c92-aa6ffd12ec58	Veg Burger	\N	\N	200.00	300.00	100.00	200.00	{"Classic veggie patty in a soft bun"}	\N	t	\N	t	\N	2026-06-06 15:18:40.474446	2026-06-06 16:05:04.21992	/uploads/dishes/602f6777-5c06-466d-916c-b196e6a459e2.jpg
6	5cf03be8-418c-46d7-8e02-d73dfc6b4500	Paneer Tikka Panini	\N	\N	100.00	110.00	200.00	120.00	{"Tandoori paneer",onion,capsicum,cheese,cabbage}	\N	t	\N	t	\N	2026-06-06 15:15:10.914429	2026-06-06 16:05:04.21992	/uploads/dishes/614474ac-c273-4f88-b48f-9f3fd4276fe0.jpg
9	172db79d-344f-4f3d-ba56-ef2c30c1f4b5	Butterscotch Milkshake	9	\N	100.00	120.00	130.00	150.00	{"shake with Butterscotch"}	\N	t	\N	t	\N	2026-06-06 16:13:43.011735	2026-06-06 16:13:43.011735	/uploads/dishes/4cd05f73-9046-468e-b9c5-7ba5ff914fae.jpg
12	46223fea-bbe4-46a2-8b79-9b181de2bb40	Fresh Lime	8	\N	100.00	120.00	130.00	150.00	{"Fresh lime",soda}	\N	t	\N	t	\N	2026-06-06 16:20:59.036472	2026-06-06 16:20:59.036472	/uploads/dishes/418108ac-3c4f-4537-9f4a-1f2b21eb8960.jpg
13	82f078d6-9a38-47b2-b5a3-0da9537b31d0	Lemon Ice- Tea	8	\N	130.00	140.00	150.00	160.00	{"Lemon flavour ice tea powder garnished with lemon"}	\N	t	\N	t	\N	2026-06-06 16:23:19.986813	2026-06-06 16:23:19.986813	/uploads/dishes/c1c29eca-e370-4dc7-8490-24e4faf61eb8.jpg
14	0b477ddb-96ac-408e-9cee-91c871b5d8fa	Mint Mojito Blast	8	\N	200.00	220.00	230.00	240.00	{Mojito,"Sprite with lemon ice of mint"}	\N	t	\N	t	\N	2026-06-06 16:25:16.397473	2026-06-06 16:25:16.397473	/uploads/dishes/498a3663-6a4f-4890-af2b-4d13d3092f48.jpg
15	8b5c3a41-1bd7-4675-bc9d-a15a79909d32	Blue Lagoon Mojito	3	\N	120.00	130.00	150.00	160.00	{"Blue syrup","lime juice mint",sprite,soda}	\N	t	\N	t	\N	2026-06-06 16:26:45.408249	2026-06-06 16:26:45.408249	/uploads/dishes/f16ac2c4-560e-4438-ae65-0ec24317d625.jpg
16	76a7a533-ec16-4aae-ba92-6369cbdda333	Veg Cheese Burger	6	\N	130.00	150.00	160.00	170.00	{"Veg burger topped with cheese"}	\N	t	\N	t	\N	2026-06-06 16:29:26.365828	2026-06-06 16:29:26.365828	/uploads/dishes/4e29f874-e2b9-4adc-983b-8ec50b503be6.jpg
17	73271830-ffdb-42f4-98ce-72f0f30e458c	Schezwan Cheese Burger	6	\N	120.00	130.00	150.00	160.00	{"Spicy schezwan sauce with cheese"}	\N	t	\N	t	\N	2026-06-06 16:31:49.281409	2026-06-06 16:31:49.281409	/uploads/dishes/52163843-0df5-42c2-bf78-a265e29b5f01.jpg
18	54111d71-0b65-4bd2-8409-ba09aed9b785	Mexican Cheese Burger	6	\N	130.00	150.00	170.00	180.00	{"Mexican flavors with veggies & cheese"}	\N	t	\N	t	\N	2026-06-06 16:34:14.149959	2026-06-06 16:34:14.149959	/uploads/dishes/e3a89413-d599-4a27-9ec7-95cd5f8c9e52.jpg
19	f4212fc6-8b8b-40b9-9fdd-3eb6a6dd5889	Tandoori Cheese Burger	6	\N	120.00	130.00	150.00	160.00	{"Flavored with tandoori sauce & cheese"}	\N	t	\N	t	\N	2026-06-06 16:35:55.122917	2026-06-06 16:35:55.122917	/uploads/dishes/366d7ffd-0e50-42ad-a91b-bcd8903b3a1e.jpg
20	55256f4e-6a35-4675-a325-b84e2e8c1164	Jain Cheese Burger	6	\N	130.00	150.00	160.00	170.00	{"No onion or garlic","with cheese"}	\N	t	\N	t	\N	2026-06-06 16:37:35.707494	2026-06-06 16:37:35.707494	/uploads/dishes/bb044141-6a00-4abb-87d3-0412cb1bcad0.jpg
27	aaa01237-2281-46d7-916c-bcfe0e52179d	Simple Best Pizza	5	\N	130.00	150.00	160.00	160.00	{Tomato,onion,"capsicum and cheese"}	\N	t	\N	t	\N	2026-06-06 16:49:14.093413	2026-06-06 16:49:14.093413	/uploads/dishes/f67c34a8-00ba-4a07-b1ad-326ea708afed.jpg
28	be8c324d-b6e2-4ed6-b53e-618fa187c0da	Hot and Spicy Pizza	5	\N	120.00	130.00	150.00	160.00	{"Spicy tomato","onion and capsicum","garnished with green chilly & cheese"}	\N	t	\N	t	\N	2026-06-06 16:50:28.345376	2026-06-06 16:50:28.345376	/uploads/dishes/c95384ea-d0c9-4d80-9b68-27ee96d1f855.jpg
29	c4f23501-8fe9-4b3d-ac1d-c5803c1aa46b	Chocolaty Bites Toast Sandwich	3	\N	200.00	220.00	230.00	240.00	{"Chocolate melted sauce with bread."}	\N	t	\N	t	\N	2026-06-06 16:53:52.270609	2026-06-06 16:53:52.270609	/uploads/dishes/758b79ac-4818-4869-b535-628128ad7d11.jpg
30	db64187b-b1d5-4a3c-952b-b7d126710e84	Jam Toast Sandwich	3	\N	120.00	130.00	140.00	150.00	{"Mixed fruit jam."}	\N	t	\N	t	\N	2026-06-06 16:55:18.895706	2026-06-06 16:55:18.895706	/uploads/dishes/2a1405ba-fa99-46c5-b346-7118351869ea.jpg
31	fccbdee6-1e0a-4135-a680-aa425da05af1	Diet Grilled	1	\N	130.00	150.00	160.00	200.00	{Tomato,capsicum,onion,"cucumber with special herbs and spices."}	\N	t	\N	t	\N	2026-06-06 16:56:55.240917	2026-06-06 16:56:55.240917	/uploads/dishes/f423017f-cda0-4f8d-a00a-e25b53d2f9ad.jpg
32	4368dd86-5f5c-4aa5-929a-12c003ebc513	Paneer Cheesy Grilled	1	\N	130.00	150.00	160.00	170.00	{"Diced paneer cubes","veggie puree melted with cheese and butter."}	\N	t	\N	t	\N	2026-06-06 16:58:40.29548	2026-06-06 16:58:40.29548	/uploads/dishes/a5a0e24b-c40f-4ad4-a681-b2459eb3b242.jpg
11	1fcfc4f6-35e6-49b8-af31-39aca527c85e	Pista Milkshake	9	\N	130.00	150.00	160.00	120.00	{"Refreshing pista syrup"}	\N	t	\N	t	\N	2026-06-06 16:15:34.600776	2026-06-09 16:20:20.095113	/uploads/dishes/7e5b6224-0bc6-40cd-b7f1-f9c36cdae90a.jpg
8	d717c4c0-6cb2-4a16-b924-d7d5b5883665	Chocolate Shake	9	\N	100.00	200.00	300.00	400.00	{"Shake with Chocolate powder",syrup,milk}	\N	t	\N	t	\N	2026-06-06 16:11:37.372	2026-06-09 16:20:24.759962	/uploads/dishes/9455a03b-d5e0-4005-9c37-02dd99748970.jpg
10	20d8db31-c66e-47e6-b703-62bbe8c0dbdf	Kesar Thandai Milkshake	9	\N	120.00	130.00	150.00	160.00	{"Refreshing kesar thandai syrup & milk"}	\N	t	\N	t	\N	2026-06-06 16:14:37.745285	2026-06-09 16:20:34.485092	/uploads/dishes/73d8ab5e-b67b-4913-94b8-41cc39d9861d.jpg
\.


--
-- TOC entry 5392 (class 0 OID 17866)
-- Dependencies: 250
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, outlet_id, expense_type, amount, expense_date, vendor_name, bill_number, bill_url, notes, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5377 (class 0 OID 17581)
-- Dependencies: 235
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredients (id, uuid, name, unit, cost_per_unit, current_stock, reorder_level, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5380 (class 0 OID 17625)
-- Dependencies: 238
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_transactions (id, outlet_id, ingredient_id, transaction_type, quantity, notes, reference_id, transaction_date, created_by) FROM stdin;
\.


--
-- TOC entry 5386 (class 0 OID 17739)
-- Dependencies: 244
-- Data for Name: kot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kot (id, kot_number, order_id, outlet_id, table_number, order_type, status, is_urgent, sent_time, ready_time, served_time, created_by) FROM stdin;
92	KOT-10-20260609-0035	100	10	\N	parcel	served	f	2026-06-09 14:31:06.413235	2026-06-09 14:31:11.884834	2026-06-09 14:31:12.601417	\N
93	KOT-10-20260609-0036	101	10	\N	dine	pending	f	2026-06-09 14:38:19.946105	\N	\N	\N
83	KOT-10-20260609-0026	91	10	\N	zomato	served	f	2026-06-09 12:36:33.826769	2026-06-09 16:26:03.641734	2026-06-09 16:26:04.636952	\N
94	KOT-10-20260609-0037	102	10	\N	dine	preparing	f	2026-06-09 16:24:24.929723	\N	\N	\N
25	KOT-10-20260606-0001	33	10	\N	dine	served	f	2026-06-06 15:25:11.897691	2026-06-06 15:25:48.743896	2026-06-06 15:25:50.52819	\N
95	KOT-10-20260609-0038	103	10	\N	dine	served	t	2026-06-09 16:25:07.660479	2026-06-09 16:26:21.580298	2026-06-09 16:26:22.489056	\N
27	KOT-10-20260606-0003	35	10	\N	zomato	served	f	2026-06-06 15:28:55.453724	2026-06-06 15:29:11.408408	2026-06-06 15:29:12.316492	\N
26	KOT-10-20260606-0002	34	10	\N	swiggy	served	f	2026-06-06 15:28:55.348525	2026-06-06 15:30:09.948345	2026-06-06 15:30:10.479729	\N
28	KOT-10-20260606-0004	36	10	\N	dine	served	f	2026-06-06 15:38:45.373304	2026-06-06 15:38:49.720519	2026-06-06 15:38:50.961551	\N
29	KOT-10-20260608-0001	37	10	\N	swiggy	pending	f	2026-06-08 13:03:47.598646	\N	\N	\N
30	KOT-10-20260608-0002	38	10	\N	zomato	pending	f	2026-06-08 13:03:47.863484	\N	\N	\N
31	KOT-10-20260608-0003	39	10	\N	swiggy	pending	f	2026-06-08 13:06:38.709481	\N	\N	\N
32	KOT-10-20260608-0004	40	10	\N	zomato	pending	f	2026-06-08 13:06:38.925762	\N	\N	\N
33	KOT-10-20260608-0005	41	10	\N	swiggy	pending	f	2026-06-08 13:07:14.757535	\N	\N	\N
34	KOT-10-20260608-0006	42	10	\N	zomato	pending	f	2026-06-08 13:07:14.796106	\N	\N	\N
35	KOT-13-20260608-0001	43	13	\N	dine	pending	f	2026-06-08 13:07:27.566708	\N	\N	\N
36	KOT-10-20260608-0007	44	10	\N	swiggy	pending	f	2026-06-08 13:09:53.241517	\N	\N	\N
37	KOT-10-20260608-0008	45	10	\N	zomato	pending	f	2026-06-08 13:09:53.547868	\N	\N	\N
40	KOT-10-20260608-0011	48	10	\N	swiggy	pending	f	2026-06-08 13:10:36.442539	\N	\N	\N
41	KOT-10-20260608-0012	49	10	\N	zomato	pending	f	2026-06-08 13:10:36.572503	\N	\N	\N
42	KOT-10-20260608-0013	50	10	\N	swiggy	pending	f	2026-06-08 13:24:47.955534	\N	\N	\N
43	KOT-10-20260608-0014	51	10	\N	zomato	pending	f	2026-06-08 13:24:48.143087	\N	\N	\N
44	KOT-10-20260608-0015	52	10	\N	swiggy	pending	f	2026-06-08 13:26:10.492666	\N	\N	\N
45	KOT-10-20260608-0016	53	10	\N	zomato	pending	f	2026-06-08 13:26:10.541761	\N	\N	\N
46	KOT-10-20260608-0017	54	10	\N	swiggy	pending	f	2026-06-08 13:27:26.347991	\N	\N	\N
47	KOT-10-20260608-0018	55	10	\N	zomato	pending	f	2026-06-08 13:27:26.449609	\N	\N	\N
48	KOT-10-20260608-0019	56	10	\N	swiggy	pending	f	2026-06-08 13:28:02.482422	\N	\N	\N
49	KOT-10-20260608-0020	57	10	\N	zomato	pending	f	2026-06-08 13:28:02.606224	\N	\N	\N
50	KOT-10-20260608-0021	58	10	\N	swiggy	pending	f	2026-06-08 13:40:57.164321	\N	\N	\N
51	KOT-10-20260608-0022	59	10	\N	zomato	pending	f	2026-06-08 13:40:57.270248	\N	\N	\N
52	KOT-10-20260608-0023	60	10	\N	swiggy	pending	f	2026-06-08 13:41:15.025637	\N	\N	\N
38	KOT-10-20260608-0009	46	10	\N	swiggy	served	f	2026-06-08 13:10:28.890487	2026-06-08 14:47:30.667912	2026-06-08 14:47:32.102486	\N
39	KOT-10-20260608-0010	47	10	\N	zomato	served	f	2026-06-08 13:10:29.000779	2026-06-08 14:47:51.526734	2026-06-08 14:47:52.666914	\N
53	KOT-10-20260608-0024	61	10	\N	zomato	served	f	2026-06-08 13:41:15.068959	2026-06-08 14:47:58.559256	2026-06-08 14:48:06.938163	\N
54	KOT-13-20260608-0002	62	13	\N	dine	pending	f	2026-06-08 15:13:59.136791	\N	\N	\N
55	KOT-13-20260608-0003	63	13	\N	dine	pending	f	2026-06-08 18:43:05.862549	\N	\N	\N
56	KOT-13-20260608-0004	64	13	\N	parcel	pending	f	2026-06-08 18:44:23.432737	\N	\N	\N
57	KOT-13-20260608-0005	65	13	\N	dine	pending	f	2026-06-08 18:44:59.527631	\N	\N	\N
58	KOT-10-20260609-0001	66	10	\N	swiggy	pending	f	2026-06-09 10:23:11.417993	\N	\N	\N
59	KOT-10-20260609-0002	67	10	\N	zomato	pending	f	2026-06-09 10:23:11.518831	\N	\N	\N
60	KOT-10-20260609-0003	68	10	\N	swiggy	pending	f	2026-06-09 10:45:20.219293	\N	\N	\N
61	KOT-10-20260609-0004	69	10	\N	zomato	pending	f	2026-06-09 10:45:20.311673	\N	\N	\N
62	KOT-10-20260609-0005	70	10	\N	swiggy	pending	f	2026-06-09 10:46:01.588449	\N	\N	\N
63	KOT-10-20260609-0006	71	10	\N	zomato	pending	f	2026-06-09 10:46:01.704537	\N	\N	\N
64	KOT-10-20260609-0007	72	10	\N	swiggy	pending	f	2026-06-09 10:48:00.91789	\N	\N	\N
65	KOT-10-20260609-0008	73	10	\N	zomato	pending	f	2026-06-09 10:48:00.947765	\N	\N	\N
66	KOT-10-20260609-0009	74	10	\N	swiggy	pending	f	2026-06-09 10:48:13.735402	\N	\N	\N
67	KOT-10-20260609-0010	75	10	\N	zomato	pending	f	2026-06-09 10:48:13.770716	\N	\N	\N
68	KOT-10-20260609-0011	76	10	\N	swiggy	pending	f	2026-06-09 10:48:23.696009	\N	\N	\N
69	KOT-10-20260609-0012	77	10	\N	zomato	pending	f	2026-06-09 10:48:23.726274	\N	\N	\N
70	KOT-10-20260609-0013	78	10	\N	swiggy	pending	f	2026-06-09 10:48:34.989605	\N	\N	\N
71	KOT-10-20260609-0014	79	10	\N	zomato	pending	f	2026-06-09 10:48:35.025476	\N	\N	\N
72	KOT-10-20260609-0015	80	10	\N	dine	served	f	2026-06-09 11:50:01.603894	2026-06-09 11:50:07.890536	2026-06-09 11:50:08.942095	\N
73	KOT-10-20260609-0016	81	10	\N	swiggy	pending	f	2026-06-09 11:50:49.588227	\N	\N	\N
74	KOT-10-20260609-0017	82	10	\N	zomato	pending	f	2026-06-09 11:50:49.619942	\N	\N	\N
75	KOT-10-20260609-0018	83	10	\N	swiggy	pending	f	2026-06-09 11:51:08.947972	\N	\N	\N
76	KOT-10-20260609-0019	84	10	\N	zomato	pending	f	2026-06-09 11:51:08.981249	\N	\N	\N
77	KOT-10-20260609-0020	85	10	\N	swiggy	pending	f	2026-06-09 11:51:49.848038	\N	\N	\N
78	KOT-10-20260609-0021	86	10	\N	zomato	pending	f	2026-06-09 11:51:49.871461	\N	\N	\N
80	KOT-10-20260609-0023	88	10	\N	swiggy	pending	f	2026-06-09 12:36:13.434465	\N	\N	\N
81	KOT-10-20260609-0024	89	10	\N	zomato	served	f	2026-06-09 12:36:13.537595	2026-06-09 12:36:25.700877	2026-06-09 12:36:26.621916	\N
84	KOT-10-20260609-0027	92	10	\N	swiggy	pending	f	2026-06-09 12:36:44.192566	\N	\N	\N
85	KOT-10-20260609-0028	93	10	\N	zomato	pending	f	2026-06-09 12:36:44.221164	\N	\N	\N
86	KOT-10-20260609-0029	94	10	\N	swiggy	pending	f	2026-06-09 12:36:50.098688	\N	\N	\N
87	KOT-10-20260609-0030	95	10	\N	zomato	pending	f	2026-06-09 12:36:50.125862	\N	\N	\N
82	KOT-10-20260609-0025	90	10	\N	swiggy	served	f	2026-06-09 12:36:33.800845	2026-06-09 12:36:56.333887	2026-06-09 12:37:03.0769	\N
88	KOT-10-20260609-0031	96	10	\N	dine	served	f	2026-06-09 14:21:49.284533	2026-06-09 14:21:57.624378	2026-06-09 14:22:00.510959	\N
89	KOT-10-20260609-0032	97	10	\N	parcel	pending	f	2026-06-09 14:26:16.957854	\N	\N	\N
79	KOT-10-20260609-0022	87	10	\N	dine	served	f	2026-06-09 11:54:24.898191	2026-06-09 14:26:30.045968	2026-06-09 14:26:32.559061	\N
90	KOT-10-20260609-0033	98	10	\N	swiggy	pending	f	2026-06-09 14:28:05.805831	\N	\N	\N
91	KOT-10-20260609-0034	99	10	\N	zomato	served	f	2026-06-09 14:28:05.845337	2026-06-09 14:29:40.35923	2026-06-09 14:29:41.376329	\N
\.


--
-- TOC entry 5388 (class 0 OID 17773)
-- Dependencies: 246
-- Data for Name: kot_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kot_items (id, kot_id, order_item_id, dish_name, quantity, is_ready, ready_time) FROM stdin;
47	25	48	Veg Burger	3	t	2026-06-06 15:25:41.513552
48	25	49	Diet Toast Sandwich	2	t	2026-06-06 15:25:48.743896
51	27	52	Sada Sandwich	1	t	2026-06-06 15:29:10.723241
52	27	53	Sada Sandwich	3	t	2026-06-06 15:29:11.408408
49	26	50	Sada Sandwich	2	t	2026-06-06 15:30:09.133598
50	26	51	Sada Sandwich	1	t	2026-06-06 15:30:09.948345
53	28	54	Diet Toast Sandwich	1	t	2026-06-06 15:38:49.331975
54	28	55	Sada Sandwich	1	t	2026-06-06 15:38:49.720519
55	29	56	Garlic Bread [4 Pieces]	2	f	\N
56	29	57	Sada Sandwich	1	f	\N
57	30	58	Garlic Bread [4 Pieces]	1	f	\N
58	30	59	Sada Sandwich	3	f	\N
59	31	60	Garlic Bread [4 Pieces]	2	f	\N
60	31	61	Sada Sandwich	1	f	\N
61	32	62	Garlic Bread [4 Pieces]	1	f	\N
62	32	63	Sada Sandwich	3	f	\N
63	33	64	Garlic Bread [4 Pieces]	2	f	\N
64	33	65	Sada Sandwich	1	f	\N
65	34	66	Garlic Bread [4 Pieces]	1	f	\N
66	34	67	Sada Sandwich	3	f	\N
67	35	68	Garlic Bread Spicy Chatkara [4 Pieces]	1	f	\N
68	36	69	Garlic Bread [4 Pieces]	2	f	\N
69	36	70	Sada Sandwich	1	f	\N
70	37	71	Garlic Bread [4 Pieces]	1	f	\N
71	37	72	Sada Sandwich	3	f	\N
76	40	77	Garlic Bread [4 Pieces]	2	f	\N
77	40	78	Sada Sandwich	1	f	\N
78	41	79	Garlic Bread [4 Pieces]	1	f	\N
79	41	80	Sada Sandwich	3	f	\N
80	42	81	Garlic Bread [4 Pieces]	2	f	\N
81	42	82	Sada Sandwich	1	f	\N
82	43	83	Garlic Bread [4 Pieces]	1	f	\N
83	43	84	Sada Sandwich	3	f	\N
84	44	85	Garlic Bread [4 Pieces]	2	f	\N
85	44	86	Sada Sandwich	1	f	\N
86	45	87	Garlic Bread [4 Pieces]	1	f	\N
87	45	88	Sada Sandwich	3	f	\N
88	46	89	Garlic Bread [4 Pieces]	2	f	\N
89	46	90	Sada Sandwich	1	f	\N
90	47	91	Garlic Bread [4 Pieces]	1	f	\N
91	47	92	Sada Sandwich	3	f	\N
92	48	93	Garlic Bread [4 Pieces]	2	f	\N
93	48	94	Sada Sandwich	1	f	\N
94	49	95	Garlic Bread [4 Pieces]	1	f	\N
95	49	96	Sada Sandwich	3	f	\N
96	50	97	Garlic Bread [4 Pieces]	2	f	\N
97	50	98	Sada Sandwich	1	f	\N
98	51	99	Garlic Bread [4 Pieces]	1	f	\N
99	51	100	Sada Sandwich	3	f	\N
100	52	101	Garlic Bread [4 Pieces]	2	f	\N
101	52	102	Sada Sandwich	1	f	\N
72	38	73	Garlic Bread [4 Pieces]	2	t	2026-06-08 14:47:30.667912
73	38	74	Sada Sandwich	1	t	2026-06-08 14:47:30.667912
74	39	75	Garlic Bread [4 Pieces]	1	t	2026-06-08 14:47:51.526734
75	39	76	Sada Sandwich	3	t	2026-06-08 14:47:51.526734
102	53	103	Garlic Bread [4 Pieces]	1	t	2026-06-08 14:47:58.559256
103	53	104	Sada Sandwich	3	t	2026-06-08 14:47:58.559256
104	54	105	Schezwan Cheese Burger	5	f	\N
105	54	106	Tandoori Cheese Burger	3	f	\N
106	54	107	Veg Cheese Burger	7	f	\N
107	54	108	Diet Grilled	3	f	\N
108	54	109	Fresh Lime	1	f	\N
109	54	110	Mint Mojito Blast	3	f	\N
110	54	111	Hot and Spicy Pizza	3	f	\N
111	55	112	Diet Grilled	1	f	\N
112	56	113	French Fries	1	f	\N
113	56	114	Diet Grilled	1	f	\N
114	56	115	Mexican Cheese Burger	1	f	\N
115	57	116	Mexican Cheese Burger	1	f	\N
116	57	117	French Fries	1	f	\N
117	57	118	Diet Grilled	1	f	\N
118	57	119	Fresh Lime	1	f	\N
119	57	120	Jain Cheese Burger	1	f	\N
120	58	121	Garlic Bread [4 Pieces]	2	f	\N
121	58	122	Sada Sandwich	1	f	\N
122	59	123	Garlic Bread [4 Pieces]	1	f	\N
123	59	124	Sada Sandwich	3	f	\N
124	60	125	Garlic Bread [4 Pieces]	2	f	\N
125	60	126	Sada Sandwich	1	f	\N
126	61	127	Garlic Bread [4 Pieces]	1	f	\N
127	61	128	Sada Sandwich	3	f	\N
128	62	129	Garlic Bread [4 Pieces]	2	f	\N
129	62	130	Sada Sandwich	1	f	\N
130	63	131	Garlic Bread [4 Pieces]	1	f	\N
131	63	132	Sada Sandwich	3	f	\N
132	64	133	Garlic Bread [4 Pieces]	2	f	\N
133	64	134	Sada Sandwich	1	f	\N
134	65	135	Garlic Bread [4 Pieces]	1	f	\N
135	65	136	Sada Sandwich	3	f	\N
136	66	137	Garlic Bread [4 Pieces]	2	f	\N
137	66	138	Sada Sandwich	1	f	\N
138	67	139	Garlic Bread [4 Pieces]	1	f	\N
139	67	140	Sada Sandwich	3	f	\N
140	68	141	Garlic Bread [4 Pieces]	2	f	\N
141	68	142	Sada Sandwich	1	f	\N
142	69	143	Garlic Bread [4 Pieces]	1	f	\N
143	69	144	Sada Sandwich	3	f	\N
144	70	145	Garlic Bread [4 Pieces]	2	f	\N
145	70	146	Sada Sandwich	1	f	\N
146	71	147	Garlic Bread [4 Pieces]	1	f	\N
147	71	148	Sada Sandwich	3	f	\N
148	72	149	French Fries	1	t	2026-06-09 11:50:05.701004
149	72	150	Garlic Bread with Cheese [4 Pieces]	1	t	2026-06-09 11:50:06.832324
150	72	151	Jain Cheese Burger	1	t	2026-06-09 11:50:07.890536
151	73	152	Garlic Bread [4 Pieces]	2	f	\N
152	73	153	Sada Sandwich	1	f	\N
153	74	154	Garlic Bread [4 Pieces]	1	f	\N
154	74	155	Sada Sandwich	3	f	\N
155	75	156	Garlic Bread [4 Pieces]	2	f	\N
156	75	157	Sada Sandwich	1	f	\N
157	76	158	Garlic Bread [4 Pieces]	1	f	\N
158	76	159	Sada Sandwich	3	f	\N
159	77	160	Garlic Bread [4 Pieces]	2	f	\N
160	77	161	Sada Sandwich	1	f	\N
161	78	162	Garlic Bread [4 Pieces]	1	f	\N
162	78	163	Sada Sandwich	3	f	\N
167	80	168	Garlic Bread [4 Pieces]	2	f	\N
168	80	169	Sada Sandwich	1	f	\N
169	81	170	Garlic Bread [4 Pieces]	1	t	2026-06-09 12:36:25.700877
170	81	171	Sada Sandwich	3	t	2026-06-09 12:36:25.700877
175	84	176	Garlic Bread [4 Pieces]	2	f	\N
176	84	177	Sada Sandwich	1	f	\N
177	85	178	Garlic Bread [4 Pieces]	1	f	\N
178	85	179	Sada Sandwich	3	f	\N
179	86	180	Garlic Bread [4 Pieces]	2	f	\N
180	86	181	Sada Sandwich	1	f	\N
181	87	182	Garlic Bread [4 Pieces]	1	f	\N
182	87	183	Sada Sandwich	3	f	\N
171	82	172	Garlic Bread [4 Pieces]	2	t	2026-06-09 12:36:56.333887
172	82	173	Sada Sandwich	1	t	2026-06-09 12:36:56.333887
183	88	184	Lemon Ice- Tea	2	t	2026-06-09 14:21:57.624378
184	89	185	Jain Cheese Burger	1	f	\N
185	89	186	Garlic Bread with Cheese [4 Pieces]	1	f	\N
186	89	187	Garlic Bread Spicy Chatkara [4 Pieces]	1	f	\N
165	79	166	Plain Cheese Pizza	1	t	2026-06-09 14:26:30.045968
166	79	167	Blue Lagoon Mojito	1	t	2026-06-09 14:26:30.045968
163	79	164	Fresh Lime	1	t	2026-06-09 14:26:30.045968
164	79	165	Mint Mojito Blast	1	t	2026-06-09 14:26:30.045968
187	90	188	Garlic Bread [4 Pieces]	2	f	\N
188	90	189	Sada Sandwich	1	f	\N
189	91	190	Garlic Bread [4 Pieces]	1	t	2026-06-09 14:29:40.35923
190	91	191	Sada Sandwich	3	t	2026-06-09 14:29:40.35923
191	92	192	French Fries	5	t	2026-06-09 14:31:11.884834
192	92	193	Jain Cheese Burger	3	t	2026-06-09 14:31:11.884834
193	93	194	Garlic Bread Spicy Chatkara [4 Pieces]	1	f	\N
194	93	195	French Fries	1	f	\N
195	94	196	Plain Cheese Pizza	1	f	\N
173	83	174	Garlic Bread [4 Pieces]	1	t	2026-06-09 16:26:01.616214
174	83	175	Sada Sandwich	3	t	2026-06-09 16:26:03.641734
196	95	197	Hot and Spicy Pizza	1	t	2026-06-09 16:26:21.580298
\.


--
-- TOC entry 5400 (class 0 OID 17976)
-- Dependencies: 258
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, outlet_id, user_id, admin_id, title, message, type, is_read, created_at, read_at) FROM stdin;
\.


--
-- TOC entry 5384 (class 0 OID 17706)
-- Dependencies: 242
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, dish_id, quantity, unit_price, total_price, special_instructions, is_ready, ready_time, created_at) FROM stdin;
48	33	7	3	200.00	600.00	\N	t	2026-06-06 15:25:41.513552	2026-06-06 15:25:11.897691
49	33	5	2	100.00	200.00	\N	t	2026-06-06 15:25:48.743896	2026-06-06 15:25:11.897691
52	35	4	1	500.00	500.00	\N	t	2026-06-06 15:29:10.723241	2026-06-06 15:28:55.453724
53	35	4	3	500.00	1500.00	\N	t	2026-06-06 15:29:11.408408	2026-06-06 15:28:55.453724
50	34	4	2	400.00	800.00	\N	t	2026-06-06 15:30:09.133598	2026-06-06 15:28:55.348525
51	34	4	1	400.00	400.00	\N	t	2026-06-06 15:30:09.948345	2026-06-06 15:28:55.348525
54	36	5	1	100.00	100.00	\N	t	2026-06-06 15:38:49.331975	2026-06-06 15:38:45.373304
55	36	4	1	200.00	200.00	\N	t	2026-06-06 15:38:49.720519	2026-06-06 15:38:45.373304
56	37	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:03:47.598646
57	37	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:03:47.598646
58	38	21	1	160.00	160.00	\N	f	\N	2026-06-08 13:03:47.863484
59	38	4	3	500.00	1500.00	\N	f	\N	2026-06-08 13:03:47.863484
60	39	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:06:38.709481
61	39	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:06:38.709481
62	40	21	1	160.00	160.00	\N	f	\N	2026-06-08 13:06:38.925762
63	40	4	3	500.00	1500.00	\N	f	\N	2026-06-08 13:06:38.925762
64	41	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:07:14.757535
65	41	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:07:14.757535
66	42	21	1	160.00	160.00	\N	f	\N	2026-06-08 13:07:14.796106
67	42	4	3	500.00	1500.00	\N	f	\N	2026-06-08 13:07:14.796106
101	60	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:41:15.025637
68	43	23	1	100.00	100.00	\N	f	\N	2026-06-08 13:07:27.566708
69	44	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:09:53.241517
70	44	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:09:53.241517
71	45	21	1	160.00	160.00	\N	f	\N	2026-06-08 13:09:53.547868
72	45	4	3	500.00	1500.00	\N	f	\N	2026-06-08 13:09:53.547868
102	60	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:41:15.025637
73	46	21	2	150.00	300.00	\N	t	2026-06-08 14:47:30.667912	2026-06-08 13:10:28.890487
74	46	4	1	400.00	400.00	\N	t	2026-06-08 14:47:30.667912	2026-06-08 13:10:28.890487
75	47	21	1	160.00	160.00	\N	t	2026-06-08 14:47:51.526734	2026-06-08 13:10:29.000779
76	47	4	3	500.00	1500.00	\N	t	2026-06-08 14:47:51.526734	2026-06-08 13:10:29.000779
103	61	21	1	160.00	160.00	\N	t	2026-06-08 14:47:58.559256	2026-06-08 13:41:15.068959
104	61	4	3	500.00	1500.00	\N	t	2026-06-08 14:47:58.559256	2026-06-08 13:41:15.068959
105	62	17	5	120.00	600.00	\N	f	\N	2026-06-08 15:13:59.136791
106	62	19	3	120.00	360.00	\N	f	\N	2026-06-08 15:13:59.136791
107	62	16	7	130.00	910.00	\N	f	\N	2026-06-08 15:13:59.136791
108	62	31	3	130.00	390.00	\N	f	\N	2026-06-08 15:13:59.136791
109	62	12	1	100.00	100.00	\N	f	\N	2026-06-08 15:13:59.136791
77	48	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:10:36.442539
78	48	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:10:36.442539
79	49	21	1	160.00	160.00	\N	f	\N	2026-06-08 13:10:36.572503
80	49	4	3	500.00	1500.00	\N	f	\N	2026-06-08 13:10:36.572503
81	50	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:24:47.955534
82	50	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:24:47.955534
83	51	21	1	160.00	160.00	\N	f	\N	2026-06-08 13:24:48.143087
84	51	4	3	500.00	1500.00	\N	f	\N	2026-06-08 13:24:48.143087
85	52	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:26:10.492666
86	52	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:26:10.492666
87	53	21	1	160.00	160.00	\N	f	\N	2026-06-08 13:26:10.541761
88	53	4	3	500.00	1500.00	\N	f	\N	2026-06-08 13:26:10.541761
89	54	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:27:26.347991
90	54	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:27:26.347991
91	55	21	1	160.00	160.00	\N	f	\N	2026-06-08 13:27:26.449609
92	55	4	3	500.00	1500.00	\N	f	\N	2026-06-08 13:27:26.449609
93	56	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:28:02.482422
94	56	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:28:02.482422
95	57	21	1	160.00	160.00	\N	f	\N	2026-06-08 13:28:02.606224
96	57	4	3	500.00	1500.00	\N	f	\N	2026-06-08 13:28:02.606224
97	58	21	2	150.00	300.00	\N	f	\N	2026-06-08 13:40:57.164321
98	58	4	1	400.00	400.00	\N	f	\N	2026-06-08 13:40:57.164321
99	59	21	1	160.00	160.00	\N	f	\N	2026-06-08 13:40:57.270248
100	59	4	3	500.00	1500.00	\N	f	\N	2026-06-08 13:40:57.270248
110	62	14	3	200.00	600.00	\N	f	\N	2026-06-08 15:13:59.136791
111	62	28	3	120.00	360.00	\N	f	\N	2026-06-08 15:13:59.136791
112	63	31	1	130.00	130.00	\N	f	\N	2026-06-08 18:43:05.862549
113	64	24	1	120.00	120.00	\N	f	\N	2026-06-08 18:44:23.432737
114	64	31	1	150.00	150.00	\N	f	\N	2026-06-08 18:44:23.432737
115	64	18	1	150.00	150.00	\N	f	\N	2026-06-08 18:44:23.432737
116	65	18	1	130.00	130.00	\N	f	\N	2026-06-08 18:44:59.527631
117	65	24	1	130.00	130.00	\N	f	\N	2026-06-08 18:44:59.527631
118	65	31	1	130.00	130.00	\N	f	\N	2026-06-08 18:44:59.527631
119	65	12	1	100.00	100.00	\N	f	\N	2026-06-08 18:44:59.527631
120	65	20	1	130.00	130.00	\N	f	\N	2026-06-08 18:44:59.527631
121	66	21	2	150.00	300.00	\N	f	\N	2026-06-09 10:23:11.417993
122	66	4	1	400.00	400.00	\N	f	\N	2026-06-09 10:23:11.417993
123	67	21	1	160.00	160.00	\N	f	\N	2026-06-09 10:23:11.518831
124	67	4	3	500.00	1500.00	\N	f	\N	2026-06-09 10:23:11.518831
125	68	21	2	150.00	300.00	\N	f	\N	2026-06-09 10:45:20.219293
126	68	4	1	400.00	400.00	\N	f	\N	2026-06-09 10:45:20.219293
127	69	21	1	160.00	160.00	\N	f	\N	2026-06-09 10:45:20.311673
128	69	4	3	500.00	1500.00	\N	f	\N	2026-06-09 10:45:20.311673
129	70	21	2	150.00	300.00	\N	f	\N	2026-06-09 10:46:01.588449
130	70	4	1	400.00	400.00	\N	f	\N	2026-06-09 10:46:01.588449
131	71	21	1	160.00	160.00	\N	f	\N	2026-06-09 10:46:01.704537
132	71	4	3	500.00	1500.00	\N	f	\N	2026-06-09 10:46:01.704537
133	72	21	2	150.00	300.00	\N	f	\N	2026-06-09 10:48:00.91789
134	72	4	1	400.00	400.00	\N	f	\N	2026-06-09 10:48:00.91789
135	73	21	1	160.00	160.00	\N	f	\N	2026-06-09 10:48:00.947765
136	73	4	3	500.00	1500.00	\N	f	\N	2026-06-09 10:48:00.947765
137	74	21	2	150.00	300.00	\N	f	\N	2026-06-09 10:48:13.735402
138	74	4	1	400.00	400.00	\N	f	\N	2026-06-09 10:48:13.735402
139	75	21	1	160.00	160.00	\N	f	\N	2026-06-09 10:48:13.770716
140	75	4	3	500.00	1500.00	\N	f	\N	2026-06-09 10:48:13.770716
141	76	21	2	150.00	300.00	\N	f	\N	2026-06-09 10:48:23.696009
142	76	4	1	400.00	400.00	\N	f	\N	2026-06-09 10:48:23.696009
143	77	21	1	160.00	160.00	\N	f	\N	2026-06-09 10:48:23.726274
144	77	4	3	500.00	1500.00	\N	f	\N	2026-06-09 10:48:23.726274
145	78	21	2	150.00	300.00	\N	f	\N	2026-06-09 10:48:34.989605
146	78	4	1	400.00	400.00	\N	f	\N	2026-06-09 10:48:34.989605
147	79	21	1	160.00	160.00	\N	f	\N	2026-06-09 10:48:35.025476
148	79	4	3	500.00	1500.00	\N	f	\N	2026-06-09 10:48:35.025476
150	80	22	1	130.00	130.00	\N	t	2026-06-09 11:50:06.832324	2026-06-09 11:50:01.603894
149	80	24	1	130.00	130.00	\N	t	2026-06-09 11:50:05.701004	2026-06-09 11:50:01.603894
151	80	20	1	130.00	130.00	\N	t	2026-06-09 11:50:07.890536	2026-06-09 11:50:01.603894
152	81	21	2	150.00	300.00	\N	f	\N	2026-06-09 11:50:49.588227
153	81	4	1	400.00	400.00	\N	f	\N	2026-06-09 11:50:49.588227
154	82	21	1	160.00	160.00	\N	f	\N	2026-06-09 11:50:49.619942
155	82	4	3	500.00	1500.00	\N	f	\N	2026-06-09 11:50:49.619942
156	83	21	2	150.00	300.00	\N	f	\N	2026-06-09 11:51:08.947972
157	83	4	1	400.00	400.00	\N	f	\N	2026-06-09 11:51:08.947972
158	84	21	1	160.00	160.00	\N	f	\N	2026-06-09 11:51:08.981249
159	84	4	3	500.00	1500.00	\N	f	\N	2026-06-09 11:51:08.981249
160	85	21	2	150.00	300.00	\N	f	\N	2026-06-09 11:51:49.848038
161	85	4	1	400.00	400.00	\N	f	\N	2026-06-09 11:51:49.848038
162	86	21	1	160.00	160.00	\N	f	\N	2026-06-09 11:51:49.871461
163	86	4	3	500.00	1500.00	\N	f	\N	2026-06-09 11:51:49.871461
168	88	21	2	150.00	300.00	\N	f	\N	2026-06-09 12:36:13.434465
169	88	4	1	400.00	400.00	\N	f	\N	2026-06-09 12:36:13.434465
170	89	21	1	160.00	160.00	\N	t	2026-06-09 12:36:25.700877	2026-06-09 12:36:13.537595
171	89	4	3	500.00	1500.00	\N	t	2026-06-09 12:36:25.700877	2026-06-09 12:36:13.537595
176	92	21	2	150.00	300.00	\N	f	\N	2026-06-09 12:36:44.192566
177	92	4	1	400.00	400.00	\N	f	\N	2026-06-09 12:36:44.192566
178	93	21	1	160.00	160.00	\N	f	\N	2026-06-09 12:36:44.221164
179	93	4	3	500.00	1500.00	\N	f	\N	2026-06-09 12:36:44.221164
180	94	21	2	150.00	300.00	\N	f	\N	2026-06-09 12:36:50.098688
181	94	4	1	400.00	400.00	\N	f	\N	2026-06-09 12:36:50.098688
182	95	21	1	160.00	160.00	\N	f	\N	2026-06-09 12:36:50.125862
183	95	4	3	500.00	1500.00	\N	f	\N	2026-06-09 12:36:50.125862
172	90	21	2	150.00	300.00	\N	t	2026-06-09 12:36:56.333887	2026-06-09 12:36:33.800845
173	90	4	1	400.00	400.00	\N	t	2026-06-09 12:36:56.333887	2026-06-09 12:36:33.800845
184	96	13	2	130.00	260.00	\N	t	2026-06-09 14:21:57.624378	2026-06-09 14:21:49.284533
185	97	20	1	150.00	150.00	\N	f	\N	2026-06-09 14:26:16.957854
186	97	22	1	140.00	140.00	\N	f	\N	2026-06-09 14:26:16.957854
187	97	23	1	200.00	200.00	\N	f	\N	2026-06-09 14:26:16.957854
164	87	12	1	100.00	100.00	\N	t	2026-06-09 14:26:30.045968	2026-06-09 11:54:24.898191
165	87	14	1	200.00	200.00	\N	t	2026-06-09 14:26:30.045968	2026-06-09 11:54:24.898191
166	87	25	1	120.00	120.00	\N	t	2026-06-09 14:26:30.045968	2026-06-09 11:54:24.898191
167	87	15	1	120.00	120.00	\N	t	2026-06-09 14:26:30.045968	2026-06-09 11:54:24.898191
188	98	21	2	150.00	300.00	\N	f	\N	2026-06-09 14:28:05.805831
189	98	4	1	400.00	400.00	\N	f	\N	2026-06-09 14:28:05.805831
190	99	21	1	160.00	160.00	\N	t	2026-06-09 14:29:40.35923	2026-06-09 14:28:05.845337
191	99	4	3	500.00	1500.00	\N	t	2026-06-09 14:29:40.35923	2026-06-09 14:28:05.845337
192	100	24	5	120.00	600.00	\N	t	2026-06-09 14:31:11.884834	2026-06-09 14:31:06.413235
193	100	20	3	150.00	450.00	\N	t	2026-06-09 14:31:11.884834	2026-06-09 14:31:06.413235
194	101	23	1	100.00	100.00	\N	f	\N	2026-06-09 14:38:19.946105
195	101	24	1	130.00	130.00	\N	f	\N	2026-06-09 14:38:19.946105
196	102	25	1	120.00	120.00	\N	f	\N	2026-06-09 16:24:24.929723
174	91	21	1	160.00	160.00	\N	t	2026-06-09 16:26:01.616214	2026-06-09 12:36:33.826769
175	91	4	3	500.00	1500.00	\N	t	2026-06-09 16:26:03.641734	2026-06-09 12:36:33.826769
197	103	28	1	120.00	120.00	\N	t	2026-06-09 16:26:21.580298	2026-06-09 16:25:07.660479
\.


--
-- TOC entry 5382 (class 0 OID 17658)
-- Dependencies: 240
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, uuid, order_number, outlet_id, order_type, table_number, customer_name, customer_phone, customer_email, delivery_address, special_instructions, subtotal, discount_type, discount_value, discount_amount, packing_charge, delivery_charge, service_charge, gst_amount, total_amount, payment_method, payment_status, order_status, platform_order_id, order_time, delivery_time, payment_time, created_by, kot_sent, kot_sent_time, completed_time) FROM stdin;
51	caac117c-c402-483a-bd89-283c0fe5c14d	ORD-10-20260608-0014	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780905288135	2026-06-08 13:24:48.143087	\N	\N	\N	f	\N	2026-06-08 13:24:48.143087
33	a809e042-fbbf-4e20-a22f-de24f4109650	ORD-10-20260606-0001	10	dine	\N	\N	\N	\N	\N	\N	800.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	800.00	online	paid	completed	\N	2026-06-06 15:25:11.897691	\N	2026-06-06 15:25:11.897691	\N	t	2026-06-06 15:25:11.897691	2026-06-06 15:25:50.52819
35	935e944f-c722-437b-ba7c-9d558c3d7504	ORD-10-20260606-0003	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	completed	ZOM-1780739935449	2026-06-06 15:28:55.453724	\N	\N	\N	f	\N	2026-06-06 15:29:12.316492
34	da2fdd30-6467-4314-a31c-c736fcc2f1db	ORD-10-20260606-0002	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	1200.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	1195.00	online	paid	completed	SW-1780739935280	2026-06-06 15:28:55.348525	\N	\N	\N	f	\N	2026-06-06 15:30:10.479729
52	6922051a-54b6-467f-9c97-814ca334e749	ORD-10-20260608-0015	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780905370427	2026-06-08 13:26:10.492666	\N	\N	\N	f	\N	2026-06-08 13:26:10.492666
36	4a648e55-88db-450f-bb40-610b10e1c0ed	ORD-10-20260606-0004	10	dine	\N	\N	\N	\N	\N	\N	300.00	fixed	0.00	0.00	0.00	0.00	0.00	0.00	300.00	cash	paid	completed	\N	2026-06-06 15:38:45.373304	\N	2026-06-06 15:38:45.373304	\N	t	2026-06-06 15:38:45.373304	2026-06-06 15:38:50.961551
37	71bda1be-baed-426e-aca3-10f6463c25a5	ORD-10-20260608-0001	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780904027485	2026-06-08 13:03:47.598646	\N	\N	\N	f	\N	2026-06-08 13:03:47.598646
38	2285b434-fb00-4b47-b57c-c65e596bbe04	ORD-10-20260608-0002	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780904027858	2026-06-08 13:03:47.863484	\N	\N	\N	f	\N	2026-06-08 13:03:47.863484
39	96d31d59-839e-4b4d-92d4-e83b996ebb59	ORD-10-20260608-0003	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780904198612	2026-06-08 13:06:38.709481	\N	\N	\N	f	\N	2026-06-08 13:06:38.709481
40	f18f158c-a233-48ee-af87-56937b704337	ORD-10-20260608-0004	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780904198922	2026-06-08 13:06:38.925762	\N	\N	\N	f	\N	2026-06-08 13:06:38.925762
41	95c2fa08-9310-4fee-a6e8-6ad15b5015d0	ORD-10-20260608-0005	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780904234745	2026-06-08 13:07:14.757535	\N	\N	\N	f	\N	2026-06-08 13:07:14.757535
42	c62aec1b-4530-425a-983e-a2e260f4b5d2	ORD-10-20260608-0006	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780904234793	2026-06-08 13:07:14.796106	\N	\N	\N	f	\N	2026-06-08 13:07:14.796106
43	ec80dc3d-513d-42e1-9b40-57f558f4b2c6	ORD-13-20260608-0001	13	dine	\N	\N	\N	\N	\N	\N	100.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	100.00	online	paid	preparing	\N	2026-06-08 13:07:27.566708	\N	2026-06-08 13:07:27.566708	\N	t	2026-06-08 13:07:27.566708	\N
44	13492eb4-0ba8-4c69-8060-f8d2e473c0b1	ORD-10-20260608-0007	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780904393218	2026-06-08 13:09:53.241517	\N	\N	\N	f	\N	2026-06-08 13:09:53.241517
45	e9090572-c302-49a1-aa51-5ecbacc7535d	ORD-10-20260608-0008	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780904393544	2026-06-08 13:09:53.547868	\N	\N	\N	f	\N	2026-06-08 13:09:53.547868
48	602c9059-6b04-4fa1-8fab-fbf52935b6e7	ORD-10-20260608-0011	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780904436431	2026-06-08 13:10:36.442539	\N	\N	\N	f	\N	2026-06-08 13:10:36.442539
49	cb43785e-c6ee-4845-920e-ed8a6dee53a8	ORD-10-20260608-0012	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780904436569	2026-06-08 13:10:36.572503	\N	\N	\N	f	\N	2026-06-08 13:10:36.572503
50	097e2091-8f44-4916-aebf-69a0373e2071	ORD-10-20260608-0013	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780905287882	2026-06-08 13:24:47.955534	\N	\N	\N	f	\N	2026-06-08 13:24:47.955534
53	b1285221-364a-460d-8c59-bc355c31b7d7	ORD-10-20260608-0016	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780905370538	2026-06-08 13:26:10.541761	\N	\N	\N	f	\N	2026-06-08 13:26:10.541761
54	61e01be4-8046-4990-bff7-892b166e1bfd	ORD-10-20260608-0017	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780905446234	2026-06-08 13:27:26.347991	\N	\N	\N	f	\N	2026-06-08 13:27:26.347991
55	c948c66d-5d83-4028-93c9-35acc22ad159	ORD-10-20260608-0018	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780905446442	2026-06-08 13:27:26.449609	\N	\N	\N	f	\N	2026-06-08 13:27:26.449609
56	1d1e6fee-b2f0-47f3-92cd-96e7599530c6	ORD-10-20260608-0019	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780905482271	2026-06-08 13:28:02.482422	\N	\N	\N	f	\N	2026-06-08 13:28:02.482422
57	43d573b9-909c-4f58-bc8b-501603f59224	ORD-10-20260608-0020	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780905482599	2026-06-08 13:28:02.606224	\N	\N	\N	f	\N	2026-06-08 13:28:02.606224
58	647f35a7-bcc5-4acb-ade0-e4cc281e4cd4	ORD-10-20260608-0021	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780906257126	2026-06-08 13:40:57.164321	\N	\N	\N	f	\N	2026-06-08 13:40:57.164321
59	20b26ee4-3981-4cb5-834a-0e80430a5602	ORD-10-20260608-0022	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780906257265	2026-06-08 13:40:57.270248	\N	\N	\N	f	\N	2026-06-08 13:40:57.270248
60	8fb6bc1b-5d70-426f-a7d7-1f90e5f2a040	ORD-10-20260608-0023	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780906274991	2026-06-08 13:41:15.025637	\N	\N	\N	f	\N	2026-06-08 13:41:15.025637
46	237eccf6-b40d-4002-9f52-fec3fccd8b67	ORD-10-20260608-0009	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	completed	SW-1780904428874	2026-06-08 13:10:28.890487	\N	\N	\N	f	\N	2026-06-08 14:47:32.102486
47	204d54da-98fa-400a-bf4b-6bb6ee359e5e	ORD-10-20260608-0010	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	completed	ZOM-1780904428997	2026-06-08 13:10:29.000779	\N	\N	\N	f	\N	2026-06-08 14:47:52.666914
61	f8aae55c-83f3-4319-b363-81674bc82f84	ORD-10-20260608-0024	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	completed	ZOM-1780906275063	2026-06-08 13:41:15.068959	\N	\N	\N	f	\N	2026-06-08 14:48:06.938163
62	eb24d8ae-8662-4ba7-9b6e-a1bf8ab1ce4d	ORD-13-20260608-0002	13	dine	\N	\N	\N	\N	\N	\N	3320.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	3320.00	online	paid	preparing	\N	2026-06-08 15:13:59.136791	\N	2026-06-08 15:13:59.136791	\N	t	2026-06-08 15:13:59.136791	\N
63	505c9e29-68ae-4548-b214-456bde0fa30b	ORD-13-20260608-0003	13	dine	\N	\N	\N	\N	\N	\N	130.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	130.00	online	paid	preparing	\N	2026-06-08 18:43:05.862549	\N	2026-06-08 18:43:05.862549	\N	t	2026-06-08 18:43:05.862549	\N
64	35757c9a-04cf-4252-b2cb-3e0f7c5ed92c	ORD-13-20260608-0004	13	parcel	\N	\N	\N	\N	\N	\N	420.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	420.00	cash	paid	preparing	\N	2026-06-08 18:44:23.432737	\N	2026-06-08 18:44:23.432737	\N	t	2026-06-08 18:44:23.432737	\N
65	00394b54-36d1-4dfd-bedb-ad7a7bcbe2f7	ORD-13-20260608-0005	13	dine	\N	\N	\N	\N	\N	\N	620.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	620.00	online	paid	preparing	\N	2026-06-08 18:44:59.527631	\N	2026-06-08 18:44:59.527631	\N	t	2026-06-08 18:44:59.527631	\N
66	9d0107f6-a03e-402e-a962-caab82e99581	ORD-10-20260609-0001	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780980791228	2026-06-09 10:23:11.417993	\N	\N	\N	f	\N	2026-06-09 10:23:11.417993
67	62d36be3-311b-4913-a268-aea8192bbdfe	ORD-10-20260609-0002	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780980791515	2026-06-09 10:23:11.518831	\N	\N	\N	f	\N	2026-06-09 10:23:11.518831
68	fcad53d3-0218-47e8-8212-6b6a46e88bd8	ORD-10-20260609-0003	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780982120204	2026-06-09 10:45:20.219293	\N	\N	\N	f	\N	2026-06-09 10:45:20.219293
69	a1c25132-88e0-4389-92c3-7459a9e7949d	ORD-10-20260609-0004	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780982120308	2026-06-09 10:45:20.311673	\N	\N	\N	f	\N	2026-06-09 10:45:20.311673
70	064200b8-ee5b-4ab4-90ef-64e89063d4d6	ORD-10-20260609-0005	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780982161448	2026-06-09 10:46:01.588449	\N	\N	\N	f	\N	2026-06-09 10:46:01.588449
71	461f936d-2c13-4de1-b5f8-4e7f21ce21b8	ORD-10-20260609-0006	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780982161696	2026-06-09 10:46:01.704537	\N	\N	\N	f	\N	2026-06-09 10:46:01.704537
72	9e54f289-fc23-40d7-af3d-b5d3d589131a	ORD-10-20260609-0007	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780982280910	2026-06-09 10:48:00.91789	\N	\N	\N	f	\N	2026-06-09 10:48:00.91789
73	d4a60cc5-1a9b-4ed2-b897-ba0ac1e67b5c	ORD-10-20260609-0008	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780982280945	2026-06-09 10:48:00.947765	\N	\N	\N	f	\N	2026-06-09 10:48:00.947765
74	f02f9b3d-954e-49ce-81c9-ef35040db48f	ORD-10-20260609-0009	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780982293727	2026-06-09 10:48:13.735402	\N	\N	\N	f	\N	2026-06-09 10:48:13.735402
75	48207c2b-1952-41da-bfb8-f6d3c94a3308	ORD-10-20260609-0010	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780982293766	2026-06-09 10:48:13.770716	\N	\N	\N	f	\N	2026-06-09 10:48:13.770716
76	7e72826c-6cfe-4031-a69e-9804be8d9c02	ORD-10-20260609-0011	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780982303684	2026-06-09 10:48:23.696009	\N	\N	\N	f	\N	2026-06-09 10:48:23.696009
77	a8471832-f25b-4ce1-8f1b-1df809319f38	ORD-10-20260609-0012	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780982303722	2026-06-09 10:48:23.726274	\N	\N	\N	f	\N	2026-06-09 10:48:23.726274
78	cb588515-ca87-46bb-b989-4f18a03c12e3	ORD-10-20260609-0013	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780982314925	2026-06-09 10:48:34.989605	\N	\N	\N	f	\N	2026-06-09 10:48:34.989605
79	ef730715-7774-4eb0-95c1-99ada5fc32d4	ORD-10-20260609-0014	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780982315021	2026-06-09 10:48:35.025476	\N	\N	\N	f	\N	2026-06-09 10:48:35.025476
80	7efc8aa8-c1f8-43b8-821e-ecd64c611391	ORD-10-20260609-0015	10	dine	\N	\N	\N	\N	\N	\N	390.00	fixed	50.00	50.00	0.00	0.00	0.00	0.00	340.00	cash	paid	completed	\N	2026-06-09 11:50:01.603894	\N	2026-06-09 11:50:01.603894	\N	t	2026-06-09 11:50:01.603894	2026-06-09 11:50:08.942095
81	bb27a42f-10c4-45c6-a07b-8b2d41cc262d	ORD-10-20260609-0016	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780986049408	2026-06-09 11:50:49.588227	\N	\N	\N	f	\N	2026-06-09 11:50:49.588227
82	4b986b1f-e4c2-4a94-9ff0-b25521907bbb	ORD-10-20260609-0017	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780986049618	2026-06-09 11:50:49.619942	\N	\N	\N	f	\N	2026-06-09 11:50:49.619942
83	2dfc7c0c-1784-4df7-88c0-04ec02053ed0	ORD-10-20260609-0018	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780986068938	2026-06-09 11:51:08.947972	\N	\N	\N	f	\N	2026-06-09 11:51:08.947972
84	dba68db6-e1e3-4114-8995-bdf4794047cf	ORD-10-20260609-0019	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780986068978	2026-06-09 11:51:08.981249	\N	\N	\N	f	\N	2026-06-09 11:51:08.981249
85	9e0ad4a4-7e4d-4667-a7cf-cb02c941d59c	ORD-10-20260609-0020	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780986109838	2026-06-09 11:51:49.848038	\N	\N	\N	f	\N	2026-06-09 11:51:49.848038
86	cfcfc76b-406f-44cd-b656-43f29a152f97	ORD-10-20260609-0021	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780986109869	2026-06-09 11:51:49.871461	\N	\N	\N	f	\N	2026-06-09 11:51:49.871461
88	1350b106-c3d2-48c5-9295-2ac3e830d6a9	ORD-10-20260609-0023	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780988773382	2026-06-09 12:36:13.434465	\N	\N	\N	f	\N	2026-06-09 12:36:13.434465
89	094444bc-b6df-414e-8ba4-50e439339929	ORD-10-20260609-0024	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	completed	ZOM-1780988773532	2026-06-09 12:36:13.537595	\N	\N	\N	f	\N	2026-06-09 12:36:29.417467
92	2c4d7486-a450-427d-b8de-d8509d2720c6	ORD-10-20260609-0027	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780988804182	2026-06-09 12:36:44.192566	\N	\N	\N	f	\N	2026-06-09 12:36:44.192566
93	e221028c-0399-4265-9699-43d71d414e17	ORD-10-20260609-0028	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780988804218	2026-06-09 12:36:44.221164	\N	\N	\N	f	\N	2026-06-09 12:36:44.221164
94	0a629fff-3a56-410b-9a84-dc24e16dc7ec	ORD-10-20260609-0029	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780988810088	2026-06-09 12:36:50.098688	\N	\N	\N	f	\N	2026-06-09 12:36:50.098688
95	9a9acb81-66f7-4a3a-a9e0-f45a9c1527ed	ORD-10-20260609-0030	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	pending	ZOM-1780988810123	2026-06-09 12:36:50.125862	\N	\N	\N	f	\N	2026-06-09 12:36:50.125862
90	7c466c9e-d722-4542-b611-ce3d528ca56d	ORD-10-20260609-0025	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	completed	SW-1780988793791	2026-06-09 12:36:33.800845	\N	\N	\N	f	\N	2026-06-09 12:37:07.161777
96	6ff0310a-d09d-4fb6-bd40-6c3dfdb9f970	ORD-10-20260609-0031	10	dine	\N	\N	\N	\N	\N	\N	260.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	260.00	cash	paid	ready	\N	2026-06-09 14:21:49.284533	\N	2026-06-09 14:21:49.284533	\N	t	2026-06-09 14:21:49.284533	\N
97	50e4d9f8-7391-4cb7-a302-da05e26121c5	ORD-10-20260609-0032	10	parcel	\N	\N	\N	\N	\N	\N	490.00	percentage	5.00	24.50	0.00	0.00	0.00	0.00	465.50	online	paid	preparing	\N	2026-06-09 14:26:16.957854	\N	2026-06-09 14:26:16.957854	\N	t	2026-06-09 14:26:16.957854	\N
87	0c834d93-e2d5-4465-80a7-fc50f61d56e0	ORD-10-20260609-0022	10	dine	\N	\N	\N	\N	\N	\N	540.00	fixed	0.00	0.00	0.00	0.00	0.00	0.00	540.00	cash	paid	ready	\N	2026-06-09 11:54:24.898191	\N	2026-06-09 11:54:24.898191	\N	t	2026-06-09 11:54:24.898191	\N
98	9623acbe-8cbe-4bde-94db-b63ef7750432	ORD-10-20260609-0033	10	swiggy	\N	Test Swiggy Customer	9876543210	swiggy@test.com	123 Swiggy Lane, Foodville	\N	700.00	percentage	0.00	20.00	0.00	0.00	0.00	15.00	695.00	online	paid	pending	SW-1780995485794	2026-06-09 14:28:05.805831	\N	\N	\N	f	\N	2026-06-09 14:28:05.805831
91	ef26d5bd-e8c2-49d2-b09e-aba2a9958de5	ORD-10-20260609-0026	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	ready	ZOM-1780988793823	2026-06-09 12:36:33.826769	\N	\N	\N	f	\N	2026-06-09 12:36:33.826769
99	719dc46c-ad3b-4057-a4f3-4758c40afc66	ORD-10-20260609-0034	10	zomato	\N	Test Zomato Customer	9123456789	\N	456 Zomato Street, FoodCity	\N	10.00	percentage	0.00	10.00	0.00	0.00	0.00	8.00	8.00	online	paid	completed	ZOM-1780995485842	2026-06-09 14:28:05.845337	\N	\N	\N	f	\N	2026-06-09 14:29:55.68212
100	8f6a761e-4310-498f-9b88-a69f3ba9ba8a	ORD-10-20260609-0035	10	parcel	\N	\N	\N	\N	\N	\N	1050.00	percentage	0.00	0.00	0.00	0.00	0.00	0.00	1050.00	online	paid	ready	\N	2026-06-09 14:31:06.413235	\N	2026-06-09 14:31:06.413235	\N	t	2026-06-09 14:31:06.413235	\N
101	2cbcf4d3-4434-4113-8c9c-0ffa2f2b49f7	ORD-10-20260609-0036	10	dine	\N	\N	\N	\N	\N	\N	230.00	fixed	0.00	0.00	0.00	0.00	0.00	0.00	230.00	cash	paid	preparing	\N	2026-06-09 14:38:19.946105	\N	2026-06-09 14:38:19.946105	\N	t	2026-06-09 14:38:19.946105	\N
102	3391eac2-87d3-4740-a1d6-17e48bbd9fb5	ORD-10-20260609-0037	10	dine	\N	\N	\N	\N	\N	\N	120.00	fixed	0.00	0.00	0.00	0.00	0.00	0.00	120.00	cash	paid	preparing	\N	2026-06-09 16:24:24.929723	\N	2026-06-09 16:24:24.929723	\N	t	2026-06-09 16:24:24.929723	\N
103	709566be-dbf9-45b2-b37d-cbba74e18df5	ORD-10-20260609-0038	10	dine	\N	\N	\N	\N	\N	\N	120.00	fixed	0.00	0.00	0.00	0.00	0.00	0.00	120.00	cash	paid	ready	\N	2026-06-09 16:25:07.660479	\N	2026-06-09 16:25:07.660479	\N	t	2026-06-09 16:25:07.660479	\N
\.


--
-- TOC entry 5367 (class 0 OID 17427)
-- Dependencies: 225
-- Data for Name: outlet_creation_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.outlet_creation_log (id, outlet_id, created_by, creation_date, ip_address, user_agent, notes) FROM stdin;
\.


--
-- TOC entry 5404 (class 0 OID 18260)
-- Dependencies: 265
-- Data for Name: outlet_integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.outlet_integrations (id, outlet_id, access_token, swiggy_id, zomato_id) FROM stdin;
2	10	788f83dbaa7d4c91b2435b0fc84034d5	1234	2345
3	11	788f83dbaa7d4c91b2435b0fc84034d5	1234	2345
4	12	788f83dbaa7d4c91b2435b0fc84034d5	1234	2345
5	13	788f83dbaa7d4c91b2435b0fc84034d5	1234	2345
\.


--
-- TOC entry 5365 (class 0 OID 17398)
-- Dependencies: 223
-- Data for Name: outlets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.outlets (id, uuid, name, address, phone, manager, email, username, password_hash, status, created_by, created_at, updated_at, image_url) FROM stdin;
10	a1d86c61-a290-43a2-8010-5971dd5c8abb	pune deccan	deccan gymkhana	8237278995	Shakya	shakya@gmail.com	shakya	$2b$10$qjAn3KzJZjnDv7cYnZ8K0eotHjmGN8I9qQMFyC6AZs7/pq12rmyaW	active	\N	2026-06-06 12:50:49.331003	2026-06-06 12:50:49.331003	\N
11	b15ee933-5904-4bbc-bc8c-2b945ef9a646	shrigonda	shrigonda, ahilyanagar	8237278996	adita	adita@gmail.com	Adita	$2b$10$J8KIUQrlvF5c1ZeljSP0U.vYUOBaefdXGF3DwbaB1jIwuQn6iY4Ni	active	\N	2026-06-06 12:55:23.265137	2026-06-06 12:55:23.265137	\N
12	58c46a00-9804-4294-9e40-c37fe6411e4d	Kharghar	kharghar navi mumbai	9820638026	avanit	avanit@gmail.com	avanit	$2b$10$5DLoAlAFHGoI8jllCifczO8p1XL96DfAHAayWTfIaNRa5VPaYAR/2	active	\N	2026-06-06 13:05:58.743051	2026-06-06 13:05:58.743051	\N
13	9c25306e-9e27-4d16-8a2b-ab16c86382ac	Seawood	Seawood navi mumbai	9372475762	tabish	tabish@gmial.com	tabish	$2b$10$6ndPWxQCwzQyE6M78MTotua0BVjqTBD4BZjiKrWk18XA.gF5I8Q9O	active	\N	2026-06-06 14:28:47.860841	2026-06-06 14:28:47.860841	\N
\.


--
-- TOC entry 5375 (class 0 OID 17566)
-- Dependencies: 233
-- Data for Name: platform_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_availability (dish_id, platform, is_available, platform_price) FROM stdin;
\.


--
-- TOC entry 5390 (class 0 OID 17838)
-- Dependencies: 248
-- Data for Name: sales_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_summary (id, outlet_id, summary_date, total_revenue, total_orders, total_items_sold, offline_revenue, online_revenue, cash_revenue, digital_revenue, avg_order_value, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5396 (class 0 OID 17922)
-- Dependencies: 254
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, outlet_id, token, login_time, logout_time, ip_address, user_agent) FROM stdin;
37	15	11	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMSwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwNzMwODE3LCJleHAiOjE3ODEzMzU2MTd9.LE1w66dq0I0xFctm2TVxBM8Cs_eliXgd1qkxiz4dP4s	2026-06-06 12:56:57.927047	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
38	17	13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMywiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwNzM3MzE3LCJleHAiOjE3ODEzNDIxMTd9.W6-FcknKLjGBlo1_enYYoQv1fGwqGyCmFEf59JFyGO0	2026-06-06 14:45:17.734769	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
39	17	13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMywiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwNzM3ODA3LCJleHAiOjE3ODEzNDI2MDd9.ARM8aF9-ZYeMuf-agspJWfS6B2htkTyrOBw4HupZztk	2026-06-06 14:53:27.401698	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
40	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwNzM5NTY4LCJleHAiOjE3ODEzNDQzNjh9.Dptplt5A_7mLzhX0uOqkv7LNZ1gUuun4z5mh-t8__eI	2026-06-06 15:22:48.129197	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
41	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwNzQwNDk5LCJleHAiOjE3ODEzNDUyOTl9.Ifz93C62kLp6qw181LRil_huHHYgdaWtogepPJgqNBY	2026-06-06 15:38:19.451267	\N	::ffff:192.168.1.10	okhttp/4.12.0
42	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwNzQ1MzY5LCJleHAiOjE3ODEzNTAxNjl9.2wBG0jYkXOJ1QKkqMA59otraNCIlBO6jZwDzyfDkwho	2026-06-06 16:59:29.380167	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
43	17	13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMywiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTAzNTQ0LCJleHAiOjE3ODE1MDgzNDR9.jJA3aRxMazS34V3NBBYRvyeN14uRinu0rKL0km1wnJs	2026-06-08 12:55:44.613799	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) hotel-management/0.1.0 Chrome/148.0.7778.218 Electron/42.3.3 Safari/537.36
44	17	13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMywiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTAzOTc2LCJleHAiOjE3ODE1MDg3NzZ9.sWAf2ySrv0oioEpyNfZBNrEDS3rDw23bOkCCf0qmp-8	2026-06-08 13:02:57.026925	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
45	17	13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMywiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTExNjkyLCJleHAiOjE3ODE1MTY0OTJ9.yC2RXExVc0xT303Wfc4DdkJsiPCrsbKgJGLplKdHNsE	2026-06-08 15:11:32.541463	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
46	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTgyMjcyLCJleHAiOjE3ODE1ODcwNzJ9.D355y3Bot85CZlTNo3LSEfj4cTsDpUYHEUxKT6R1vOQ	2026-06-09 10:47:52.801495	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
48	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTg2MDYwLCJleHAiOjE3ODE1OTA4NjB9.vdKDWoelfTuPKzoC15MJbG3BL1JchCK-LbFzzj3v6Lo	2026-06-09 11:51:00.591552	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
47	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTg1OTMzLCJleHAiOjE3ODE1OTA3MzN9.xXf96PyZyw9Nau5_24GxqYZAodjgfpOzkH-e_gmFbrI	2026-06-09 11:48:53.559913	2026-06-09 11:52:08.83544	::ffff:192.168.1.22	okhttp/4.12.0
49	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTg2MjExLCJleHAiOjE3ODE1OTEwMTF9.k5E9Jv9ysyq_DcXi-sXBXAiQMmFYS5Huq1zda95RkX0	2026-06-09 11:53:31.409292	2026-06-09 12:42:49.936991	::ffff:192.168.1.22	okhttp/4.12.0
50	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTg5MzgzLCJleHAiOjE3ODE1OTQxODN9.ynkKak15UVn-OLUnC8TYBByqjcMTgWsZBuqju5pG1Vs	2026-06-09 12:46:23.797397	\N	::ffff:192.168.1.22	okhttp/4.12.0
51	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTg5NDkzLCJleHAiOjE3ODE1OTQyOTN9.CjhFO0GMHTJYYG4ODVtjAJNZAOsXJXdD5VuCl5-xTAk	2026-06-09 12:48:13.597071	\N	::ffff:192.168.1.22	okhttp/4.12.0
52	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTg5NTQxLCJleHAiOjE3ODE1OTQzNDF9.a05Jwkkqjxug8FpINvvbo-6rZkAdifLynRLaqP1HcT0	2026-06-09 12:49:01.593893	\N	::ffff:192.168.1.22	okhttp/4.12.0
53	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTg5NjE0LCJleHAiOjE3ODE1OTQ0MTR9.m3pTbTgAMVb59OzKs0Q3xNlXsskxvpoEpoBhXSfPbvM	2026-06-09 12:50:14.030657	\N	::ffff:192.168.1.22	okhttp/4.12.0
54	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTk0ODYzLCJleHAiOjE3ODE1OTk2NjN9.1rWLfVyqlTrMFnTGmQhmQG4YC4mLYKaB_SuP6m3byyY	2026-06-09 14:17:43.011172	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
55	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTk2MDI3LCJleHAiOjE3ODE2MDA4Mjd9.Pihonb2ndISswFVQN93HqHqI1feXU_yDj83WAWKrTRM	2026-06-09 14:37:07.584732	2026-06-09 14:40:40.652367	::ffff:192.168.1.22	okhttp/4.12.0
56	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTk2NTI0LCJleHAiOjE3ODE2MDEzMjR9.wSj5z5aNoUtBXW63JO2qiNqMgXgatIGE0DBxjz7mbYc	2026-06-09 14:45:24.29429	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36
57	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgwOTk2ODc5LCJleHAiOjE3ODE2MDE2Nzl9.RM6PBA_XqCSHiWLSUYjFYUxdfaVYrrR2fSw0Pb9KgEk	2026-06-09 14:51:19.099369	\N	::ffff:192.168.1.22	okhttp/4.12.0
58	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgxMDAxNDM1LCJleHAiOjE3ODE2MDYyMzV9.9Fb4rKy7xHlRCSvpvntjxfVgsqzJCDdFvqhdbDQidq4	2026-06-09 16:07:15.050587	2026-06-09 16:08:18.990779	::ffff:192.168.1.22	okhttp/4.12.0
59	13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInR5cGUiOiJ1c2VyIiwib3V0bGV0X2lkIjoxMCwiYXBwX3JvbGUiOiJBZG1pbiIsInJvbGVfbGFiZWwiOiJNYW5hZ2VyIiwiaWF0IjoxNzgxMDAyNDA4LCJleHAiOjE3ODE2MDcyMDh9.kk3ReERPCJXZzE9zO75n4H2ZW_Tb2L5VcoOe3m6AuQg	2026-06-09 16:23:28.484172	2026-06-09 16:32:02.866586	::ffff:192.168.1.22	okhttp/4.12.0
\.


--
-- TOC entry 5394 (class 0 OID 17893)
-- Dependencies: 252
-- Data for Name: tax_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_records (id, outlet_id, order_id, taxable_value, cgst_rate, cgst_amount, sgst_rate, sgst_amount, total_gst, tax_period, created_at) FROM stdin;
\.


--
-- TOC entry 5369 (class 0 OID 17450)
-- Dependencies: 227
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, uuid, outlet_id, name, email, username, password_hash, role_label, app_role, permissions, status, created_at, updated_at, created_by) FROM stdin;
16	c5daa658-be35-4854-8ba0-eace1c831347	12	avanit	avanit@gmail.com	avanit	$2b$10$5DLoAlAFHGoI8jllCifczO8p1XL96DfAHAayWTfIaNRa5VPaYAR/2	Manager	Admin	{"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}	active	2026-06-06 13:05:58.743051	2026-06-06 13:05:58.743051	\N
17	42a20a24-cb54-4462-88cd-e7492d8add20	13	tabish	tabish@gmial.com	tabish	$2b$10$6ndPWxQCwzQyE6M78MTotua0BVjqTBD4BZjiKrWk18XA.gF5I8Q9O	Manager	Admin	{"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}	active	2026-06-06 14:28:47.860841	2026-06-06 14:28:47.860841	\N
19	a540b423-cc6b-4212-a3d3-8a244a4be76e	10	ajit	ajit@gmail.com	ajit	$2b$10$Rub3M.vq5hWdIohqlxw2Ke7PKnNCa6oab1ZQ3UT5HuPT2enHJYaxm	Kitchen Staff	Staff	{"admin": [], "staff": ["kot"]}	active	2026-06-06 15:21:38.064185	2026-06-06 15:21:38.064185	\N
18	e3e94740-74ce-4981-9b77-e270b9c93f54	10	Default Staff	staff@guptasandwich.com	staff	$2b$10$LGySEJqvvCFU7BPXYvdzFOw10c20/ITfQ0cbAL7EfwjhwxxyBa8b6	Cashier	Staff	{"admin": [], "staff": ["pos", "live-orders"]}	active	2026-06-06 14:44:17.495619	2026-06-06 15:22:14.100043	\N
13	d9762d8c-4973-4c16-b3a6-ea676abda711	10	Shakya	shakya@gmail.com	shakya	$2b$10$b9OJ7IF4bQ/IyW6mUh4mJ.bifBBkuGGdKsEcyQcfv2kB2THAgttNW	Manager	Admin	{"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}	active	2026-06-06 12:50:49.331003	2026-06-09 10:47:46.41123	\N
15	eb86f71f-0baf-4073-b42e-d5104011ba89	11	adita	adita@gmail.com	Adita	$2b$10$J8KIUQrlvF5c1ZeljSP0U.vYUOBaefdXGF3DwbaB1jIwuQn6iY4Ni	Manager	Admin	{"admin": ["dashboard", "dishes", "reports", "accounting", "outlets"], "staff": []}	active	2026-06-06 12:55:23.265137	2026-06-06 12:55:23.265137	\N
\.


--
-- TOC entry 5431 (class 0 OID 0)
-- Dependencies: 263
-- Name: accounting_ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounting_ledger_id_seq', 23, true);


--
-- TOC entry 5432 (class 0 OID 0)
-- Dependencies: 255
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 204, true);


--
-- TOC entry 5433 (class 0 OID 0)
-- Dependencies: 220
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_id_seq', 3, true);


--
-- TOC entry 5434 (class 0 OID 0)
-- Dependencies: 228
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 13, true);


--
-- TOC entry 5435 (class 0 OID 0)
-- Dependencies: 230
-- Name: dishes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dishes_id_seq', 32, true);


--
-- TOC entry 5436 (class 0 OID 0)
-- Dependencies: 249
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- TOC entry 5437 (class 0 OID 0)
-- Dependencies: 234
-- Name: ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredients_id_seq', 1, false);


--
-- TOC entry 5438 (class 0 OID 0)
-- Dependencies: 237
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 1, false);


--
-- TOC entry 5439 (class 0 OID 0)
-- Dependencies: 243
-- Name: kot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kot_id_seq', 95, true);


--
-- TOC entry 5440 (class 0 OID 0)
-- Dependencies: 245
-- Name: kot_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kot_items_id_seq', 196, true);


--
-- TOC entry 5441 (class 0 OID 0)
-- Dependencies: 257
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 5442 (class 0 OID 0)
-- Dependencies: 241
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 197, true);


--
-- TOC entry 5443 (class 0 OID 0)
-- Dependencies: 239
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 103, true);


--
-- TOC entry 5444 (class 0 OID 0)
-- Dependencies: 224
-- Name: outlet_creation_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.outlet_creation_log_id_seq', 1, true);


--
-- TOC entry 5445 (class 0 OID 0)
-- Dependencies: 264
-- Name: outlet_integrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.outlet_integrations_id_seq', 5, true);


--
-- TOC entry 5446 (class 0 OID 0)
-- Dependencies: 222
-- Name: outlets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.outlets_id_seq', 13, true);


--
-- TOC entry 5447 (class 0 OID 0)
-- Dependencies: 247
-- Name: sales_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_summary_id_seq', 1, false);


--
-- TOC entry 5448 (class 0 OID 0)
-- Dependencies: 253
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 59, true);


--
-- TOC entry 5449 (class 0 OID 0)
-- Dependencies: 251
-- Name: tax_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tax_records_id_seq', 1, false);


--
-- TOC entry 5450 (class 0 OID 0)
-- Dependencies: 226
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 19, true);


--
-- TOC entry 5154 (class 2606 OID 18237)
-- Name: accounting_ledger accounting_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger
    ADD CONSTRAINT accounting_ledger_pkey PRIMARY KEY (id);


--
-- TOC entry 5156 (class 2606 OID 18239)
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
-- TOC entry 5055 (class 2606 OID 17394)
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- TOC entry 5057 (class 2606 OID 17390)
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- TOC entry 5059 (class 2606 OID 17396)
-- Name: admin admin_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_username_key UNIQUE (username);


--
-- TOC entry 5061 (class 2606 OID 17392)
-- Name: admin admin_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_uuid_key UNIQUE (uuid);


--
-- TOC entry 5077 (class 2606 OID 17502)
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- TOC entry 5079 (class 2606 OID 17498)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5081 (class 2606 OID 17500)
-- Name: categories categories_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_uuid_key UNIQUE (uuid);


--
-- TOC entry 5099 (class 2606 OID 17613)
-- Name: dish_ingredients dish_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_ingredients
    ADD CONSTRAINT dish_ingredients_pkey PRIMARY KEY (dish_id, ingredient_id);


--
-- TOC entry 5089 (class 2606 OID 17555)
-- Name: dish_outlets dish_outlets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_outlets
    ADD CONSTRAINT dish_outlets_pkey PRIMARY KEY (dish_id, outlet_id);


--
-- TOC entry 5083 (class 2606 OID 17529)
-- Name: dishes dishes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (id);


--
-- TOC entry 5085 (class 2606 OID 17531)
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
-- TOC entry 5093 (class 2606 OID 17598)
-- Name: ingredients ingredients_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_name_key UNIQUE (name);


--
-- TOC entry 5095 (class 2606 OID 17594)
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY (id);


--
-- TOC entry 5097 (class 2606 OID 17596)
-- Name: ingredients ingredients_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_uuid_key UNIQUE (uuid);


--
-- TOC entry 5104 (class 2606 OID 17638)
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5126 (class 2606 OID 17787)
-- Name: kot_items kot_items_kot_id_order_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_kot_id_order_item_id_key UNIQUE (kot_id, order_item_id);


--
-- TOC entry 5128 (class 2606 OID 17785)
-- Name: kot_items kot_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5121 (class 2606 OID 17754)
-- Name: kot kot_kot_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_kot_number_key UNIQUE (kot_number);


--
-- TOC entry 5123 (class 2606 OID 17752)
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
-- TOC entry 5117 (class 2606 OID 17725)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5110 (class 2606 OID 17690)
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 5112 (class 2606 OID 17686)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5114 (class 2606 OID 17688)
-- Name: orders orders_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_uuid_key UNIQUE (uuid);


--
-- TOC entry 5069 (class 2606 OID 17438)
-- Name: outlet_creation_log outlet_creation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log
    ADD CONSTRAINT outlet_creation_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5160 (class 2606 OID 18268)
-- Name: outlet_integrations outlet_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_integrations
    ADD CONSTRAINT outlet_integrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5063 (class 2606 OID 17416)
-- Name: outlets outlets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 17420)
-- Name: outlets outlets_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_username_key UNIQUE (username);


--
-- TOC entry 5067 (class 2606 OID 17418)
-- Name: outlets outlets_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_uuid_key UNIQUE (uuid);


--
-- TOC entry 5091 (class 2606 OID 17574)
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
-- TOC entry 5071 (class 2606 OID 17468)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5073 (class 2606 OID 17472)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5075 (class 2606 OID 17470)
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
-- TOC entry 5086 (class 1259 OID 17543)
-- Name: idx_dishes_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dishes_category ON public.dishes USING btree (category_id);


--
-- TOC entry 5087 (class 1259 OID 17542)
-- Name: idx_dishes_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dishes_name ON public.dishes USING gin (to_tsvector('english'::regconfig, (name)::text));


--
-- TOC entry 5136 (class 1259 OID 17891)
-- Name: idx_expenses_outlet_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_outlet_date ON public.expenses USING btree (outlet_id, expense_date);


--
-- TOC entry 5100 (class 1259 OID 17656)
-- Name: idx_inventory_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_date ON public.inventory_transactions USING btree (transaction_date);


--
-- TOC entry 5101 (class 1259 OID 17655)
-- Name: idx_inventory_ingredient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_ingredient ON public.inventory_transactions USING btree (ingredient_id);


--
-- TOC entry 5102 (class 1259 OID 17654)
-- Name: idx_inventory_outlet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_outlet ON public.inventory_transactions USING btree (outlet_id);


--
-- TOC entry 5124 (class 1259 OID 17798)
-- Name: idx_kot_items_kot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kot_items_kot ON public.kot_items USING btree (kot_id);


--
-- TOC entry 5118 (class 1259 OID 17771)
-- Name: idx_kot_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kot_order ON public.kot USING btree (order_id);


--
-- TOC entry 5119 (class 1259 OID 17770)
-- Name: idx_kot_outlet_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kot_outlet_status ON public.kot USING btree (outlet_id, status);


--
-- TOC entry 5157 (class 1259 OID 18240)
-- Name: idx_ledger_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_date ON public.accounting_ledger USING btree (payment_date);


--
-- TOC entry 5158 (class 1259 OID 18241)
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
-- TOC entry 5115 (class 1259 OID 17736)
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- TOC entry 5105 (class 1259 OID 17702)
-- Name: idx_orders_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_date ON public.orders USING btree (order_time);


--
-- TOC entry 5106 (class 1259 OID 17703)
-- Name: idx_orders_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_number ON public.orders USING btree (order_number);


--
-- TOC entry 5107 (class 1259 OID 17701)
-- Name: idx_orders_outlet_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_outlet_status ON public.orders USING btree (outlet_id, order_status);


--
-- TOC entry 5108 (class 1259 OID 17704)
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
-- TOC entry 5208 (class 2620 OID 18017)
-- Name: orders trigger_calculate_order_total; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_calculate_order_total BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.calculate_order_total();


--
-- TOC entry 5209 (class 2620 OID 18019)
-- Name: orders trigger_update_inventory; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_inventory AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_inventory_on_order_completion();


--
-- TOC entry 5211 (class 2620 OID 18242)
-- Name: accounting_ledger update_accounting_ledger_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_accounting_ledger_updated_at BEFORE UPDATE ON public.accounting_ledger FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5202 (class 2620 OID 18008)
-- Name: admin update_admin_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON public.admin FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5205 (class 2620 OID 18011)
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5206 (class 2620 OID 18012)
-- Name: dishes update_dishes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5207 (class 2620 OID 18013)
-- Name: ingredients update_ingredients_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5203 (class 2620 OID 18009)
-- Name: outlets update_outlets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_outlets_updated_at BEFORE UPDATE ON public.outlets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5210 (class 2620 OID 18014)
-- Name: sales_summary update_sales_summary_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_sales_summary_updated_at BEFORE UPDATE ON public.sales_summary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5204 (class 2620 OID 18010)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5200 (class 2606 OID 18243)
-- Name: accounting_ledger accounting_ledger_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounting_ledger
    ADD CONSTRAINT accounting_ledger_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- TOC entry 5194 (class 2606 OID 17967)
-- Name: activity_logs activity_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5195 (class 2606 OID 17962)
-- Name: activity_logs activity_logs_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE SET NULL;


--
-- TOC entry 5196 (class 2606 OID 17957)
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5166 (class 2606 OID 17503)
-- Name: categories categories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5173 (class 2606 OID 17614)
-- Name: dish_ingredients dish_ingredients_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_ingredients
    ADD CONSTRAINT dish_ingredients_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- TOC entry 5174 (class 2606 OID 17619)
-- Name: dish_ingredients dish_ingredients_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_ingredients
    ADD CONSTRAINT dish_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- TOC entry 5169 (class 2606 OID 17556)
-- Name: dish_outlets dish_outlets_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_outlets
    ADD CONSTRAINT dish_outlets_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 17561)
-- Name: dish_outlets dish_outlets_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_outlets
    ADD CONSTRAINT dish_outlets_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5167 (class 2606 OID 17532)
-- Name: dishes dishes_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 5168 (class 2606 OID 17537)
-- Name: dishes dishes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5188 (class 2606 OID 17886)
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5189 (class 2606 OID 17881)
-- Name: expenses expenses_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5172 (class 2606 OID 17599)
-- Name: ingredients ingredients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredients
    ADD CONSTRAINT ingredients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5175 (class 2606 OID 17649)
-- Name: inventory_transactions inventory_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5176 (class 2606 OID 17644)
-- Name: inventory_transactions inventory_transactions_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE;


--
-- TOC entry 5177 (class 2606 OID 17639)
-- Name: inventory_transactions inventory_transactions_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5182 (class 2606 OID 17765)
-- Name: kot kot_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5185 (class 2606 OID 17788)
-- Name: kot_items kot_items_kot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_kot_id_fkey FOREIGN KEY (kot_id) REFERENCES public.kot(id) ON DELETE CASCADE;


--
-- TOC entry 5186 (class 2606 OID 17793)
-- Name: kot_items kot_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot_items
    ADD CONSTRAINT kot_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- TOC entry 5183 (class 2606 OID 17755)
-- Name: kot kot_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5184 (class 2606 OID 17760)
-- Name: kot kot_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kot
    ADD CONSTRAINT kot_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5197 (class 2606 OID 18000)
-- Name: notifications notifications_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id) ON DELETE CASCADE;


--
-- TOC entry 5198 (class 2606 OID 17990)
-- Name: notifications notifications_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5199 (class 2606 OID 17995)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5180 (class 2606 OID 17731)
-- Name: order_items order_items_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE RESTRICT;


--
-- TOC entry 5181 (class 2606 OID 17726)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5178 (class 2606 OID 17696)
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5179 (class 2606 OID 17691)
-- Name: orders orders_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5162 (class 2606 OID 17444)
-- Name: outlet_creation_log outlet_creation_log_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log
    ADD CONSTRAINT outlet_creation_log_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE CASCADE;


--
-- TOC entry 5163 (class 2606 OID 17439)
-- Name: outlet_creation_log outlet_creation_log_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_creation_log
    ADD CONSTRAINT outlet_creation_log_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5201 (class 2606 OID 18269)
-- Name: outlet_integrations outlet_integrations_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlet_integrations
    ADD CONSTRAINT outlet_integrations_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5161 (class 2606 OID 17421)
-- Name: outlets outlets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5171 (class 2606 OID 17575)
-- Name: platform_availability platform_availability_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_availability
    ADD CONSTRAINT platform_availability_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE;


--
-- TOC entry 5187 (class 2606 OID 17859)
-- Name: sales_summary sales_summary_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_summary
    ADD CONSTRAINT sales_summary_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5192 (class 2606 OID 17938)
-- Name: sessions sessions_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE SET NULL;


--
-- TOC entry 5193 (class 2606 OID 17933)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5190 (class 2606 OID 17915)
-- Name: tax_records tax_records_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records
    ADD CONSTRAINT tax_records_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- TOC entry 5191 (class 2606 OID 17910)
-- Name: tax_records tax_records_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_records
    ADD CONSTRAINT tax_records_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- TOC entry 5164 (class 2606 OID 17478)
-- Name: users users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id) ON DELETE SET NULL;


--
-- TOC entry 5165 (class 2606 OID 17473)
-- Name: users users_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


-- Completed on 2026-06-16 10:44:49

--
-- PostgreSQL database dump complete
--

\unrestrict HkGd0NXNqaocCvLIHetkUJ3qJXJHZyV1PZJBymduhNLlxGb5m9EHTjuWQ5ZHHt9

