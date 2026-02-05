/**
 * Template Types
 * Database templates for new projects
 */

export interface Column {
  name: string
  type: string
  primary?: boolean
  required?: boolean
  default?: string
  references?: string
}

export interface Table {
  name: string
  columns: Column[]
}

export interface ProjectTemplate {
  id: string
  name: string
  description?: string
  category?: string

  schema_structure: {
    tables: Table[]
  }

  default_policies?: any
  default_buckets?: string[]
  default_functions?: any
  seed_data?: any

  is_public: boolean
  is_system: boolean

  created_by?: string
  created_at: string
  updated_at: string
}

export const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Database template for healthcare applications with patients, appointments, and prescriptions',
    category: 'Healthcare',
    schema_structure: {
      tables: [
        {
          name: 'patients',
          columns: [
            { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
            { name: 'first_name', type: 'text', required: true },
            { name: 'last_name', type: 'text', required: true },
            { name: 'date_of_birth', type: 'date' },
            { name: 'email', type: 'text' },
            { name: 'phone', type: 'text' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
        {
          name: 'appointments',
          columns: [
            { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
            { name: 'patient_id', type: 'uuid', required: true, references: 'patients(id)' },
            { name: 'appointment_date', type: 'timestamptz', required: true },
            { name: 'notes', type: 'text' },
            { name: 'status', type: 'text', default: "'scheduled'" },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
        {
          name: 'prescriptions',
          columns: [
            { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
            { name: 'patient_id', type: 'uuid', required: true, references: 'patients(id)' },
            { name: 'medication', type: 'text', required: true },
            { name: 'dosage', type: 'text', required: true },
            { name: 'instructions', type: 'text' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
      ],
    },
    is_system: true,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Database template for educational platforms with students, courses, and enrollments',
    category: 'Education',
    schema_structure: {
      tables: [
        {
          name: 'students',
          columns: [
            { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
            { name: 'first_name', type: 'text', required: true },
            { name: 'last_name', type: 'text', required: true },
            { name: 'email', type: 'text', required: true },
            { name: 'enrollment_date', type: 'date' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
        {
          name: 'courses',
          columns: [
            { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'instructor', type: 'text' },
            { name: 'credits', type: 'integer' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
        {
          name: 'enrollments',
          columns: [
            { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
            { name: 'student_id', type: 'uuid', required: true, references: 'students(id)' },
            { name: 'course_id', type: 'uuid', required: true, references: 'courses(id)' },
            { name: 'grade', type: 'text' },
            { name: 'enrollment_date', type: 'date', default: 'today()' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
      ],
    },
    is_system: true,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Database template for e-commerce platforms with products, orders, and customers',
    category: 'E-commerce',
    schema_structure: {
      tables: [
        {
          name: 'customers',
          columns: [
            { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
            { name: 'name', type: 'text', required: true },
            { name: 'email', type: 'text', required: true },
            { name: 'phone', type: 'text' },
            { name: 'address', type: 'text' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
        {
          name: 'products',
          columns: [
            { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'price', type: 'numeric', required: true },
            { name: 'stock_quantity', type: 'integer' },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
        {
          name: 'orders',
          columns: [
            { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
            { name: 'customer_id', type: 'uuid', required: true, references: 'customers(id)' },
            { name: 'order_date', type: 'timestamptz', default: 'now()' },
            { name: 'total_amount', type: 'numeric', required: true },
            { name: 'status', type: 'text', default: "'pending'" },
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
          ],
        },
      ],
    },
    is_system: true,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'blank',
    name: 'Blank',
    description: 'Empty database template - start from scratch',
    category: 'General',
    schema_structure: {
      tables: [],
    },
    is_system: true,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]
