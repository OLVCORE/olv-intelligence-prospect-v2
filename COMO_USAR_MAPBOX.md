# 🗺️ COMO USAR MAPBOX NO STRATEVO V2

## 📦 O QUE FOI CRIADO

**Arquivo:** `src/services/mapbox.ts`

Serviço completo com:
- ✅ Geocoding (endereço → coordenadas)
- ✅ Reverse Geocoding (coordenadas → endereço)
- ✅ Mapas estáticos (imagens)
- ✅ Mapas com múltiplos marcadores
- ✅ Cálculo de rotas
- ✅ Bounds para múltiplas localizações

---

## 🎯 USO SIMPLES

### **Inicialização**

```typescript
import { initMapbox, getMapbox } from './src/services/mapbox';

// No início do app (App.tsx ou main.tsx)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
initMapbox(MAPBOX_TOKEN);

// Depois, em qualquer lugar:
const mapbox = getMapbox();
```

---

## 🔍 GEOCODING

### **1. Endereço → Coordenadas**

```typescript
const mapbox = getMapbox();

const coords = await mapbox.geocode('Avenida Paulista, 1578, São Paulo, SP');

if (coords) {
  console.log(coords.latitude);   // -23.562049
  console.log(coords.longitude);  // -46.655654
  console.log(coords.place_name); // "Avenida Paulista 1578, São Paulo..."
}
```

### **2. Coordenadas → Endereço**

```typescript
const address = await mapbox.reverseGeocode(-46.6333, -23.5505);

if (address) {
  console.log(address.address);    // "Rua Santa Teresa"
  console.log(address.place_name); // "Rua Santa Teresa 25, São Paulo..."
}
```

### **3. Geocode Empresa Completa**

```typescript
const coords = await mapbox.geocodeCompany({
  logradouro: 'Avenida Braz Leme',
  numero: '1000',
  bairro: 'Santana',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '02022-000'
});

if (coords) {
  console.log(coords.lat, coords.lng);
}
```

---

## 🗺️ MAPAS ESTÁTICOS (IMAGENS)

### **1. Mapa Simples**

```typescript
const mapURL = mapbox.getStaticMapURL(
  -46.6333,  // longitude
  -23.5505,  // latitude
  14,        // zoom (1-20)
  600,       // width
  400        // height
);

// Use em <img src={mapURL} />
```

### **2. Múltiplos Marcadores**

```typescript
const locations = [
  { lng: -46.6333, lat: -23.5505, label: 'A' },
  { lng: -46.6500, lat: -23.5600, label: 'B' },
  { lng: -46.6400, lat: -23.5450, label: 'C' }
];

const mapURL = mapbox.getStaticMapWithMarkers(locations, 800, 600);

// Mapa com 3 pins A, B, C
```

---

## 🚗 ROTAS E DIREÇÕES

```typescript
const route = await mapbox.getDirections(
  [-46.6333, -23.5505],  // origem [lng, lat]
  [-46.6500, -23.5600],  // destino [lng, lat]
  'driving'              // 'driving' | 'walking' | 'cycling'
);

if (route) {
  console.log(`Distância: ${(route.distance / 1000).toFixed(2)} km`);
  console.log(`Duração: ${(route.duration / 60).toFixed(0)} minutos`);
  // route.geometry contém a geometria da rota
}
```

---

## 📐 BOUNDS (LIMITES)

```typescript
const companies = [
  { lng: -46.6333, lat: -23.5505 },
  { lng: -46.6500, lat: -23.5600 },
  { lng: -46.6400, lat: -23.5450 }
];

const bounds = mapbox.calculateBounds(companies);

// Use para ajustar o mapa para mostrar todas as empresas
console.log(bounds.southwest); // [-46.65, -23.56]
console.log(bounds.northeast); // [-46.6333, -23.545]
```

---

## 🎨 ESTILOS DE MAPA

```typescript
import { MAPBOX_STYLES } from './src/services/mapbox';

const config = mapbox.getMapConfig({
  style: MAPBOX_STYLES.dark,  // ou streets, light, satellite, etc.
  center: [-46.6333, -23.5505],
  zoom: 12
});
```

