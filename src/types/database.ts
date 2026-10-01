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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string
          district: string
          id: string
          is_default: boolean
          label: string
          landmark: string | null
          phone: string
          postal_code: string
          province: string
          recipient_name: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          district: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          phone: string
          postal_code: string
          province: string
          recipient_name: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          district?: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          phone?: string
          postal_code?: string
          province?: string
          recipient_name?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          quantity: number
          variant_id: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          quantity: number
          variant_id: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          quantity?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          show_on_home: boolean
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          show_on_home?: boolean
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          show_on_home?: boolean
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          variant_id: string | null
          variant_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity: number
          variant_id?: string | null
          variant_label: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          variant_id?: string | null
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          id: number
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: never
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: never
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          courier: string | null
          courier_service: string | null
          created_at: string
          expires_at: string | null
          id: string
          order_number: string
          paid_at: string | null
          payment_method: string | null
          shipping_address: Json
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          total_weight_gram: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          courier?: string | null
          courier_service?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          shipping_address: Json
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          total_weight_gram?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          courier?: string | null
          courier_service?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          shipping_address?: Json
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          total_weight_gram?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          channel_code: string | null
          created_at: string
          expires_at: string
          id: string
          method: string
          order_id: string
          paid_at: string | null
          payment_url: string | null
          provider: string
          provider_payment_id: string
          qr_string: string | null
          status: string
          updated_at: string
          va_number: string | null
        }
        Insert: {
          amount: number
          channel_code?: string | null
          created_at?: string
          expires_at: string
          id?: string
          method: string
          order_id: string
          paid_at?: string | null
          payment_url?: string | null
          provider?: string
          provider_payment_id: string
          qr_string?: string | null
          status?: string
          updated_at?: string
          va_number?: string | null
        }
        Update: {
          amount?: number
          channel_code?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          method?: string
          order_id?: string
          paid_at?: string | null
          payment_url?: string | null
          provider?: string
          provider_payment_id?: string
          qr_string?: string | null
          status?: string
          updated_at?: string
          va_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string
          color_name: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string
          color_name?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string
          color_name?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_hex: string
          color_name: string
          created_at: string
          id: string
          is_active: boolean
          price: number
          product_id: string
          size_detail: string | null
          size_name: string
          sku: string
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          color_hex: string
          color_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          price: number
          product_id: string
          size_detail?: string | null
          size_name?: string
          sku: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          color_hex?: string
          color_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number
          product_id?: string
          size_detail?: string | null
          size_name?: string
          sku?: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          care: string | null
          category_id: string
          created_at: string
          description: string
          finishing: string | null
          id: string
          is_active: boolean
          material: string
          name: string
          slug: string
          sold_count: number
          updated_at: string
          weight_gram: number
        }
        Insert: {
          care?: string | null
          category_id: string
          created_at?: string
          description?: string
          finishing?: string | null
          id?: string
          is_active?: boolean
          material: string
          name: string
          slug: string
          sold_count?: number
          updated_at?: string
          weight_gram?: number
        }
        Update: {
          care?: string | null
          category_id?: string
          created_at?: string
          description?: string
          finishing?: string | null
          id?: string
          is_active?: boolean
          material?: string
          name?: string
          slug?: string
          sold_count?: number
          updated_at?: string
          weight_gram?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits?: number
          key: string
          window_start?: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          product_id: string
          rating: number
          reviewer_name: string
          updated_at: string
          user_id: string
          variant_label: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          reviewer_name?: string
          updated_at?: string
          user_id: string
          variant_label?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          reviewer_name?: string
          updated_at?: string
          user_id?: string
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_destinations: {
        Row: {
          created_at: string
          destination_id: string
          label: string
          lookup_key: string
        }
        Insert: {
          created_at?: string
          destination_id: string
          label: string
          lookup_key: string
        }
        Update: {
          created_at?: string
          destination_id?: string
          label?: string
          lookup_key?: string
        }
        Relationships: []
      }
      shipping_rate_cache: {
        Row: {
          couriers: string
          destination_id: string
          fetched_at: string
          origin_id: string
          rates: Json
          weight_kg: number
        }
        Insert: {
          couriers: string
          destination_id: string
          fetched_at?: string
          origin_id: string
          rates: Json
          weight_kg: number
        }
        Update: {
          couriers?: string
          destination_id?: string
          fetched_at?: string
          origin_id?: string
          rates?: Json
          weight_kg?: number
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      product_cards: {
        Row: {
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          color_names: string[] | null
          colors: Json | null
          created_at: string | null
          id: string | null
          image_url: string | null
          is_low_stock: boolean | null
          is_new: boolean | null
          material: string | null
          min_price: number | null
          name: string | null
          slug: string | null
          sold_count: number | null
          total_stock: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_dashboard: { Args: { p_period?: string }; Returns: Json }
      admin_resolve_payment_issue: {
        Args: { p_order_number: string }
        Returns: undefined
      }
      admin_update_order: {
        Args: {
          p_order_number: string
          p_status: Database["public"]["Enums"]["order_status"]
          p_tracking?: string
        }
        Returns: Json
      }
      apply_payment_status: {
        Args: {
          p_amount: number
          p_paid_at?: string
          p_payment_id: string
          p_status: string
        }
        Returns: string
      }
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      create_order: {
        Args: {
          p_courier: string
          p_courier_service: string
          p_expected_total?: number
          p_shipping_address: Json
          p_shipping_cost: number
          p_user_id: string
        }
        Returns: Json
      }
      expire_overdue_orders: { Args: never; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      release_order_stock: { Args: { p_order_id: string }; Returns: undefined }
    }
    Enums: {
      order_status:
        | "menunggu_pembayaran"
        | "diproses"
        | "dikirim"
        | "selesai"
        | "dibatalkan"
        | "kedaluwarsa"
      user_role: "user" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
        "menunggu_pembayaran",
        "diproses",
        "dikirim",
        "selesai",
        "dibatalkan",
        "kedaluwarsa",
      ],
      user_role: ["user", "admin"],
    },
  },
} as const
