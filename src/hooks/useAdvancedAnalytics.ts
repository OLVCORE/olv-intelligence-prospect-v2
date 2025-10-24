import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';

interface AdvancedMetrics {
  // Pipeline Health
  totalPipelineValue: number;
  weightedPipelineValue: number;
  averageDealSize: number;
  averageDealAge: number;
  
  // Conversion Metrics
  overallConversionRate: number;
  conversionByStage: Record<string, number>;
  averageSalesCycle: number;
  
  // Performance
  winRate: number;
  lossRate: number;
  activeDeals: number;
  closedWonThisMonth: number;
  closedWonValue: number;
  
  // Velocity
  dealsCreatedThisMonth: number;
  dealsClosedThisMonth: number;
  averageTimeToClose: number;
  
  // Risk Analysis
  staleDealCount: number;
  atRiskDeals: number;
  highValueDeals: number;
}

interface SDRPerformance {
  sdrId: string;
  sdrName: string;
  activeDeals: number;
  totalValue: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  avgDealSize: number;
  avgTimeToClose: number;
}

interface TimeSeriesData {
  date: string;
  pipelineValue: number;
  dealsCreated: number;
  dealsClosed: number;
  dealsWon: number;
  dealsLost: number;
}

export function useAdvancedAnalytics() {
  return useQuery({
    queryKey: ['advanced-analytics'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const last3Months = subMonths(now, 3);

      // Fetch all deals
      const { data: allDeals } = await supabase
        .from('sdr_deals')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch this month's deals
      const { data: thisMonthDeals } = await supabase
        .from('sdr_deals')
        .select('*')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const deals = allDeals || [];
      const monthDeals = thisMonthDeals || [];

      // Calculate Advanced Metrics
      const openDeals = deals.filter(d => d.status === 'open');
      const closedDeals = deals.filter(d => d.status !== 'open');
      const wonDeals = deals.filter(d => d.status === 'won');
      const lostDeals = deals.filter(d => d.status === 'lost');

      const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const weightedPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0) * (d.probability || 0) / 100, 0);
      const averageDealSize = deals.length > 0 ? deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length : 0;

      // Deal age
      const dealAges = openDeals.map(d => differenceInDays(now, new Date(d.created_at)));
      const averageDealAge = dealAges.length > 0 ? dealAges.reduce((sum, age) => sum + age, 0) / dealAges.length : 0;

      // Conversion metrics
      const conversionRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;
      const winRate = closedDeals.length > 0 ? (wonDeals.length / closedDeals.length) * 100 : 0;
      const lossRate = closedDeals.length > 0 ? (lostDeals.length / closedDeals.length) * 100 : 0;

      // Time to close
      const closedWithTime = wonDeals.filter(d => d.created_at && d.updated_at);
      const avgTimeToClose = closedWithTime.length > 0
        ? closedWithTime.reduce((sum, d) => sum + differenceInDays(new Date(d.updated_at!), new Date(d.created_at)), 0) / closedWithTime.length
        : 0;

      // This month metrics
      const wonThisMonth = monthDeals.filter(d => d.status === 'won');
      const closedWonValue = wonThisMonth.reduce((sum, d) => sum + (d.value || 0), 0);

      // Risk analysis
      const staleDealCount = openDeals.filter(d => {
        const daysInStage = differenceInDays(now, new Date(d.updated_at || d.created_at));
        return daysInStage > 7;
      }).length;

      const atRiskDeals = openDeals.filter(d => {
        const daysToClose = d.expected_close_date 
          ? differenceInDays(new Date(d.expected_close_date), now)
          : null;
        return daysToClose !== null && daysToClose < 7 && daysToClose > 0;
      }).length;

      const highValueDeals = openDeals.filter(d => d.value > 100000).length;

      // Conversion by stage
      const stageGroups = deals.reduce((acc, d) => {
        acc[d.stage] = acc[d.stage] || [];
        acc[d.stage].push(d);
        return acc;
      }, {} as Record<string, any[]>);

      const conversionByStage: Record<string, number> = {};
      Object.entries(stageGroups).forEach(([stage, stageDeals]) => {
        const won = stageDeals.filter(d => d.status === 'won').length;
        conversionByStage[stage] = stageDeals.length > 0 ? (won / stageDeals.length) * 100 : 0;
      });

      const metrics: AdvancedMetrics = {
        totalPipelineValue,
        weightedPipelineValue,
        averageDealSize,
        averageDealAge,
        overallConversionRate: conversionRate,
        conversionByStage,
        averageSalesCycle: avgTimeToClose,
        winRate,
        lossRate,
        activeDeals: openDeals.length,
        closedWonThisMonth: wonThisMonth.length,
        closedWonValue,
        dealsCreatedThisMonth: monthDeals.length,
        dealsClosedThisMonth: monthDeals.filter(d => d.status !== 'open').length,
        averageTimeToClose: avgTimeToClose,
        staleDealCount,
        atRiskDeals,
        highValueDeals
      };

      // SDR Performance (mock - em produção viria de user_id)
      const sdrPerformance: SDRPerformance[] = [
        {
          sdrId: '1',
          sdrName: 'Time SDR',
          activeDeals: openDeals.length,
          totalValue: totalPipelineValue,
          wonDeals: wonDeals.length,
          lostDeals: lostDeals.length,
          winRate: winRate,
          avgDealSize: averageDealSize,
          avgTimeToClose: avgTimeToClose
        }
      ];

      // Time series (últimos 30 dias)
      const timeSeries: TimeSeriesData[] = [];
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayDeals = deals.filter(d => {
          const dealDate = new Date(d.created_at).toISOString().split('T')[0];
          return dealDate === dateStr;
        });

        timeSeries.push({
          date: dateStr,
          pipelineValue: dayDeals.reduce((sum, d) => sum + (d.value || 0), 0),
          dealsCreated: dayDeals.length,
          dealsClosed: dayDeals.filter(d => d.status !== 'open').length,
          dealsWon: dayDeals.filter(d => d.status === 'won').length,
          dealsLost: dayDeals.filter(d => d.status === 'lost').length
        });
      }

      return {
        metrics,
        sdrPerformance,
        timeSeries
      };
    },
    refetchInterval: 60000 // Atualiza a cada minuto
  });
}
