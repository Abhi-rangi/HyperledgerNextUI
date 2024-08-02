
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const paths = require('./paths.json');

const absolutePathToTestNetwork = paths.absolutePathToTestNetwork;
const pathToFabricBinaries = paths.fabricBinPath;
const fabricCfgPath = paths.fabricCfgPath;

function runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(`Error: ${error.message}`);
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            resolve(stdout);
        });
    });
}

async function createEnvScript(org) {
    const envScriptPath = path.join(absolutePathToTestNetwork, `env_${org}.sh`);
    const envScriptContent = `
    #!/bin/bash
    export PATH=${pathToFabricBinaries}:$PATH
    export FABRIC_CFG_PATH=${fabricCfgPath}
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID=Org${org}MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${absolutePathToTestNetwork}/organizations/peerOrganizations/org${org}.example.com/peers/peer0.org${org}.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${absolutePathToTestNetwork}/organizations/peerOrganizations/org${org}.example.com/users/Admin@org${org}.example.com/msp
    export CORE_PEER_ADDRESS=localhost:${org === 1 ? '7051' : org === 2 ? '9051' : '11051'}
    `;
    fs.writeFileSync(envScriptPath, envScriptContent.trim());
    fs.chmodSync(envScriptPath, '755');
    return envScriptPath;
}

async function listChannels(org) {
    try {
        const envScriptPath = await createEnvScript(org);
        const listChannelsCommand = `source ${envScriptPath} && peer channel list`;
        console.log(`Listing channels for Org${org}...`);
        const listChannelsOutput = await runCommand(listChannelsCommand, { shell: '/bin/bash' });
        console.log(listChannelsOutput);
        // Clean up the env.sh script after the command execution
        fs.unlinkSync(envScriptPath);
    } catch (error) {
        console.error(`Failed to list channels for Org${org}: ${error}`);
    }
}

const orgs = [1, 2, 3]; // List of organizations you want to list channels for

async function main() {
    for (const org of orgs) {
        await listChannels(org);
    }
}

main();
