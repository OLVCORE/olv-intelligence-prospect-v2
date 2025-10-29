import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useState } from "react";

const mockData = Array.from({ length: 30 }).map((_, i) => ({ day: i + 1, uptime: 95 + Math.random() * 5 }));

export function APIHealthMonitor({ open, onOpenChange, apiName = "Apollo.io" }: { open: boolean; onOpenChange: (v: boolean) => void; apiName?: string; }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Saúde da API • {apiName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Uptime (últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="uptime" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Logs Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="rounded-md border p-2 bg-card">{new Date().toLocaleString('pt-BR')} • 200 OK • 320ms</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default APIHealthMonitor;
