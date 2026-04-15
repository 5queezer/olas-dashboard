import { api } from "./client";
import type {
  AccountStatus,
  AgentPerformance,
  ApiInfo,
  DeploymentInfo,
  ExtendedWalletInfo,
  FundingRequirement,
  LoginResponse,
  ServiceSummary,
  WalletInfo,
} from "./types";

export const queries = {
  apiInfo: {
    queryKey: ["api-info"],
    queryFn: () => api.get<ApiInfo>("/api"),
  },
  account: {
    queryKey: ["account"],
    queryFn: () => api.get<AccountStatus>("/api/account"),
  },
  services: {
    queryKey: ["services"],
    queryFn: () => api.get<ServiceSummary[]>("/api/v2/services"),
  },
  service: (id: string) => ({
    queryKey: ["service", id],
    queryFn: () => api.get<ServiceSummary>(`/api/v2/service/${id}`),
  }),
  deployment: (id: string) => ({
    queryKey: ["deployment", id],
    queryFn: () => api.get<DeploymentInfo>(`/api/v2/service/${id}/deployment`),
  }),
  agentPerformance: (id: string) => ({
    queryKey: ["agent-performance", id],
    queryFn: () =>
      api.get<AgentPerformance>(`/api/v2/service/${id}/agent_performance`),
  }),
  fundingRequirements: (id: string) => ({
    queryKey: ["funding-requirements", id],
    queryFn: () =>
      api.get<FundingRequirement[]>(
        `/api/v2/service/${id}/funding_requirements`,
      ),
  }),
  wallet: {
    queryKey: ["wallet"],
    queryFn: () => api.get<WalletInfo[]>("/api/wallet"),
  },
  walletExtended: {
    queryKey: ["wallet-extended"],
    queryFn: () => api.get<ExtendedWalletInfo[]>("/api/wallet/extended"),
  },
};

export const mutations = {
  login: (password: string) =>
    api.post<LoginResponse>("/api/account/login", { password }),
  deployService: (id: string) =>
    api.post<ServiceSummary>(`/api/v2/service/${id}`),
  stopService: (id: string) =>
    api.post<DeploymentInfo>(`/api/v2/service/${id}/deployment/stop`),
};