**Estilos disponíveis:**
- `streets` - Padrão, mostra ruas e prédios
- `light` - Claro, minimalista
- `dark` - Escuro, ideal para dashboards
- `outdoors` - Topográfico, com relevo
- `satellite` - Vista de satélite
- `satelliteStreets` - Satélite com ruas

---

## 🎯 CASOS DE USO NO STRATEVO

### **1. Visualizar Empresa no Mapa**

```typescript
async function mostrarEmpresaNoMapa(empresa: any) {
  const mapbox = getMapbox();
  
  // Geocode a empresa
  const coords = await mapbox.geocodeCompany({
    logradouro: empresa.logradouro,
    numero: empresa.numero,
    bairro: empresa.bairro,
    cidade: empresa.cidade,
    estado: empresa.estado
  });
  
  if (coords) {
    // Gera mapa estático
    const mapURL = mapbox.getStaticMapURL(
      coords.lng, 
      coords.lat, 
      15, 
      800, 
      400
    );
    
    return {
      coords,
      mapURL,
      endereco: `${empresa.logradouro}, ${empresa.numero} - ${empresa.cidade}/${empresa.estado}`
    };
  }
  
  return null;
}
```

### **2. Mapa de Prospects (Múltiplas Empresas)**

```typescript
async function mapaDeProspects(empresas: any[]) {
  const mapbox = getMapbox();
  
  // Geocode todas as empresas
  const locations = await Promise.all(
    empresas.map(async (emp, index) => {
      const coords = await mapbox.geocodeCompany({
        logradouro: emp.logradouro,
        numero: emp.numero,
        bairro: emp.bairro,
        cidade: emp.cidade,
        estado: emp.estado
      });
      
      return coords ? {
        ...coords,
        label: String(index + 1),
        empresa: emp
      } : null;
    })
  );
  
  const validLocations = locations.filter(loc => loc !== null);
  
  // Gera mapa com todos os pins
  const mapURL = mapbox.getStaticMapWithMarkers(
    validLocations.map(loc => ({
      lng: loc.lng,
      lat: loc.lat,
      label: loc.label
    })),
    1200,
    800
  );
  
  return {
    mapURL,
    empresas: validLocations,
    total: validLocations.length
  };
}
```

### **3. Calcular Distância Entre Empresa e SDR**

```typescript
async function calcularDistanciaVisita(
  empresaCoordenadas: [number, number],
  sdrCoordenadas: [number, number]
) {
  const mapbox = getMapbox();
  
  const route = await mapbox.getDirections(
    sdrCoordenadas,
    empresaCoordenadas,
    'driving'
  );
  
  if (route) {
    return {
      distancia: `${(route.distance / 1000).toFixed(1)} km`,
      tempo: `${Math.round(route.duration / 60)} min`,
      viavel: route.distance < 50000 // menos de 50km
    };
  }
  
  return null;
}
```

### **4. Heatmap de Prospects por Região**

```typescript
async function analisarRegiao(empresas: any[]) {
  const mapbox = getMapbox();
  
  // Agrupa por cidade
  const porCidade: Record<string, number> = {};
  
  empresas.forEach(emp => {
    const chave = `${emp.cidade}/${emp.estado}`;
    porCidade[chave] = (porCidade[chave] || 0) + 1;
  });
  
  // Encontra as top 5 cidades
  const top5 = Object.entries(porCidade)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  // Geocode as cidades
  const cidadesComCoords = await Promise.all(
    top5.map(async ([cidade, count]) => {
      const coords = await mapbox.geocode(`${cidade}, Brasil`);
      return coords ? {
        cidade,
        count,
        lat: coords.latitude,
        lng: coords.longitude
      } : null;
    })
  );
  
  return cidadesComCoords.filter(c => c !== null);
}
```

### **5. Validar Endereço da Empresa**

