export interface ApiInfo {
  name: string;
  version: string;
  home: string;
}

export interface AccountStatus {
  is_setup: boolean;
}

export interface LoginResponse {
  message: string;
}

export const DeploymentStatus = {
  CREATED: 0,
  BUILT: 1,
  DEPLOYING: 2,
  DEPLOYED: 3,
  STOPPING: 4,
  STOPPED: 5,
  DELETED: 6,
} as const;

export type DeploymentStatus =
  (typeof DeploymentStatus)[keyof typeof DeploymentStatus];

export const DEPLOYMENT_STATUS_LABELS: Record<number, string> = {
  [DeploymentStatus.CREATED]: "Created",
  [DeploymentStatus.BUILT]: "Built",
  [DeploymentStatus.DEPLOYING]: "Deploying",
  [DeploymentStatus.DEPLOYED]: "Deployed",
  [DeploymentStatus.STOPPING]: "Stopping",
  [DeploymentStatus.STOPPED]: "Stopped",
  [DeploymentStatus.DELETED]: "Deleted",
};

export interface ChainConfig {
  chain: string;
  ledger_config: {
    rpc: string;
    type: string;
    chain: string;
  };
  chain_data: {
    instances?: string[];
    token?: number;
    multisig?: string;
    on_chain_state?: number;
    staked?: boolean;
    user_params?: {
      staking_program_id?: string;
      nft?: string;
      cost_of_bond?: number;
      threshold?: number;
      use_staking?: boolean;
    };
  };
}

export interface ServiceSummary {
  service_config_id: string;
  name: string;
  hash: string;
  home_chain: string;
  chain_configs: Record<string, ChainConfig>;
  description?: string;
  service_public_id?: string;
  env_variables?: Record<string, { value: string; provision_type: string }>;
}

export interface DeploymentInfo {
  status: DeploymentStatus;
  nodes: Record<string, { agent: string[]; tendermint: string[] }>;
  healthcheck?: HealthcheckData | null;
}

export interface HealthcheckData {
  seconds_since_last_transition?: number;
  is_transitioning_fast?: boolean;
  current_round?: string;
  period?: number;
  round_sequence?: string[];
  healthy_round_count?: number;
}

export interface TradeEntry {
  market: string;
  title?: string;
  side?: string;
  amount?: number;
  status?: string;
  profit?: number;
  creation_timestamp?: number;
  outcome_timestamp?: number;
}

export interface AgentPerformance {
  timestamp: number | null;
  metrics: PerformanceMetric[];
  last_activity: string | null;
  last_chat_message: string | null;
  profit_over_time?: ProfitEntry[];
  trades?: TradeEntry[];
  total_profit?: number;
  accuracy?: number;
  roi?: number;
}

export interface PerformanceMetric {
  name: string;
  value: string | number;
  unit?: string;
}

export interface ProfitEntry {
  timestamp: number;
  profit: number;
}

export interface FundingRequirement {
  chain: string;
  address: string;
  asset: string;
  balance: number;
  required: number;
  shortfall: number;
  agent_funding_requests_cooldown?: number;
}

export interface WalletInfo {
  address: string;
  ledger_type: string;
  safes?: Record<string, string>;
  safe_chains?: string[];
}

export interface ExtendedWalletInfo extends WalletInfo {
  balances?: Record<string, Record<string, number>>;
  safe_balances?: Record<string, Record<string, Record<string, number>>>;
}
