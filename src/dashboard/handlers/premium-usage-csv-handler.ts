import { Readable } from 'node:stream';
import csv from 'csv-parser';
import { PremiumRequestUsage } from '@/features/common/models';

export async function processCsvFromDownloadUrl(
  downloadUrl: string
): Promise<PremiumRequestUsage[]> {
  console.log(`[CSV Handler] Starting to download and process CSV from: ${downloadUrl}`);

  return new Promise((resolve, reject) => {
    const records: PremiumRequestUsage[] = [];

    // Download the CSV file using fetch
    fetch(downloadUrl, {
      headers: {
        'Accept': 'text/csv',
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}`);
        }
        return response.body;
      })
      .then(body => {
        if (!body) {
          throw new Error('No response body received');
        }

        // Convert ReadableStream to Node.js Readable stream
        const readableStream = body as any;
        const nodeReadable = Readable.fromWeb(readableStream);

        // Process CSV using streams 
        nodeReadable
          .pipe(csv({
            // Map headers and trim whitespace, remove quotes
            mapHeaders: ({ header }) => header.trim().replace(/\"/g, ''),
            mapValues: ({ value }) => value.trim().replace(/^\"|\"$/g, '')
          }))
          .on('data', (rowData) => {
            try {
              // Create PremiumRequestUsage object from CSV row with full precision preservation
              const record: PremiumRequestUsage = {
                date: rowData.date || '',
                username: rowData.username || '',
                product: rowData.product || '',
                sku: rowData.sku || '',
                model: rowData.model || '',
                quantity: rowData.quantity,
                unit_type: rowData.unit_type || '',
                applied_cost_per_quantity: rowData.applied_cost_per_quantity,
                gross_amount: rowData.gross_amount,
                discount_amount: rowData.discount_amount,
                net_amount: rowData.net_amount,
                exceeds_quota: (rowData.exceeds_quota || '').toLowerCase() === 'true',
                total_monthly_quota: parseInt(rowData.total_monthly_quota) || 0,
                organization: rowData.organization || '',
                cost_center_name: rowData.cost_center_name || ''
              };

              records.push(record);
            } catch (error) {
              console.error('[CSV Handler] Error processing row:', rowData, error);
            }
          })
          .on('end', () => {
            console.log(`[CSV Handler] Successfully processed ${records.length} records from CSV`);
            resolve(records);
          })
          .on('error', (error) => {
            console.error('[CSV Handler] Error processing CSV stream:', error);
            reject(error);
          });
      })
      .catch(reject);
  });
}
