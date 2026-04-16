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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_response_cache: {
        Row: {
          cache_key: string
          created_at: string
          function_name: string
          hit_count: number
          id: string
          response_text: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          function_name: string
          hit_count?: number
          id?: string
          response_text: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          function_name?: string
          hit_count?: number
          id?: string
          response_text?: string
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          created_at: string
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          event_date: string
          id: string
          image_url: string | null
          location: string | null
          max_attendees: number | null
          organizer_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          organizer_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_chats: {
        Row: {
          claim_id: string
          created_at: string
          id: string
          post_id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          id?: string
          post_id: string
          user1_id: string
          user2_id: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          id?: string
          post_id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_chats_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: true
            referencedRelation: "lost_found_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_chats_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "lost_found_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_claims: {
        Row: {
          answer: string
          claimant_id: string
          created_at: string
          id: string
          post_id: string
          status: string
          updated_at: string
        }
        Insert: {
          answer: string
          claimant_id: string
          created_at?: string
          id?: string
          post_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          answer?: string
          claimant_id?: string
          created_at?: string
          id?: string
          post_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_claims_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "lost_found_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_matches: {
        Row: {
          created_at: string
          id: string
          matched_post_id: string
          post_id: string
          similarity_score: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          matched_post_id: string
          post_id: string
          similarity_score?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          matched_post_id?: string
          post_id?: string
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_matches_matched_post_id_fkey"
            columns: ["matched_post_id"]
            isOneToOne: false
            referencedRelation: "lost_found_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_matches_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "lost_found_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_meetups: {
        Row: {
          chat_id: string
          confirmed_by_user1: boolean | null
          confirmed_by_user2: boolean | null
          created_at: string
          id: string
          location: string
          meet_time: string
          status: string
          suggested_by: string
        }
        Insert: {
          chat_id: string
          confirmed_by_user1?: boolean | null
          confirmed_by_user2?: boolean | null
          created_at?: string
          id?: string
          location: string
          meet_time: string
          status?: string
          suggested_by: string
        }
        Update: {
          chat_id?: string
          confirmed_by_user1?: boolean | null
          confirmed_by_user2?: boolean | null
          created_at?: string
          id?: string
          location?: string
          meet_time?: string
          status?: string
          suggested_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_meetups_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "lost_found_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "lost_found_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_posts: {
        Row: {
          approximate_time: string | null
          created_at: string
          description: string
          id: string
          is_resolved: boolean
          location: string
          secret_answer: string | null
          secret_question: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approximate_time?: string | null
          created_at?: string
          description: string
          id?: string
          is_resolved?: boolean
          location: string
          secret_answer?: string | null
          secret_question?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approximate_time?: string | null
          created_at?: string
          description?: string
          id?: string
          is_resolved?: boolean
          location?: string
          secret_answer?: string | null
          secret_question?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lost_found_reunions: {
        Row: {
          confirmed_by_user1: boolean | null
          confirmed_by_user2: boolean | null
          created_at: string
          id: string
          post_id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          confirmed_by_user1?: boolean | null
          confirmed_by_user2?: boolean | null
          created_at?: string
          id?: string
          post_id: string
          user1_id: string
          user2_id: string
        }
        Update: {
          confirmed_by_user1?: boolean | null
          confirmed_by_user2?: boolean | null
          created_at?: string
          id?: string
          post_id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_reunions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "lost_found_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_chats: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_chats_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listing_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          listing_id: string
          position: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          listing_id: string
          position?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          listing_id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_free: boolean | null
          is_sold: boolean | null
          is_urgent: boolean | null
          price: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean | null
          is_sold?: boolean | null
          is_urgent?: boolean | null
          price?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean | null
          is_sold?: boolean | null
          is_urgent?: boolean | null
          price?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "marketplace_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_wanted: {
        Row: {
          budget: number | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_fulfilled: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_fulfilled?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          budget?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_fulfilled?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          max_members: number | null
          schedule: string | null
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          max_members?: number | null
          schedule?: string | null
          subject?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          max_members?: number | null
          schedule?: string | null
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_material_bookmarks: {
        Row: {
          created_at: string
          id: string
          material_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_material_bookmarks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          created_at: string
          description: string | null
          download_count: number
          external_url: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          subject: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_count?: number
          external_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          subject?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          download_count?: number
          external_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          subject?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_ai_usage: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_user_ai_usage_today: {
        Args: { _function_name: string; _user_id: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
