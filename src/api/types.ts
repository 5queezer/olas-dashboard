export interface ApiInfo {
  name: string;
  version: string;
  home: string;
}

export interface MiddlewareVersionInfo {
  installed: string;
  latest: {
    version: string;
    published_at: string;
    html_url: string;
  } | null;
  is_outdated: boolean | null;
  checked_at: string | null;
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

export interface HealthcheckData {
  seconds_since_last_transition?: number;
  is_transitioning_fast?: boolean;
  is_tm_healthy?: boolean;
  is_healthy?: boolean;
  period?: number;
  rounds?: string[];
  reset_pause_duration?: number;
  agent_health?: {
    is_making_on_chain_transactions?: boolean;
    is_mech_reliable?: boolean;
    is_staking_kpi_met?: boolean;
    has_required_funds?: boolean;
    staking_status?: string;
  };
}

export interface DeploymentInfo {
  status: DeploymentStatus;
  nodes: { agent: string[]; tendermint: string[] };
  healthcheck?: HealthcheckData | null;
}

// Agent Performance API response
export interface PredictionItem {
  id: string;
  market: {
    id: string;
    title: string;
    external_url?: string;
  };
  prediction_side: string;
  bet_amount: number;
  status: string;
  net_profit: number;
  total_payout: number;
  created_at: string;
  settled_at: string | null;
}

export interface ProfitDataPoint {
  date: string;
  timestamp: number;
  daily_profit: number;
  cumulative_profit: number;
  daily_mech_requests: number;
  daily_profit_raw: number;
}

export interface PerformanceMetric {
  name: string;
  value: string | number;
  is_primary?: boolean;
  description?: string;
}

export interface AgentPerformance {
  timestamp: number | null;
  agent_behavior?: string;
  agent_details?: {
    id: string;
    created_at: string;
    last_active_at: string;
  };
  agent_performance?: {
    window: string;
    currency: string;
    metrics: {
      all_time_funds_used: number;
      all_time_profit: number;
      funds_locked_in_markets: number;
      available_funds: number;
      roi: number;
      settled_mech_request_count: number;
      total_mech_request_count: number;
      open_mech_request_count: number;
      placed_mech_request_count: number;
      unplaced_mech_request_count: number;
    };
    stats: {
      predictions_made: number;
      prediction_accuracy: number;
    };
  };
  metrics: PerformanceMetric[];
  prediction_history?: {
    total_predictions: number;
    stored_count: number;
    last_updated: number;
    items: PredictionItem[];
  };
  profit_over_time?: {
    last_updated: number;
    total_days: number;
    data_points: ProfitDataPoint[];
  };
  last_activity: string | null;
  last_chat_message: string | null;
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
