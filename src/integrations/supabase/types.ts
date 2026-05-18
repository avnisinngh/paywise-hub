export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          date: string
          employee_id: string
          id: string
          status: string
        }
        Insert: {
          date: string
          employee_id: string
          id?: string
          status: string
        }
        Update: {
          date?: string
          employee_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_salary: {
        Row: {
          created_at: string
          ctc: number
          effective_from: string
          employee_id: string
          id: string
          structure_id: string | null
        }
        Insert: {
          created_at?: string
          ctc?: number
          effective_from?: string
          employee_id: string
          id?: string
          structure_id?: string | null
        }
        Update: {
          created_at?: string
          ctc?: number
          effective_from?: string
          employee_id?: string
          id?: string
          structure_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_salary_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_salary_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "salary_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          aadhaar: string | null
          account_holder_name: string | null
          address: string | null
          bank_account: string | null
          bank_name: string | null
          created_at: string
          date_of_joining: string | null
          department: string | null
          designation: string | null
          dob: string | null
          documents: Json
          emergency_contact: string | null
          emergency_contact_name: string | null
          emp_id: string
          employment_type: string | null
          esi_applicable: boolean | null
          father_name: string | null
          full_name: string
          gender: string | null
          id: string
          ifsc: string | null
          onboarded_at: string | null
          pan: string | null
          personal_email: string | null
          pf_applicable: boolean | null
          phone: string | null
          pt_applicable: boolean | null
          status: string
          updated_at: string
          work_location: string | null
        }
        Insert: {
          aadhaar?: string | null
          account_holder_name?: string | null
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          dob?: string | null
          documents?: Json
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emp_id: string
          employment_type?: string | null
          esi_applicable?: boolean | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          ifsc?: string | null
          onboarded_at?: string | null
          pan?: string | null
          personal_email?: string | null
          pf_applicable?: boolean | null
          phone?: string | null
          pt_applicable?: boolean | null
          status?: string
          updated_at?: string
          work_location?: string | null
        }
        Update: {
          aadhaar?: string | null
          account_holder_name?: string | null
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          dob?: string | null
          documents?: Json
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emp_id?: string
          employment_type?: string | null
          esi_applicable?: boolean | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          ifsc?: string | null
          onboarded_at?: string | null
          pan?: string | null
          personal_email?: string | null
          pf_applicable?: boolean | null
          phone?: string | null
          pt_applicable?: boolean | null
          status?: string
          updated_at?: string
          work_location?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          days: number
          employee_id: string
          from_date: string
          id: string
          leave_type_id: string
          reason: string | null
          status: string
          to_date: string
        }
        Insert: {
          created_at?: string
          days: number
          employee_id: string
          from_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          status?: string
          to_date: string
        }
        Update: {
          created_at?: string
          days?: number
          employee_id?: string
          from_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          status?: string
          to_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          annual_entitlement: number
          id: string
          name: string
        }
        Insert: {
          annual_entitlement?: number
          id?: string
          name: string
        }
        Update: {
          annual_entitlement?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      onboarding_tokens: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id?: string
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tokens_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          components_snapshot: Json | null
          employee_id: string
          esi_employee: number
          esi_employer: number
          gross_pay: number
          id: string
          lop_days: number
          net_pay: number
          other_deductions: number
          pf_employee: number
          pf_employer: number
          pt: number
          run_id: string
          tds: number
          working_days: number
        }
        Insert: {
          components_snapshot?: Json | null
          employee_id: string
          esi_employee?: number
          esi_employer?: number
          gross_pay?: number
          id?: string
          lop_days?: number
          net_pay?: number
          other_deductions?: number
          pf_employee?: number
          pf_employer?: number
          pt?: number
          run_id: string
          tds?: number
          working_days?: number
        }
        Update: {
          components_snapshot?: Json | null
          employee_id?: string
          esi_employee?: number
          esi_employer?: number
          gross_pay?: number
          id?: string
          lop_days?: number
          net_pay?: number
          other_deductions?: number
          pf_employee?: number
          pf_employer?: number
          pt?: number
          run_id?: string
          tds?: number
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          finalized_at: string | null
          id: string
          month: number
          status: string
          total_gross: number
          total_net: number
          year: number
        }
        Insert: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          month: number
          status?: string
          total_gross?: number
          total_net?: number
          year: number
        }
        Update: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          month?: number
          status?: string
          total_gross?: number
          total_net?: number
          year?: number
        }
        Relationships: []
      }
      payslips: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          payslip_data: Json
          run_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          payslip_data: Json
          run_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          payslip_data?: Json
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_components: {
        Row: {
          calc_type: string
          created_at: string
          default_value: number
          id: string
          name: string
          taxable: boolean
          type: string
        }
        Insert: {
          calc_type: string
          created_at?: string
          default_value?: number
          id?: string
          name: string
          taxable?: boolean
          type: string
        }
        Update: {
          calc_type?: string
          created_at?: string
          default_value?: number
          id?: string
          name?: string
          taxable?: boolean
          type?: string
        }
        Relationships: []
      }
      salary_structures: {
        Row: {
          components: Json
          created_at: string
          id: string
          name: string
        }
        Insert: {
          components?: Json
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          components?: Json
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      tax_declarations: {
        Row: {
          city_type: string | null
          employee_id: string
          financial_year: string
          home_loan_interest: number | null
          hra_rent_paid: number | null
          id: string
          other_declarations: Json | null
          regime: string
          section_80c: number | null
          section_80d: number | null
        }
        Insert: {
          city_type?: string | null
          employee_id: string
          financial_year: string
          home_loan_interest?: number | null
          hra_rent_paid?: number | null
          id?: string
          other_declarations?: Json | null
          regime?: string
          section_80c?: number | null
          section_80d?: number | null
        }
        Update: {
          city_type?: string | null
          employee_id?: string
          financial_year?: string
          home_loan_interest?: number | null
          hra_rent_paid?: number | null
          id?: string
          other_declarations?: Json | null
          regime?: string
          section_80c?: number | null
          section_80d?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_declarations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
