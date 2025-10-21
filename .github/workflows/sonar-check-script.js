/**
 * Script for GitHub Actions to manually check SonarCloud Quality Gate status
 * by polling the SonarCloud API. This avoids using problematic third-party actions.
 */

const PROJECT_KEY = 'kitthapat-j_devsecops-fullsolution'; // ต้องตรงกับที่ตั้งไว้ใน YAML
const MAX_WAIT_TIME_SECONDS = 300; // 5 นาที
const POLLING_INTERVAL_SECONDS = 5;

/**
 * Sleeps for a given duration.
 * @param {number} ms - Milliseconds to sleep.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks the Quality Gate status via Sonar API.
 * @param {object} context - GitHub Action context object.
 */
async function checkQualityGate({core, fetch}) {
    // 1. ดึงค่าจาก Environment Variables
    const SONAR_HOST = process.env.SONAR_HOST_URL || core.getInput('SONAR_HOST_URL') || 'https://sonarcloud.io';
    const SONAR_TOKEN = process.env.SONAR_TOKEN || core.getInput('SONAR_TOKEN');
    
    // ตรวจสอบว่ามี Token และ Host URL
    if (!SONAR_TOKEN) {
        core.setFailed("SONAR_TOKEN is missing from environment variables.");
        return;
    }
    
    const authHeader = `Basic ${Buffer.from(SONAR_TOKEN + ':').toString('base64')}`;

    let taskAnalysisId;
    let qualityGateStatus = 'NONE';
    const startTime = Date.now();

    core.info(`Starting check for Sonar Quality Gate on project: ${PROJECT_KEY}`);
    core.info(`Host URL: ${SONAR_HOST}`);

    // === 2. หา Task Analysis ID ล่าสุด ===
    let totalWaitTime = 0;
    while (!taskAnalysisId && totalWaitTime < MAX_WAIT_TIME_SECONDS) {
        const statusUrl = `${SONAR_HOST}/api/project_analyses/search?project=${PROJECT_KEY}&pageSize=1`;
        
        core.info(`Attempting to fetch latest analysis... (Wait time: ${totalWaitTime}s)`);
        
        try {
            const response = await fetch(statusUrl, {
                headers: { 'Authorization': authHeader }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch analysis: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.analyses && data.analyses.length > 0) {
                taskAnalysisId = data.analyses[0].key;
                core.info(`Found latest analysis key: ${taskAnalysisId}`);
                break;
            }
        } catch (error) {
            core.warning(`Warning: API call failed - ${error.message}. Retrying...`);
        }

        await sleep(POLLING_INTERVAL_SECONDS * 1000);
        totalWaitTime += POLLING_INTERVAL_SECONDS;
    }

    if (!taskAnalysisId) {
        core.setFailed("Could not find any recent Sonar analysis key after maximum wait time.");
        return;
    }

    // === 3. ตรวจสอบ Quality Gate Status ===
    totalWaitTime = 0;
    while (qualityGateStatus === 'NONE' && totalWaitTime < MAX_WAIT_TIME_SECONDS) {
        const qualityGateUrl = `${SONAR_HOST}/api/qualitygates/project_status?analysisId=${taskAnalysisId}`;

        core.info(`Checking Quality Gate status for analysis ID: ${taskAnalysisId} (Total wait: ${totalWaitTime}s)`);

        try {
            const response = await fetch(qualityGateUrl, {
                headers: { 'Authorization': authHeader }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch Quality Gate status: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.projectStatus && data.projectStatus.status) {
                qualityGateStatus = data.projectStatus.status;
                core.info(`Sonar Quality Gate Status: ${qualityGateStatus}`);
                
                if (qualityGateStatus !== 'OK') {
                    // ถ้า FAIL ให้ใช้ setFailed เพื่อให้ Job ล้มเหลวทันที
                    core.setFailed(`❌ Sonar Quality Gate FAILED with status: ${qualityGateStatus}`);
                } else {
                    core.info("✅ Sonar Quality Gate PASSED.");
                }
                return;
            }
        } catch (error) {
            core.warning(`Warning: Quality Gate API call failed - ${error.message}. Retrying...`);
        }

        await sleep(POLLING_INTERVAL_SECONDS * 1000);
        totalWaitTime += POLLING_INTERVAL_SECONDS;
    }

    if (qualityGateStatus === 'NONE') {
        core.setFailed("Sonar Quality Gate status not available after maximum wait time.");
    }
}

module.exports = { checkQualityGate };
