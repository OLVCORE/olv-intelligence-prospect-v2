import React from "react";
import APICard, { APIStatus } from "./APICard";

export type APIItem = {
  name: string;
  status: APIStatus;
  cost: string;
  uptime: number;
  logo?: React.ReactNode;
};

export const API_STATUS: {
  critical: APIItem[];
  highPriority: APIItem[];
  complementary: APIItem[];
} = {
  critical: [
    { name: 'ReceitaWS', status: 'active', cost: 'R$ 49-199/mês', uptime: 99.9, logo: '🏢' },
    { name: 'Apollo.io', status: 'active', cost: 'US$ 49-149/mês', uptime: 99.5, logo: '🚀' },
    { name: 'OpenAI', status: 'active', cost: 'US$ 20-200/mês', uptime: 99.8, logo: '🤖' },
    { name: 'Lovable AI', status: 'active', cost: 'Incluído', uptime: 100, logo: '💜' },
    { name: 'Google Places', status: 'active', cost: 'US$ 0-200/mês', uptime: 99.9, logo: '📍' },
    { name: 'Serper', status: 'active', cost: 'US$ 50/mês', uptime: 99.7, logo: '🔍' },
    { name: 'EmpresaQui', status: 'active', cost: 'R$ 99-299/mês', uptime: 98.5, logo: '📊' },
  ],
  highPriority: [
    { name: 'Serasa Experian', status: 'inactive', cost: 'R$ 500-2000/mês', uptime: 0, logo: '🛡️' },
    { name: 'JusBrasil API', status: 'inactive', cost: 'R$ 300-1500/mês', uptime: 0, logo: '⚖️' },
    { name: 'Econodata', status: 'inactive', cost: 'R$ 400-1200/mês', uptime: 0, logo: '💰' },
    { name: 'Hunter.io', status: 'active', cost: 'US$ 49-399/mês', uptime: 99.6, logo: '📧' },
    { name: 'Mapbox', status: 'active', cost: 'US$ 0-50/mês', uptime: 99.9, logo: '🗺️' },
    { name: 'Twilio Voice', status: 'active', cost: 'US$ 0.013/min', uptime: 99.95, logo: '📞' },
    { name: 'Twilio WhatsApp', status: 'active', cost: 'US$ 0.005/msg', uptime: 99.95, logo: '💬' },
    { name: 'Resend Email', status: 'active', cost: 'US$ 20-80/mês', uptime: 99.8, logo: '✉️' },
  ],
  complementary: [
    { name: 'PhantomBuster', status: 'active', cost: 'US$ 69-439/mês', uptime: 99.0, logo: '👻' },
    { name: 'CVM/B3', status: 'inactive', cost: 'Gratuito', uptime: 0, logo: '📈' },
    { name: 'Open Banking', status: 'inactive', cost: 'Gratuito', uptime: 0, logo: '🏦' },
    { name: 'Reclame Aqui', status: 'inactive', cost: 'R$ 200-800/mês', uptime: 0, logo: '📢' },
    { name: 'CEIS/CNEP', status: 'inactive', cost: 'Gratuito', uptime: 0, logo: '🚫' },
    { name: 'Google Analytics', status: 'inactive', cost: 'Gratuito', uptime: 0, logo: '📊' },
    { name: 'Boa Vista SCPC', status: 'inactive', cost: 'R$ 600-2500/mês', uptime: 0, logo: '🔒' },
    { name: 'Receita Federal', status: 'inactive', cost: 'Gratuito', uptime: 0, logo: '🇧🇷' },
  ],
};

export function APIManagementGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">APIs Críticas</h3>
        {API_STATUS.critical.map((api) => (
          <APICard key={api.name} {...api} />
        ))}
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">APIs Alta Prioridade</h3>
        {API_STATUS.highPriority.map((api) => (
          <APICard key={api.name} {...api} />
        ))}
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">APIs Complementares</h3>
        {API_STATUS.complementary.map((api) => (
          <APICard key={api.name} {...api} />
        ))}
      </div>
    </div>
  );
}

export default APIManagementGrid;
