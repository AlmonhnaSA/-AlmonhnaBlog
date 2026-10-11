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
      article_categories: {
        Row: {
          article_id: string
          category_id: string
          created_at: string
          id: string
        }
        Insert: {
          article_id: string
          category_id: string
          created_at?: string
          id?: string
        }
        Update: {
          article_id?: string
          category_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_categories_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      article_continuations: {
        Row: {
          article_id: string
          created_at: string
          display_order: number
          id: string
          target_article_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          display_order?: number
          id?: string
          target_article_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          display_order?: number
          id?: string
          target_article_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_continuations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_continuations_target_article_id_fkey"
            columns: ["target_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_knowledge_links: {
        Row: {
          anchor_key: string
          article_id: string
          created_at: string
          id: string
          question: string
          target_article_id: string
          updated_at: string
        }
        Insert: {
          anchor_key: string
          article_id: string
          created_at?: string
          id?: string
          question: string
          target_article_id: string
          updated_at?: string
        }
        Update: {
          anchor_key?: string
          article_id?: string
          created_at?: string
          id?: string
          question?: string
          target_article_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_knowledge_links_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_knowledge_links_target_article_id_fkey"
            columns: ["target_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          approved_at: string | null
          author_id: string
          content: string
          cover_image_url: string
          created_at: string
          excerpt: string
          id: string
          linkedin_url: string | null
          product_id: string | null
          rejection_reason: string | null
          sequence_points: Json
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          approved_at?: string | null
          author_id: string
          content: string
          cover_image_url: string
          created_at?: string
          excerpt: string
          id?: string
          linkedin_url?: string | null
          product_id?: string | null
          rejection_reason?: string | null
          sequence_points?: Json
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          approved_at?: string | null
          author_id?: string
          content?: string
          cover_image_url?: string
          created_at?: string
          excerpt?: string
          id?: string
          linkedin_url?: string | null
          product_id?: string | null
          rejection_reason?: string | null
          sequence_points?: Json
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      audience_questions: {
        Row: {
          created_at: string
          email: string | null
          id: string
          linked_article_id: string | null
          name: string | null
          question: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          linked_article_id?: string | null
          name?: string | null
          question: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          linked_article_id?: string | null
          name?: string | null
          question?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audience_questions_linked_article_id_fkey"
            columns: ["linked_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_episodes: {
        Row: {
          audio_url: string
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_order: number
          duration_label: string | null
          episode_date: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          title: string
          updated_at: string
        }
        Insert: {
          audio_url: string
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_label?: string | null
          episode_date?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_label?: string | null
          episode_date?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          display_order: number
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_likes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_stories: {
        Row: {
          article_id: string
          badge: string | null
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          starts_at: string | null
          stops: Json
          updated_at: string
        }
        Insert: {
          article_id: string
          badge?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          stops?: Json
          updated_at?: string
        }
        Update: {
          article_id?: string
          badge?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          stops?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_stories_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          approved_at: string | null
          author_id: string
          content: string
          cover_image_url: string
          created_at: string
          excerpt: string
          gallery_images: Json
          gallery_pdf_url: string | null
          gallery_title: string | null
          id: string
          linkedin_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          approved_at?: string | null
          author_id: string
          content: string
          cover_image_url: string
          created_at?: string
          excerpt: string
          gallery_images?: Json
          gallery_pdf_url?: string | null
          gallery_title?: string | null
          id?: string
          linkedin_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          approved_at?: string | null
          author_id?: string
          content?: string
          cover_image_url?: string
          created_at?: string
          excerpt?: string
          gallery_images?: Json
          gallery_pdf_url?: string | null
          gallery_title?: string | null
          id?: string
          linkedin_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "news_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      number_stories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          link_url: string | null
          number_value: string
          source: string | null
          story_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          number_value: string
          source?: string | null
          story_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          number_value?: string
          source?: string | null
          story_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          profile_id: string
          status: string
          store_product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          profile_id: string
          status?: string
          store_product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          status?: string
          store_product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_requests_store_product_id_fkey"
            columns: ["store_product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          id: string
          linkedin_url: string | null
          name: string
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["content_status"]
          twitter_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          id?: string
          linkedin_url?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          twitter_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_cards: {
        Row: {
          article_id: string | null
          article_title: string | null
          background_color: string
          color: string
          created_at: string
          id: string
          linkedin_handle: string | null
          profile_id: string
          quote_text: string
          size: string
          text_color: string
          updated_at: string
          user_id: string
          writer_name: string
          x_handle: string | null
        }
        Insert: {
          article_id?: string | null
          article_title?: string | null
          background_color?: string
          color?: string
          created_at?: string
          id?: string
          linkedin_handle?: string | null
          profile_id: string
          quote_text: string
          size?: string
          text_color?: string
          updated_at?: string
          user_id: string
          writer_name: string
          x_handle?: string | null
        }
        Update: {
          article_id?: string | null
          article_title?: string | null
          background_color?: string
          color?: string
          created_at?: string
          id?: string
          linkedin_handle?: string | null
          profile_id?: string
          quote_text?: string
          size?: string
          text_color?: string
          updated_at?: string
          user_id?: string
          writer_name?: string
          x_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_cards_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_cards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_rate_limits: {
        Row: {
          attempts: number
          key_hash: string
          window_start: string
        }
        Insert: {
          attempts?: number
          key_hash: string
          window_start?: string
        }
        Update: {
          attempts?: number
          key_hash?: string
          window_start?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          contact: string
          created_at: string
          details: string
          id: string
          name: string
          notification_status: string
          service: string
          status: string
          submission_key: string
          updated_at: string
        }
        Insert: {
          contact: string
          created_at?: string
          details: string
          id?: string
          name: string
          notification_status?: string
          service: string
          status?: string
          submission_key: string
          updated_at?: string
        }
        Update: {
          contact?: string
          created_at?: string
          details?: string
          id?: string
          name?: string
          notification_status?: string
          service?: string
          status?: string
          submission_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_product_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          store_product_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          store_product_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          store_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_product_files_store_product_id_fkey"
            columns: ["store_product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_product_images: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          store_product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          store_product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          store_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_product_images_store_product_id_fkey"
            columns: ["store_product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          name: string
          product_type: string
          required_articles_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          name: string
          product_type?: string
          required_articles_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          name?: string
          product_type?: string
          required_articles_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      timeline_stops: {
        Row: {
          article_id: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          label: string | null
          timeline_id: string
          title: string
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          label?: string | null
          timeline_id: string
          title: string
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          label?: string | null
          timeline_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_stops_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_stops_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          },
        ]
      }
      timelines: {
        Row: {
          color: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          timeline_type: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          timeline_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          timeline_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_service_request_limit: {
        Args: { p_key_hash: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      content_status: "pending" | "approved" | "rejected"
      user_role: "admin" | "writer"
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
      content_status: ["pending", "approved", "rejected"],
      user_role: ["admin", "writer"],
    },
  },
} as const
