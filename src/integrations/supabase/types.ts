export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      "bd-delibery": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          business_id: string
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          is_active: boolean
          open_time: string
          updated_at: string
        }
        Insert: {
          business_id: string
          close_time: string
          created_at?: string
          day_of_week: number
          id?: string
          is_active?: boolean
          open_time: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_active?: boolean
          open_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      delivery_businesses: {
        Row: {
          accent_color: string | null
          address: string | null
          background_color: string | null
          button_color: string | null
          button_text_color: string | null
          cart_button_color: string | null
          cart_button_text_color: string | null
          created_at: string
          delivery_fee: number | null
          delivery_time_bg_color: string | null
          delivery_time_minutes: number
          delivery_time_text_color: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          min_order_value: number
          name: string
          owner_id: string
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          text_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          background_color?: string | null
          button_color?: string | null
          button_text_color?: string | null
          cart_button_color?: string | null
          cart_button_text_color?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_time_bg_color?: string | null
          delivery_time_minutes?: number
          delivery_time_text_color?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          min_order_value?: number
          name: string
          owner_id: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          background_color?: string | null
          button_color?: string | null
          button_text_color?: string | null
          cart_button_color?: string | null
          cart_button_text_color?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_time_bg_color?: string | null
          delivery_time_minutes?: number
          delivery_time_text_color?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          min_order_value?: number
          name?: string
          owner_id?: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      flavor_options: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      flavor_prices: {
        Row: {
          created_at: string
          flavor_id: string
          id: string
          price: number
          size: Database["public"]["Enums"]["pizza_size"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          flavor_id: string
          id?: string
          price: number
          size: Database["public"]["Enums"]["pizza_size"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          flavor_id?: string
          id?: string
          price?: number
          size?: Database["public"]["Enums"]["pizza_size"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flavor_prices_flavor_id_fkey"
            columns: ["flavor_id"]
            isOneToOne: false
            referencedRelation: "flavor_options"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          active: boolean | null
          business_id: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          business_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          business_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "delivery_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_flavors: {
        Row: {
          created_at: string
          flavor_id: string
          id: string
          menu_item_id: string
        }
        Insert: {
          created_at?: string
          flavor_id: string
          id?: string
          menu_item_id: string
        }
        Update: {
          created_at?: string
          flavor_id?: string
          id?: string
          menu_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_flavors_flavor_id_fkey"
            columns: ["flavor_id"]
            isOneToOne: false
            referencedRelation: "flavor_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_flavors_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          active: boolean | null
          business_id: string
          category_id: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          preparation_time: number | null
          price: number
          supports_fractional: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          business_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          preparation_time?: number | null
          price: number
          supports_fractional?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          business_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          preparation_time?: number | null
          price?: number
          supports_fractional?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "delivery_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          notes: string | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          notes?: string | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string
          created_at: string
          customer_address: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number | null
          delivery_id: string | null
          id: string
          notes: string | null
          order_code: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number | null
          delivery_id?: string | null
          id?: string
          notes?: string | null
          order_code?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number | null
          delivery_id?: string | null
          id?: string
          notes?: string | null
          order_code?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "delivery_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          business_id: string
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      force_create_user: {
        Args: { email: string; password?: string }
        Returns: string
      }
      generate_order_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_business_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      insert_user: {
        Args: { email: string }
        Returns: string
      }
    }
    Enums: {
      order_status:
        | "pending"
        | "preparing"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      payment_method:
        | "cash"
        | "credit_card"
        | "debit_card"
        | "pix"
        | "food_voucher"
      pizza_size: "broto" | "grande"
      user_role: "cliente" | "dono_delivery"
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
      order_status: [
        "pending",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      payment_method: [
        "cash",
        "credit_card",
        "debit_card",
        "pix",
        "food_voucher",
      ],
      pizza_size: ["broto", "grande"],
      user_role: ["cliente", "dono_delivery"],
    },
  },
} as const
