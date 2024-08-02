const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const paths = require('./paths.json');

// Update these paths according to your setup
const absolutePathToTestNetwork = paths.absolutePathToTestNetwork;
const dockerComposeCaOrg3Path = path.join(absolutePathToTestNetwork, 'addOrg3/compose/docker/docker-compose-ca-org3.yaml');
const dockerComposeOrg3Path = path.join(absolutePathToTestNetwork, 'addOrg3/compose/docker/docker-compose-org3.yaml');
const org3PeerPath = path.join(absolutePathToTestNetwork, 'organizations/peerOrganizations/org3.example.com');
const org3CaPath = path.join(absolutePathToTestNetwork, 'organizations/fabric-ca/org3');

// Function to execute shell commands
function execCommand(command, env = {}) {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit', env: { ...process.env, ...env } });
}

// Function to remove Org3's containers and volumes
function removeOrg3Containers() {
    console.log('Stopping and removing Org3 containers and volumes...');
    execCommand(`docker-compose -f ${dockerComposeCaOrg3Path} down --volumes --remove-orphans`, { DOCKER_SOCK: '/var/run/docker.sock' });
    execCommand(`docker-compose -f ${dockerComposeOrg3Path} down --volumes --remove-orphans`, { DOCKER_SOCK: '/var/run/docker.sock' });
    execCommand(`docker rm -f peer0.org3.example.com ca_org3 || true`, { DOCKER_SOCK: '/var/run/docker.sock' });
    execCommand(`docker volume prune -f || true`, { DOCKER_SOCK: '/var/run/docker.sock' });
    console.log('Org3 containers and volumes removed.');
}

// Function to clean up Org3's crypto material
function cleanUpOrg3CryptoMaterial() {
    console.log('Cleaning up Org3 crypto material...');
    if (fs.existsSync(org3PeerPath)) {
        fs.rmSync(org3PeerPath, { recursive: true, force: true });
        console.log(`Removed directory: ${org3PeerPath}`);
    }
    if (fs.existsSync(org3CaPath)) {
        fs.rmSync(org3CaPath, { recursive: true, force: true });
        console.log(`Removed directory: ${org3CaPath}`);
    }
    console.log('Org3 crypto material cleaned up.');
}

// Main function to run all steps
async function main() {
    try {
        // Step 1: Remove Org3's containers and volumes
        removeOrg3Containers();

        // Step 2: Clean up Org3's crypto material
        cleanUpOrg3CryptoMaterial();

        console.log('Org3 has been successfully removed from the network.');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
