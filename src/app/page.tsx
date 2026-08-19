import { Feed } from "@/components/Feed";
import { collectorId } from "@/lib/bright";
import { loadNotices } from "@/lib/notices";
import { scoreHealth } from "@/lib/schema";
import { SEED_HEALS } from "@/lib/seed";

export default function HomePage() {
  const notices = loadNotices();
  const health = scoreHealth(notices, notices.length);
  return (
    <Feed
      notices={notices}
      health={health}
      collectorId={collectorId()}
      heals={SEED_HEALS}
    />
  );
}