```typescript
async function validarEndereco(empresa: any): Promise<{
  valido: boolean;
  corrigido?: any;
  mensagem: string;
}> {
  const mapbox = getMapbox();
  
  const coords = await mapbox.geocodeCompany({
    logradouro: empresa.logradouro,
    numero: empresa.numero,
    bairro: empresa.bairro,
    cidade: empresa.cidade,
    estado: empresa.estado
  });
  
  if (!coords) {
    return {
      valido: false,
      mensagem: 'Endereço não encontrado no mapa'
    };
  }
  
  // Reverse geocode para obter endereço normalizado
  const enderecoNormalizado = await mapbox.reverseGeocode(coords.lng, coords.lat);
  
  return {
    valido: true,
    corrigido: {
      ...empresa,
      endereco_normalizado: enderecoNormalizado?.place_name,
      coordenadas: coords
    },
    mensagem: 'Endereço validado e geocodificado'
  };
}
```

---

## 🌍 CONSTANTES ÚTEIS

```typescript
import { 
  BRAZIL_CENTER, 
  SAO_PAULO_CENTER, 
  RIO_CENTER 
} from './src/services/mapbox';

// Centros pré-definidos
BRAZIL_CENTER      // [-47.9292, -15.7801] - Centro do Brasil
SAO_PAULO_CENTER   // [-46.6333, -23.5505] - São Paulo
RIO_CENTER         // [-43.1729, -22.9068] - Rio de Janeiro
```

---

## 📊 EXEMPLO COMPLETO: COMPONENTE REACT

```typescript
import { useEffect, useState } from 'react';
import { getMapbox } from './services/mapbox';

function MapaEmpresa({ empresa }: { empresa: any }) {
  const [mapURL, setMapURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadMap() {
      const mapbox = getMapbox();
      
      const coords = await mapbox.geocodeCompany({
        logradouro: empresa.logradouro,
        numero: empresa.numero,
        bairro: empresa.bairro,
        cidade: empresa.cidade,
        estado: empresa.estado
      });
      
      if (coords) {
        const url = mapbox.getStaticMapURL(
          coords.lng,
          coords.lat,
          15,
          600,
          400
        );
        setMapURL(url);
      }
      
      setLoading(false);
    }
    
    loadMap();
  }, [empresa]);
  
  if (loading) return <div>Carregando mapa...</div>;
  if (!mapURL) return <div>Não foi possível carregar o mapa</div>;
  
  return (
    <div className="map-container">
      <img 
        src={mapURL} 
        alt={`Mapa de ${empresa.nome}`}
        className="w-full rounded-lg shadow-lg"
      />
      <p className="mt-2 text-sm text-gray-600">
        {empresa.logradouro}, {empresa.numero} - {empresa.cidade}/{empresa.estado}
      </p>
    </div>
  );
}
```

---

## 🔧 CONFIGURAÇÃO AVANÇADA

### **Mapbox GL JS (Mapas Interativos)**

Para mapas totalmente interativos, instale:

```bash
npm install mapbox-gl
```

E use:

```typescript
import mapboxgl from 'mapbox-gl';
import { getMapbox } from './services/mapbox';

const mapbox = getMapbox();
const config = mapbox.getMapConfig();

mapboxgl.accessToken = config.accessToken;

const map = new mapboxgl.Map({
  container: 'map', // id do elemento HTML
  style: config.style,
  center: config.center,
  zoom: config.zoom
});

// Adicionar marcador
new mapboxgl.Marker()
  .setLngLat([-46.6333, -23.5505])
  .addTo(map);
```

---

## 📚 RECURSOS

- **Documentação:** https://docs.mapbox.com/
- **Exemplos:** https://docs.mapbox.com/mapbox-gl-js/example/
- **Playground:** https://docs.mapbox.com/playground/
- **Estilos:** https://docs.mapbox.com/api/maps/styles/

---

## 💰 LIMITES E PREÇOS

**Tier Gratuito:**
- 50.000 carregamentos de mapa/mês
- 100.000 geocoding requests/mês
- 5.000 rotas/mês

**Monitoramento:**
- Dashboard: https://account.mapbox.com/

---

## 🎯 RESULTADO NO STRATEVO

Com Mapbox integrado, você pode:

✅ Visualizar empresas no mapa  
✅ Criar mapas de prospects por região  
✅ Calcular rotas para visitas  
✅ Validar endereços  
✅ Analisar concentração geográfica  
✅ Priorizar prospects por proximidade  

---

**Criado em:** 03/11/2025  
**Status:** ✅ Testado e funcionando  
**Token:** Configurado e válido

