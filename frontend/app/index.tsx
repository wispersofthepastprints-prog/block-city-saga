import { useEffect } from "react";
import { GameScreen } from "@/src/components/GameScreen";
import { initializeMonetization } from "@/src/services/monetization";

export default function Index() {
  useEffect(() => {
    initializeMonetization().catch(console.error);
  }, []);

  return <GameScreen />;
}
