import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { gnosis } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Olas Operate",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "placeholder",
  chains: [gnosis],
});
