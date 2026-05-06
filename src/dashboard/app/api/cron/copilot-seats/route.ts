import { NextRequest, NextResponse } from 'next/server';
import { syncSeatsSnapshot } from '@/services/cron/copilot-seats-cron-service';

function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[CopilotSeats-Cron] ${timestamp}: ${message}`);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'run-now':
        log('Manually triggered immediate execution...');
        try {
          await syncSeatsSnapshot();
          return NextResponse.json({
            status: 'success',
            message: 'Immediate execution completed',
            executedAt: new Date().toISOString(),
          });
        } catch (error) {
          return NextResponse.json(
            {
              status: 'error',
              message: 'Execution failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
            },
            { status: 500 },
          );
        }

      default:
        return NextResponse.json(
          {
            status: 'error',
            message: 'Please specify action parameter: ?action=run-now',
            availableActions: [{ action: 'run-now', description: 'Execute seats snapshot sync immediately' }],
          },
          { status: 400 },
        );
    }
  } catch (error) {
    log(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 },
    );
  }
}
