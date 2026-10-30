import type { ModuleMeta } from '@manabandhu/core';
import { moduleMeta as assistant } from '@/modules/ai-assistant/module';
import { moduleMeta as chat } from '@/modules/chat/module';
import { moduleMeta as community } from '@/modules/community/module';
import { moduleMeta as events } from '@/modules/events/module';
import { moduleMeta as expenses } from '@/modules/expenses/module';
import { moduleMeta as immigration } from '@/modules/immigration/module';
import { moduleMeta as jobs } from '@/modules/jobs/module';
import { moduleMeta as marketplace } from '@/modules/marketplace/module';
import { moduleMeta as referrals } from '@/modules/referrals/module';
import { moduleMeta as rides } from '@/modules/rides/module';
import { moduleMeta as rooms } from '@/modules/rooms/module';
import { moduleMeta as safety } from '@/modules/safety/module';
import type { AppIconName } from '@/modules/shared/ui/AppIcon';
import { moduleMeta as utilities } from '@/modules/utilities/module';

export type LauncherModule = ModuleMeta & { icon: AppIconName };

/**
 * Every business module the launcher can show. Each module owns its own entry in `<module>/module.ts`; adding a
 * module here is the only change the app shell needs.
 */
export const launcherModules: readonly LauncherModule[] = [
  rooms,
  rides,
  community,
  jobs,
  referrals,
  events,
  marketplace,
  expenses,
  immigration,
  utilities,
  safety,
  chat,
  assistant,
];
