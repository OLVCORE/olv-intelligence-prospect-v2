import React from "react";
import APICard, { APIStatus } from "./APICard";

export type APIItem = {
  name: string;
  status: APIStatus;
  cost: string;
  uptime: number;
  logo?: React.ReactNode;
  signupUrl?: string;
  apiKey?: string;
  envVarName?: string;
};

export const API_STATUS: {
  critical: APIItem[];
  highPriority: APIItem[];
  complementary: APIItem[];
} = {
  critical: [
    { name: 'ReceitaWS', status: 'active', cost: 'R$ 49-199/mês', uptime: 99.9, logo: '🏢', signupUrl: 'https://receitaws.com.br', apiKey: '7126••••••••9886', envVarName: 'RECEITAWS_API_TOKEN' },
    { name: 'Apollo.io', status: 'active', cost: 'US$ 49-149/mês', uptime: 99.5, logo: '🚀', signupUrl: 'https://apollo.io', apiKey: 'TiwP••••••••57GQ', envVarName: 'APOLLO_API_KEY' },
    { name: 'OpenAI', status: 'active', cost: 'US$ 20-200/mês', uptime: 99.8, logo: '🤖', signupUrl: 'https://platform.openai.com', apiKey: 'sk-p••••••••YwMA', envVarName: 'OPENAI_API_KEY' },
    { name: 'Lovable AI', status: 'active', cost: 'Incluído', uptime: 100, logo: '💜', signupUrl: 'https://lovable.dev', apiKey: 'sk_l••••••••Gw==', envVarName: 'LOVABLE_AI_KEY' },
    { name: 'Google Places', status: 'active', cost: 'US$ 0-200/mês', uptime: 99.9, logo: '📍', signupUrl: 'https://console.cloud.google.com', apiKey: 'AIza••••••••ua8E', envVarName: 'GOOGLE_PLACES_API_KEY' },
    { name: 'Serper', status: 'active', cost: 'US$ 50/mês', uptime: 99.7, logo: '🔍', signupUrl: 'https://serper.dev', apiKey: 'e3f0••••••••a6db', envVarName: 'SERPER_API_KEY' },
    { name: 'EmpresaQui', status: 'active', cost: 'R$ 99-299/mês', uptime: 98.5, logo: '📊', signupUrl: 'https://empresaqui.com.br', apiKey: 'a872••••••••c13f', envVarName: 'EMPRESAQUI_API_KEY' },
  ],
  highPriority: [
    { name: 'Serasa Experian', status: 'inactive', cost: 'R$ 500-2000/mês', uptime: 0, logo: '🛡️', signupUrl: 'https://www.serasaexperian.com.br' },
    { name: 'JusBrasil API', status: 'inactive', cost: 'R$ 300-1500/mês', uptime: 0, logo: '⚖️', signupUrl: 'https://api.jusbrasil.com.br' },
    { name: 'Econodata', status: 'inactive', cost: 'R$ 400-1200/mês', uptime: 0, logo: '💰', signupUrl: 'https://econodata.com.br' },
    { name: 'Hunter.io', status: 'active', cost: 'US$ 49-399/mês', uptime: 99.6, logo: '📧', signupUrl: 'https://hunter.io' },
    { name: 'Mapbox', status: 'active', cost: 'US$ 0-50/mês', uptime: 99.9, logo: '🗺️', signupUrl: 'https://account.mapbox.com' },
    { name: 'Twilio Voice', status: 'active', cost: 'US$ 0.013/min', uptime: 99.95, logo: '📞', signupUrl: 'https://www.twilio.com', apiKey: 'AC4e••••••••a9b6', envVarName: 'TWILIO_ACCOUNT_SID' },
    { name: 'Twilio WhatsApp', status: 'active', cost: 'US$ 0.005/msg', uptime: 99.95, logo: '💬', signupUrl: 'https://www.twilio.com', apiKey: 'f416••••••••501f', envVarName: 'TWILIO_AUTH_TOKEN' },
    { name: 'Resend Email', status: 'active', cost: 'US$ 20-80/mês', uptime: 99.8, logo: '✉️', signupUrl: 'https://resend.com' },
  ],
  complementary: [
    { name: 'PhantomBuster', status: 'active', cost: 'US$ 69-439/mês', uptime: 99.0, logo: '👻', signupUrl: 'https://phantombuster.com' },
    { name: 'CVM/B3', status: 'inactive', cost: 'Gratuito', uptime: 0, logo: '📈', signupUrl: 'https://www.gov.br' },
    { name: 'Open Banking', status: 'inactive', cost: 'Gratuito', uptime: 0, logo: '🏦', signupUrl: 'https://openbankingbrasil.org.br' },
    { name: 'Reclame Aqui', status: 'inactive', cost: 'R$ 200-800/mês', uptime: 0, logo: '📢', signupUrl: 'https://empresas.reclameaqui.com.br' },
    { name: 'CEIS/CNEP', status: 'inactive', cost: 'Gratuito', uptime: 0, logo: '🚫', signupUrl: 'https://portaldatransparencia.gov.br' },
    { name: 'Google Analytics', status: 'inactive', cost: 'Gratuito', uptime: 0, logo: '📊', signupUrl: 'https://analytics.google.com' },
    { name: 'Boa Vista SCPC', status: 'inactive', cost: 'R$ 600-2500/mês', uptime: 0, logo: '🔒', signupUrl: 'https://www.boavistaservicos.com.br' },
    { name: 'Receita Federal', status: 'inactive', cost: 'Gratuito', uptime: 0, logo: '🇧🇷', signupUrl: 'https://www.gov.br/receitafederal' },
  ],
};

export function APIManagementGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
          <h3 className="text-sm font-semibold tracking-tight">APIs Críticas</h3>
        </div>
        {API_STATUS.critical.map((api) => (
          <APICard key={api.name} {...api} onConfigure={() => console.log(`Configure ${api.name}`)} />
        ))}
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500" />
          <h3 className="text-sm font-semibold tracking-tight">APIs Alta Prioridade</h3>
        </div>
        {API_STATUS.highPriority.map((api) => (
          <APICard key={api.name} {...api} onConfigure={() => console.log(`Configure ${api.name}`)} />
        ))}
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
          <h3 className="text-sm font-semibold tracking-tight">APIs Complementares</h3>
        </div>
        {API_STATUS.complementary.map((api) => (
          <APICard key={api.name} {...api} onConfigure={() => console.log(`Configure ${api.name}`)} />
        ))}
      </div>
    </div>
  );
}

export default APIManagementGrid;
