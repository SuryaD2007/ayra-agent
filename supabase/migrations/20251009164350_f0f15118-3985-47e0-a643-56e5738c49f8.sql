-- Create email groups table
CREATE TABLE public.email_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for email groups
CREATE POLICY "Admins can manage email groups"
ON public.email_groups
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create email group members table
CREATE TABLE public.email_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.email_groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, email)
);

-- Enable RLS
ALTER TABLE public.email_group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for email group members
CREATE POLICY "Admins can manage email group members"
ON public.email_group_members
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));