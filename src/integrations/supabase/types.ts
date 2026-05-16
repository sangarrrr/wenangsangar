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
      customers: {
        Row: {
          created_at: string
          id: string
          nama: string
          telepon: string | null
          total_piutang: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
          telepon?: string | null
          total_piutang?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
          telepon?: string | null
          total_piutang?: number
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          bulan: number
          id: string
          jumlah: number
          kategori: string
          keterangan: string | null
          tahun: number
          tanggal: string
          user_id: string
        }
        Insert: {
          bulan: number
          id?: string
          jumlah: number
          kategori: string
          keterangan?: string | null
          tahun: number
          tanggal?: string
          user_id: string
        }
        Update: {
          bulan?: number
          id?: string
          jumlah?: number
          kategori?: string
          keterangan?: string | null
          tahun?: number
          tanggal?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          expired_date: string | null
          harga_beli: number
          harga_jual: number
          id: string
          image_url: string | null
          kategori: string
          margin_persen: number
          nama_barang: string
          stok: number
          stok_awal: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expired_date?: string | null
          harga_beli?: number
          harga_jual?: number
          id?: string
          image_url?: string | null
          kategori?: string
          margin_persen?: number
          nama_barang: string
          stok?: number
          stok_awal?: number
          user_id: string
        }
        Update: {
          created_at?: string
          expired_date?: string | null
          harga_beli?: number
          harga_jual?: number
          id?: string
          image_url?: string | null
          kategori?: string
          margin_persen?: number
          nama_barang?: string
          stok?: number
          stok_awal?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alamat_toko: string | null
          created_at: string
          email: string | null
          id: string
          nama_toko: string | null
        }
        Insert: {
          alamat_toko?: string | null
          created_at?: string
          email?: string | null
          id: string
          nama_toko?: string | null
        }
        Update: {
          alamat_toko?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nama_toko?: string | null
        }
        Relationships: []
      }
      receivables: {
        Row: {
          catatan: string | null
          cicilan: Json
          created_at: string
          customer_id: string | null
          id: string
          jatuh_tempo: string
          nama_pelanggan: string
          sisa_hutang: number
          status: string
          telepon: string | null
          total_hutang: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          catatan?: string | null
          cicilan?: Json
          created_at?: string
          customer_id?: string | null
          id?: string
          jatuh_tempo: string
          nama_pelanggan: string
          sisa_hutang: number
          status?: string
          telepon?: string | null
          total_hutang: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          catatan?: string | null
          cicilan?: Json
          created_at?: string
          customer_id?: string | null
          id?: string
          jatuh_tempo?: string
          nama_pelanggan?: string
          sisa_hutang?: number
          status?: string
          telepon?: string | null
          total_hutang?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          jumlah_retur: number
          nama_produk: string
          product_id: string | null
          refund_amount: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          jumlah_retur: number
          nama_produk: string
          product_id?: string | null
          refund_amount: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          jumlah_retur?: number
          nama_produk?: string
          product_id?: string | null
          refund_amount?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          batch_id: string | null
          created_at: string
          customer_id: string | null
          harga_beli_satuan: number
          harga_jual_satuan: number
          id: string
          jumlah_retur: number
          metode_pembayaran: string
          nama_produk: string
          product_id: string | null
          profit: number
          quantity: number
          status_retur: string | null
          total_harga: number
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          customer_id?: string | null
          harga_beli_satuan: number
          harga_jual_satuan: number
          id?: string
          jumlah_retur?: number
          metode_pembayaran: string
          nama_produk: string
          product_id?: string | null
          profit: number
          quantity: number
          status_retur?: string | null
          total_harga: number
          user_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          customer_id?: string | null
          harga_beli_satuan?: number
          harga_jual_satuan?: number
          id?: string
          jumlah_retur?: number
          metode_pembayaran?: string
          nama_produk?: string
          product_id?: string | null
          profit?: number
          quantity?: number
          status_retur?: string | null
          total_harga?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
