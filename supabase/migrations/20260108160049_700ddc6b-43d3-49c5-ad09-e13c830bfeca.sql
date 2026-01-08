-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'maintainer');

-- Create stall status enum
CREATE TYPE public.stall_status AS ENUM ('available', 'reserved', 'sold', 'pending', 'blocked');

-- Create lead status enum
CREATE TYPE public.lead_status AS ENUM ('new', 'follow_up', 'interested', 'not_interested', 'converted');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'partial', 'paid');

-- Create payment mode enum
CREATE TYPE public.payment_mode AS ENUM ('cash', 'upi', 'bank');

-- Create service category enum
CREATE TYPE public.service_category AS ENUM ('sponsor', 'signboard', 'food_court', 'add_on');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'maintainer',
  UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accounts table (for payment destinations)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  upi_details TEXT,
  bank_details TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stalls table
CREATE TABLE public.stalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_number TEXT NOT NULL UNIQUE,
  size TEXT NOT NULL,
  zone TEXT,
  base_rent DECIMAL(12,2) NOT NULL DEFAULT 0,
  status stall_status NOT NULL DEFAULT 'available',
  notes TEXT,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 1,
  height INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sellable services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category service_category NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  is_unlimited BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  interested_size TEXT,
  interested_zone TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT NOT NULL UNIQUE,
  lead_id UUID REFERENCES public.leads(id) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transaction line items
CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL, -- 'stall' or 'service'
  stall_id UUID REFERENCES public.stalls(id),
  service_id UUID REFERENCES public.services(id),
  item_name TEXT NOT NULL,
  size TEXT,
  base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  addon_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  final_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_mode payment_mode NOT NULL,
  account_id UUID REFERENCES public.accounts(id),
  reference_id TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin or maintainer
CREATE OR REPLACE FUNCTION public.is_authenticated_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- RLS Policies for accounts (Admin only)
CREATE POLICY "Admins can manage accounts"
ON public.accounts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for stalls
CREATE POLICY "Authenticated users can view stalls"
ON public.stalls FOR SELECT
TO authenticated
USING (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Authenticated users can insert stalls"
ON public.stalls FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Authenticated users can update stalls"
ON public.stalls FOR UPDATE
TO authenticated
USING (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Admins can delete stalls"
ON public.stalls FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for services
CREATE POLICY "Authenticated users can view services"
ON public.services FOR SELECT
TO authenticated
USING (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for leads
CREATE POLICY "Authenticated users can view leads"
ON public.leads FOR SELECT
TO authenticated
USING (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Authenticated users can insert leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Authenticated users can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for transactions
CREATE POLICY "Authenticated users can view transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Authenticated users can insert transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Authenticated users can update transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Admins can delete transactions"
ON public.transactions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for transaction_items
CREATE POLICY "Authenticated users can view transaction items"
ON public.transaction_items FOR SELECT
TO authenticated
USING (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Authenticated users can insert transaction items"
ON public.transaction_items FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated_user(auth.uid()));

CREATE POLICY "Authenticated users can update transaction items"
ON public.transaction_items FOR UPDATE
TO authenticated
USING (public.is_authenticated_user(auth.uid()));

-- RLS Policies for payments (Admin only for write)
CREATE POLICY "Admins can view payments"
ON public.payments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage payments"
ON public.payments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stalls_updated_at BEFORE UPDATE ON public.stalls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.transaction_number := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('transaction_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS transaction_number_seq START 1;

CREATE TRIGGER set_transaction_number
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.transaction_number IS NULL OR NEW.transaction_number = '')
  EXECUTE FUNCTION public.generate_transaction_number();

-- Seed stalls data (5x6 grid layout)
INSERT INTO public.stalls (stall_number, size, zone, base_rent, status, position_x, position_y, width, height) VALUES
('A1', 'Small', 'Zone A', 50000, 'available', 0, 0, 1, 1),
('A2', 'Small', 'Zone A', 50000, 'available', 1, 0, 1, 1),
('A3', 'Medium', 'Zone A', 75000, 'available', 2, 0, 2, 1),
('A4', 'Small', 'Zone A', 50000, 'available', 4, 0, 1, 1),
('B1', 'Large', 'Zone B', 100000, 'available', 0, 1, 2, 2),
('B2', 'Small', 'Zone B', 55000, 'available', 2, 1, 1, 1),
('B3', 'Small', 'Zone B', 55000, 'available', 3, 1, 1, 1),
('B4', 'Medium', 'Zone B', 80000, 'available', 4, 1, 1, 2),
('C1', 'Small', 'Zone C', 45000, 'available', 2, 2, 1, 1),
('C2', 'Small', 'Zone C', 45000, 'available', 3, 2, 1, 1),
('D1', 'Medium', 'Zone D', 70000, 'available', 0, 3, 2, 1),
('D2', 'Small', 'Zone D', 48000, 'available', 2, 3, 1, 1),
('D3', 'Small', 'Zone D', 48000, 'available', 3, 3, 1, 1),
('D4', 'Large', 'Zone D', 120000, 'available', 4, 3, 1, 2),
('E1', 'Small', 'Zone E', 42000, 'available', 0, 4, 1, 1),
('E2', 'Small', 'Zone E', 42000, 'available', 1, 4, 1, 1),
('E3', 'Medium', 'Zone E', 65000, 'available', 2, 4, 2, 1);

-- Seed services
INSERT INTO public.services (name, category, description, price, quantity, is_unlimited) VALUES
('Title Sponsor', 'sponsor', 'Main title sponsorship with prominent branding', 500000, 1, false),
('Gold Sponsor', 'sponsor', 'Gold tier sponsorship package', 250000, 3, false),
('Silver Sponsor', 'sponsor', 'Silver tier sponsorship package', 100000, 5, false),
('Main Entrance Signboard', 'signboard', 'Large signboard at main entrance', 150000, 2, false),
('Hall Banner', 'signboard', 'Banner placement in exhibition hall', 50000, 10, false),
('Food Court Stall', 'food_court', 'Food court stall space', 75000, 8, false),
('Electricity Add-on', 'add_on', 'Additional power connection', 5000, 0, true),
('WiFi Add-on', 'add_on', 'Dedicated WiFi connection', 3000, 0, true);

-- Seed accounts
INSERT INTO public.accounts (name, upi_details, bank_details, is_active) VALUES
('Main Exhibition Account', 'exhibition@upi', 'HDFC Bank - 1234567890', true),
('Secondary Account', 'exhibition2@upi', 'ICICI Bank - 0987654321', true);