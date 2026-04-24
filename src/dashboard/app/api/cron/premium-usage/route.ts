import { NextRequest, NextResponse } from 'next/server';
import {
  getPremiumUsageTaskStatus,
  syncPremiumUsageData,
} from '@/services/cron/premium-usage-cron-service';
import { purgeEnterpriseMembersLookupCache } from '@/services/enterprise-members-service';

// Logging function
function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[PremiumUsage-Cron] ${timestamp}: ${message}`);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'run-now':
        log('Manually triggered immediate execution...');
        try {
          await purgeEnterpriseMembersLookupCache();
          log('Enterprise members lookup cache purged before sync');
          await syncPremiumUsageData();
          return NextResponse.json({
            status: 'success',
            message: 'Immediate execution completed',
            executedAt: new Date().toISOString()
          });
        } catch (error) {
          return NextResponse.json({
            status: 'error',
            message: 'Execution failed: ' + (error instanceof Error ? error.message : 'Unknown error')
          }, { status: 500 });
        }


      default:
        return NextResponse.json({
          status: 'error',
          message: 'Please specify action parameter: ?action=run-now',
          availableActions: [
            // { action: 'start', description: 'Start cron job' },
            // { action: 'stop', description: 'Stop cron job' },
            // { action: 'status', description: 'Check job status' },
            { action: 'run-now', description: 'Execute job immediately' }
          ],
          currentSchedule: (await getPremiumUsageTaskStatus()).schedule,
        }, { status: 400 });
    }
  } catch (error) {
    log(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}
