// src/hooks/useSupabaseRealtime.ts
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseRealtimeOptions<T = any> {
  /** Query key to invalidate or update when realtime event fires */
  queryKey: string | readonly unknown[];
  
  /** Table to listen to */
  table: string;
  
  /** Event types to listen for ('INSERT' | 'UPDATE' | 'DELETE' | '*') */
  events?: '*' | 'INSERT' | 'UPDATE' | 'DELETE' | ('INSERT' | 'UPDATE' | 'DELETE')[];
  
  /** Optional filter (e.g., `user_id=eq.${userId}`) */
  filter?: string;
  
  /** Schema (default: 'public') */
  schema?: string;
  
  /** Whether to invalidate the whole query or do optimistic updates */
  invalidate?: boolean;
  
  /** Custom handler for the payload (useful for optimistic updates) */
  onEvent?: (payload: any) => void;
  
  /** Enable/disable the subscription */
  enabled?: boolean;
}

/**
 * Production-ready Supabase Realtime hook with React Query integration
 * 
 * Features:
 * - Automatic cleanup
 * - Query invalidation + optional optimistic updates
 * - Support for filters
 * - Safe for multiple components
 */
export function useSupabaseRealtime<T = any>({
  queryKey,
  table,
  events = '*',
  filter,
  schema = 'public',
  invalidate = true,
  onEvent,
  enabled = true,
}: UseSupabaseRealtimeOptions<T>) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handlePayload = useCallback((payload: any) => {
    console.log(`[Realtime] ${payload.eventType} on ${table}:`, payload);

    // Custom handler first (for optimistic updates)
    if (onEvent) {
      onEvent(payload);
      return;
    }

    // Default: invalidate query
    if (invalidate) {
      queryClient.invalidateQueries({ 
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] 
      });
    }
  }, [queryClient, queryKey, invalidate, onEvent]);

  useEffect(() => {
    if (!enabled || !supabase) return;

    // Prevent duplicate subscriptions
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `realtime:${table}${filter ? `:${filter}` : ''}`;

    const channel = supabase.channel(channelName);

    const eventList = Array.isArray(events) ? events : [events];

    eventList.forEach(event => {
      let subscription = channel
        .on(
          'postgres_changes',
          {
            event,
            schema,
            table,
            ...(filter && { filter }),
          },
          handlePayload
        );
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Realtime subscribed to ${table} (${eventList.join(', ')})`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Realtime error on ${table}`);
      }
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log(`🧹 Realtime unsubscribed from ${table}`);
      }
    };
  }, [table, schema, filter, events, handlePayload, enabled]);
}