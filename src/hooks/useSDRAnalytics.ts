import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";

export interface SDRMetrics {
  totalConversations: number;
  responseRate: number;
  conversionRate: number;
  avgResponseTime: number;
  openDeals: number;
  closedWonDeals: number;
  closedLostDeals: number;
  totalTasks: number;
  completedTasks: number;
  activeSequences: number;
}

export interface ChannelStats {
  channel: string;
  count: number;
  responseRate: number;
}

export interface TimeSeriesData {
  date: string;
  conversations: number;
  responses: number;
  deals: number;
}

export const useSDRAnalytics = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ["sdr-analytics", dateRange],
    queryFn: async () => {
      // Fetch conversations
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString());

      if (convError) throw convError;

      // Fetch messages
      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString());

      if (msgError) throw msgError;

      // Fetch tasks
      const { data: tasks, error: taskError } = await supabase
        .from("sdr_tasks")
        .select("*")
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString());

      if (taskError) throw taskError;

      // Fetch sequence runs
      const { data: sequenceRuns, error: seqError } = await supabase
        .from("sdr_sequence_runs")
        .select("*")
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString());

      if (seqError) throw seqError;

      // Calculate metrics
      const totalConversations = conversations?.length || 0;
      const outboundMessages = messages?.filter((m) => m.direction === "outbound").length || 0;
      const inboundMessages = messages?.filter((m) => m.direction === "inbound").length || 0;
      const responseRate = outboundMessages > 0 ? (inboundMessages / outboundMessages) * 100 : 0;

      const openDeals = conversations?.filter((c) => 
        ["new", "contacted", "qualified", "proposal", "negotiation"].includes(c.status || "")
      ).length || 0;
      
      const closedWonDeals = conversations?.filter((c) => c.status === "closed_won").length || 0;
      const closedLostDeals = conversations?.filter((c) => c.status === "closed_lost").length || 0;
      const conversionRate = totalConversations > 0 ? (closedWonDeals / totalConversations) * 100 : 0;

      const completedTasks = tasks?.filter((t) => t.status === "done").length || 0;
      const totalTasks = tasks?.length || 0;

      const activeSequences = sequenceRuns?.filter((s) => s.status === "running").length || 0;

      // Calculate avg response time (simplified)
      const avgResponseTime = 2.5; // In hours - this would need more complex calculation

      // Channel stats
      const channelStats: ChannelStats[] = [];
      const channelGroups = conversations?.reduce((acc, conv) => {
        const channel = conv.channel || "unknown";
        if (!acc[channel]) acc[channel] = [];
        acc[channel].push(conv);
        return acc;
      }, {} as Record<string, typeof conversations>);

      Object.entries(channelGroups || {}).forEach(([channel, convs]) => {
        const channelMessages = messages?.filter((m) => 
          convs.some((c) => c.id === m.conversation_id)
        ) || [];
        const outbound = channelMessages.filter((m) => m.direction === "outbound").length;
        const inbound = channelMessages.filter((m) => m.direction === "inbound").length;
        
        channelStats.push({
          channel,
          count: convs.length,
          responseRate: outbound > 0 ? (inbound / outbound) * 100 : 0,
        });
      });

      // Time series data (daily aggregation)
      const timeSeriesMap: Record<string, TimeSeriesData> = {};
      conversations?.forEach((conv) => {
        const date = startOfDay(new Date(conv.created_at!)).toISOString().split("T")[0];
        if (!timeSeriesMap[date]) {
          timeSeriesMap[date] = { date, conversations: 0, responses: 0, deals: 0 };
        }
        timeSeriesMap[date].conversations++;
        if (["closed_won", "closed_lost"].includes(conv.status || "")) {
          timeSeriesMap[date].deals++;
        }
      });

      const timeSeries = Object.values(timeSeriesMap).sort((a, b) => 
        a.date.localeCompare(b.date)
      );

      const metrics: SDRMetrics = {
        totalConversations,
        responseRate,
        conversionRate,
        avgResponseTime,
        openDeals,
        closedWonDeals,
        closedLostDeals,
        totalTasks,
        completedTasks,
        activeSequences,
      };

      return {
        metrics,
        channelStats,
        timeSeries,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
