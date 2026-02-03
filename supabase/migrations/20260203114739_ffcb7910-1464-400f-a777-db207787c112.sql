-- Criar tabela departments
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  leader_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index para buscas por empresa
CREATE INDEX idx_departments_company ON departments(company_id);

-- Constraint de unicidade nome por empresa
ALTER TABLE departments ADD CONSTRAINT departments_name_company_unique 
  UNIQUE (company_id, name);

-- RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Members can view departments"
  ON departments FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  USING (is_company_admin(auth.uid(), company_id));

-- Adicionar FK em teams
ALTER TABLE teams ADD COLUMN department_id uuid REFERENCES departments(id) ON DELETE SET NULL;

-- Adicionar FK em company_memberships
ALTER TABLE company_memberships ADD COLUMN department_id uuid REFERENCES departments(id) ON DELETE SET NULL;

-- Trigger para updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Migrar dados existentes: criar departamentos a partir dos textos nas teams
INSERT INTO departments (company_id, name)
SELECT DISTINCT company_id, department
FROM teams
WHERE department IS NOT NULL AND department != ''
ON CONFLICT (company_id, name) DO NOTHING;

-- Atualizar FK nas teams existentes
UPDATE teams t
SET department_id = d.id
FROM departments d
WHERE t.company_id = d.company_id AND t.department = d.name;