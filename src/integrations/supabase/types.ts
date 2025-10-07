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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      beta_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          note: string | null
          os: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          note?: string | null
          os: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          note?: string | null
          os?: string
          source?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      item_tags: {
        Row: {
          item_id: string
          tag_id: string
        }
        Insert: {
          item_id: string
          tag_id: string
        }
        Update: {
          item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          content: string | null
          created_at: string
          deleted_at: string | null
          file_path: string | null
          id: string
          mime_type: string | null
          parsed_content: string | null
          size_bytes: number | null
          source: string | null
          space_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          file_path?: string | null
          id?: string
          mime_type?: string | null
          parsed_content?: string | null
          size_bytes?: number | null
          source?: string | null
          space_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          file_path?: string | null
          id?: string
          mime_type?: string | null
          parsed_content?: string | null
          size_bytes?: number | null
          source?: string | null
          space_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          role: string
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_videos: {
        Row: {
          created_at: string
          id: string
          processed_at: string
          title: string | null
          transcript: string | null
          url: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_at?: string
          title?: string | null
          transcript?: string | null
          url: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_at?: string
          title?: string | null
          transcript?: string | null
          url?: string
          video_id?: string
        }
        Relationships: []
      }
      profile_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          title: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          description: string | null
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string | null
          project_files: Json | null
          project_links: Json | null
          review_count: number
          review_score: number | null
          stage: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          project_files?: Json | null
          project_links?: Json | null
          review_count?: number
          review_score?: number | null
          stage?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          project_files?: Json | null
          project_links?: Json | null
          review_count?: number
          review_score?: number | null
          stage?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spaces: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          name: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      video_interactions: {
        Row: {
          ai_response: string | null
          created_at: string
          id: string
          user_id: string
          user_query: string | null
          video_id: string
          video_title: string | null
          video_url: string
        }
        Insert: {
          ai_response?: string | null
          created_at?: string
          id?: string
          user_id: string
          user_query?: string | null
          video_id: string
          video_title?: string | null
          video_url: string
        }
        Update: {
          ai_response?: string | null
          created_at?: string
          id?: string
          user_id?: string
          user_query?: string | null
          video_id?: string
          video_title?: string | null
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_spaces_for_user: {
        Args: { user_id: string }
        Returns: undefined
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
