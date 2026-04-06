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
      active_tasks: {
        Row: {
          blocked_by: string[] | null
          blocks: string[] | null
          calendar_event_id: string | null
          created_at: string
          due_date: string | null
          due_time: string | null
          email: string[] | null
          id: string
          inbox_ref: string | null
          is_meeting_context: boolean | null
          parent_task_id: string | null
          person: string[] | null
          priority: string | null
          project_tag: string | null
          reassigned_from: string | null
          reassigned_reason: string | null
          recurrence: string | null
          recurrence_custom: string | null
          status: string
          task: string
          task_id: string
          team: string | null
          updated_at: string
          user_id: string
          waiting_since: string | null
        }
        Insert: {
          blocked_by?: string[] | null
          blocks?: string[] | null
          calendar_event_id?: string | null
          created_at?: string
          due_date?: string | null
          due_time?: string | null
          email?: string[] | null
          id?: string
          inbox_ref?: string | null
          is_meeting_context?: boolean | null
          parent_task_id?: string | null
          person?: string[] | null
          priority?: string | null
          project_tag?: string | null
          reassigned_from?: string | null
          reassigned_reason?: string | null
          recurrence?: string | null
          recurrence_custom?: string | null
          status?: string
          task: string
          task_id: string
          team?: string | null
          updated_at?: string
          user_id: string
          waiting_since?: string | null
        }
        Update: {
          blocked_by?: string[] | null
          blocks?: string[] | null
          calendar_event_id?: string | null
          created_at?: string
          due_date?: string | null
          due_time?: string | null
          email?: string[] | null
          id?: string
          inbox_ref?: string | null
          is_meeting_context?: boolean | null
          parent_task_id?: string | null
          person?: string[] | null
          priority?: string | null
          project_tag?: string | null
          reassigned_from?: string | null
          reassigned_reason?: string | null
          recurrence?: string | null
          recurrence_custom?: string | null
          status?: string
          task?: string
          task_id?: string
          team?: string | null
          updated_at?: string
          user_id?: string
          waiting_since?: string | null
        }
        Relationships: []
      }
      archive: {
        Row: {
          archived_at: string
          completion_note: string | null
          completion_note_type: string | null
          completion_tags_person: string | null
          completion_tags_project_tag: string | null
          completion_tags_team: string | null
          created_at: string | null
          due_date: string | null
          id: string
          inbox_ref: string | null
          parent_task_id: string | null
          person: string[] | null
          priority: string | null
          project_tag: string | null
          recurrence: string | null
          spawned_task_ids: string[] | null
          status: string | null
          task: string | null
          task_id: string
          team: string | null
          user_id: string
          visible_in: string[] | null
        }
        Insert: {
          archived_at?: string
          completion_note?: string | null
          completion_note_type?: string | null
          completion_tags_person?: string | null
          completion_tags_project_tag?: string | null
          completion_tags_team?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          inbox_ref?: string | null
          parent_task_id?: string | null
          person?: string[] | null
          priority?: string | null
          project_tag?: string | null
          recurrence?: string | null
          spawned_task_ids?: string[] | null
          status?: string | null
          task?: string | null
          task_id: string
          team?: string | null
          user_id: string
          visible_in?: string[] | null
        }
        Update: {
          archived_at?: string
          completion_note?: string | null
          completion_note_type?: string | null
          completion_tags_person?: string | null
          completion_tags_project_tag?: string | null
          completion_tags_team?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          inbox_ref?: string | null
          parent_task_id?: string | null
          person?: string[] | null
          priority?: string | null
          project_tag?: string | null
          recurrence?: string | null
          spawned_task_ids?: string[] | null
          status?: string | null
          task?: string | null
          task_id?: string
          team?: string | null
          user_id?: string
          visible_in?: string[] | null
        }
        Relationships: []
      }
      calendar_tokens: {
        Row: {
          access_token: string
          calendar_email: string | null
          created_at: string
          expires_at: string
          id: string
          provider: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_email?: string | null
          created_at?: string
          expires_at: string
          id?: string
          provider?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_email?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          id: string
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      decisions: {
        Row: {
          context: string | null
          created_at: string
          decision_id: string
          decision_text: string
          id: string
          is_meeting_context: boolean | null
          person: string[] | null
          project_tag: string | null
          source: string | null
          superseded_by_id: string | null
          supersedes_id: string | null
          team: string | null
          user_id: string
          visible_in: string[] | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          decision_id: string
          decision_text: string
          id?: string
          is_meeting_context?: boolean | null
          person?: string[] | null
          project_tag?: string | null
          source?: string | null
          superseded_by_id?: string | null
          supersedes_id?: string | null
          team?: string | null
          user_id: string
          visible_in?: string[] | null
        }
        Update: {
          context?: string | null
          created_at?: string
          decision_id?: string
          decision_text?: string
          id?: string
          is_meeting_context?: boolean | null
          person?: string[] | null
          project_tag?: string | null
          source?: string | null
          superseded_by_id?: string | null
          supersedes_id?: string | null
          team?: string | null
          user_id?: string
          visible_in?: string[] | null
        }
        Relationships: []
      }
      inbox: {
        Row: {
          blocked_by_desc: string | null
          calendar_event_title: string | null
          created_at: string
          due_date: string | null
          due_is_vague: boolean | null
          due_time: string | null
          feedback_detail: string | null
          gemini_feedback: string | null
          id: string
          inbox_id: string
          invite_person: boolean | null
          is_meeting_context: boolean | null
          master_log_ref: string | null
          parsed_text: string | null
          person: string[] | null
          person_collision: boolean | null
          person_is_new: boolean | null
          priority: string | null
          project_tag: string | null
          raw_fragment: string | null
          status: string
          team: string | null
          team_is_new: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          blocked_by_desc?: string | null
          calendar_event_title?: string | null
          created_at?: string
          due_date?: string | null
          due_is_vague?: boolean | null
          due_time?: string | null
          feedback_detail?: string | null
          gemini_feedback?: string | null
          id?: string
          inbox_id: string
          invite_person?: boolean | null
          is_meeting_context?: boolean | null
          master_log_ref?: string | null
          parsed_text?: string | null
          person?: string[] | null
          person_collision?: boolean | null
          person_is_new?: boolean | null
          priority?: string | null
          project_tag?: string | null
          raw_fragment?: string | null
          status?: string
          team?: string | null
          team_is_new?: boolean | null
          type?: string
          user_id: string
        }
        Update: {
          blocked_by_desc?: string | null
          calendar_event_title?: string | null
          created_at?: string
          due_date?: string | null
          due_is_vague?: boolean | null
          due_time?: string | null
          feedback_detail?: string | null
          gemini_feedback?: string | null
          id?: string
          inbox_id?: string
          invite_person?: boolean | null
          is_meeting_context?: boolean | null
          master_log_ref?: string | null
          parsed_text?: string | null
          person?: string[] | null
          person_collision?: boolean | null
          person_is_new?: boolean | null
          priority?: string | null
          project_tag?: string | null
          raw_fragment?: string | null
          status?: string
          team?: string | null
          team_is_new?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_master_log_ref_fkey"
            columns: ["master_log_ref"]
            isOneToOne: false
            referencedRelation: "master_log"
            referencedColumns: ["id"]
          },
        ]
      }
      master_log: {
        Row: {
          created_at: string
          id: string
          inbox_refs: string[] | null
          processed_by: string
          raw_text: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inbox_refs?: string[] | null
          processed_by?: string
          raw_text: string
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inbox_refs?: string[] | null
          processed_by?: string
          raw_text?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      meeting_log: {
        Row: {
          actual_end: string | null
          auto_summary: string | null
          decisions_made: string[] | null
          duration_minutes: number | null
          id: string
          keywords: string[] | null
          meeting_id: string
          meeting_title: string | null
          open_items_carried_forward: string[] | null
          post_meeting_note_added: boolean | null
          projects: string[] | null
          scheduled_end: string | null
          scheduled_start: string | null
          tasks_discussed: string[] | null
          teams: string[] | null
          user_id: string
          voice_note: string | null
          was_manually_ended: boolean | null
        }
        Insert: {
          actual_end?: string | null
          auto_summary?: string | null
          decisions_made?: string[] | null
          duration_minutes?: number | null
          id?: string
          keywords?: string[] | null
          meeting_id: string
          meeting_title?: string | null
          open_items_carried_forward?: string[] | null
          post_meeting_note_added?: boolean | null
          projects?: string[] | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          tasks_discussed?: string[] | null
          teams?: string[] | null
          user_id: string
          voice_note?: string | null
          was_manually_ended?: boolean | null
        }
        Update: {
          actual_end?: string | null
          auto_summary?: string | null
          decisions_made?: string[] | null
          duration_minutes?: number | null
          id?: string
          keywords?: string[] | null
          meeting_id?: string
          meeting_title?: string | null
          open_items_carried_forward?: string[] | null
          post_meeting_note_added?: boolean | null
          projects?: string[] | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          tasks_discussed?: string[] | null
          teams?: string[] | null
          user_id?: string
          voice_note?: string | null
          was_manually_ended?: boolean | null
        }
        Relationships: []
      }
      task_audit: {
        Row: {
          created_at: string
          edit_source: string | null
          field: string
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edit_source?: string | null
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          edit_source?: string | null
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: []
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
