# Cockpit EBV — Frontend React

> Aplicação ReactJS com Clean Architecture para monitoramento end-to-end dos processos de dados da EBV.

---

## Stack

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18 | UI Framework |
| TypeScript | 5.x | Strict mode, sem `any` |
| Vite | 5.x | Build tool |
| Material UI | 6.x | Componentes UI |
| Redux Toolkit | 2.x | State management |
| React Router | 6.x | Roteamento |
| Recharts | 2.x | Gráficos e séries temporais |

---

## Arquitetura (Clean Architecture)

```
src/
├── domain/              ← Entidades e interfaces (sem dependências externas)
│   ├── entities/        ← Types: ScoreMetric, Alert, BatchJob, etc.
│   └── repositories/    ← Interfaces: IDashboardRepository, IScoreRepository...
│
├── data/                ← Implementações concretas (Mock API)
│   ├── mock/            ← mockData.ts — dados realistas simulados
│   └── repositories/    ← MockDashboardRepository, MockScoreRepository...
│
├── app/                 ← Redux store + slices
│   ├── store.ts
│   └── slices/          ← dashboardSlice, scoreSlice, alertSlice, batchSlice, lineageSlice
│
├── presentation/        ← UI (React components)
│   ├── layout/          ← AppLayout, Sidebar, TopBar
│   ├── pages/           ← DashboardPage, ScoreMonitorPage, AlertsPage...
│   └── components/      ← KpiCard, HealthRing, SeverityChip, StatusBadge...
│
├── theme.ts             ← MUI theme (Design System Equifax)
├── App.tsx              ← React Router config
└── main.tsx             ← Entry point
```

---

## Páginas (5 EPICs do MVP)

| Rota | Página | Épico |
|------|--------|-------|
| `/dashboard` | Dashboard Consolidado | EP-01 |
| `/score` | Score Monitor | EP-02 |
| `/alerts` | Central de Alertas | EP-03 |
| `/batch` | Batch Monitor | EP-04 |
| `/lineage` | Rastreabilidade | EP-05 |

---

## Como executar

```bash
# Instalar dependências
npm install

# Iniciar em desenvolvimento (porta 3000)
npm run dev

# Build de produção
npm run build

# Testes
npm test
```

---

## Mock API

Os dados são simulados em `src/data/mock/mockData.ts` com cenários realistas:
- **Score zerado**: MDL-003 com 10.3% de registros zerados (causa: falha ETL-047)
- **Alertas críticos**: 3 alertas críticos abertos
- **Jobs com falha**: ETL-047 falhado, BATCH-092 com atraso de SLA
- **Pipelines**: Pipeline de Fraude Transacional falho, de Crédito PF com sucesso

Para trocar para API real, basta implementar os repositórios em `src/data/repositories/` com chamadas HTTP reais e substituir no `app/slices/*.ts`.

---

## Design System

O tema MUI em `src/theme.ts` implementa os tokens do Design System Equifax:
- **Primary**: `#E31837` (Equifax Red)
- **Secondary**: `#0066CC` (Equifax Blue)  
- **Background**: `#0B0F1A` (dark surface)
- **Font**: Inter
- **Severity colors**: Critical → Red, High → Amber, Medium → Yellow, Healthy → Green

---

## Próximos passos

1. Conectar à API real (substituir `Mock*Repository` por `Http*Repository`)
2. Implementar autenticação (JWT/SSO EBV)
3. Adicionar testes unitários (Jest + React Testing Library)
4. Configurar CI/CD pipeline
5. Integrar Agente Sentinela (Fase 2 — Cognitiva)
