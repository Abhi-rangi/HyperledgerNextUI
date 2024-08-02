const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const paths = require('./paths.json');
const readline = require('readline');

const executeCommand = (command, workingDirectory) => {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: workingDirectory, shell: '/bin/bash' }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
      } else {
        console.log(`stdout: ${stdout}`);
        resolve(stdout);
      }
    });
  });
}

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer);
  }));
}

const runAddOrg3 = async () => {
  try {
    const channelName = await askQuestion("Enter the channel name Org3 should join: ");

    const baseDir = paths.absolutePathToTestNetwork;
    const addOrg3Dir = path.resolve(baseDir, 'addOrg3');
    const testNetworkDir = baseDir;
    const binDir = path.resolve(testNetworkDir, '../bin');
    const configDir = path.resolve(testNetworkDir, '../config'); // Assuming the core.yaml is in the config directory
    const configtxDir = path.resolve(testNetworkDir, '../configtx');
    const org1AdminMSP = path.resolve(testNetworkDir, 'organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp'); // MSP directory path
    const org2AdminMSP = path.resolve(testNetworkDir, 'organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp'); // MSP directory path
    const org3AdminMSP = path.resolve(testNetworkDir, 'organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp'); // MSP directory path
    const ordererMSP = path.resolve(testNetworkDir, 'organizations/ordererOrganizations/example.com/users/Admin@example.com/msp');

    // Ensure org3-crypto.yaml is present
    const org3CryptoYamlPath = path.join(addOrg3Dir, 'org3-crypto.yaml');
    if (!fs.existsSync(org3CryptoYamlPath)) {
      throw new Error(`org3-crypto.yaml not found at ${org3CryptoYamlPath}`);
    }

    // Step 1: Bring up the CA for Org3
    console.log('Starting Org3 CA...');
    await executeCommand(`docker-compose -f compose/compose-ca-org3.yaml up -d`, addOrg3Dir);
    console.log('Org3 CA started successfully.');

    // Step 2: Generate Org3 Crypto Material using cryptogen
    console.log('Generating Org3 crypto material using cryptogen...');
    await executeCommand(`${binDir}/cryptogen generate --config=org3-crypto.yaml --output="../organizations"`, addOrg3Dir);
    console.log('Org3 crypto material generated successfully.');

    // Step 3: Generate Org3 organization definition
    console.log('Generating Org3 organization definition...');
    await executeCommand(`export FABRIC_CFG_PATH=${configtxDir} && ${binDir}/configtxgen -printOrg Org3MSP > ../organizations/peerOrganizations/org3.example.com/org3.json`, addOrg3Dir);
    console.log('Org3 organization definition generated successfully.');

    // Step 4: Bring up Org3 components
    console.log('Bringing up Org3 components...');
    await executeCommand(`export DOCKER_SOCK=/var/run/docker.sock && docker-compose -f compose/compose-org3.yaml -f compose/docker/docker-compose-org3.yaml up -d`, addOrg3Dir);
    console.log('Org3 components brought up successfully.');

    // Step 5: Fetch the configuration
    console.log('Fetching the configuration...');
    await executeCommand(`
      export PATH=${binDir}:$PATH &&
      export FABRIC_CFG_PATH=${configDir} &&
      export CORE_PEER_TLS_ENABLED=true &&
      export CORE_PEER_LOCALMSPID=Org1MSP &&
      export CORE_PEER_TLS_ROOTCERT_FILE=${testNetworkDir}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt &&
      export CORE_PEER_MSPCONFIGPATH=${org1AdminMSP} &&
      export CORE_PEER_ADDRESS=localhost:7051 &&
      peer channel fetch config channel-artifacts/config_block.pb -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c ${channelName} --tls --cafile "${testNetworkDir}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
    `, testNetworkDir);
    console.log('Configuration fetched successfully.');

    // Step 6: Convert the configuration to JSON and trim it down
    console.log('Converting configuration to JSON and trimming it down...');
    await executeCommand(`
      export PATH=${binDir}:$PATH &&
      configtxlator proto_decode --input channel-artifacts/config_block.pb --type common.Block --output channel-artifacts/config_block.json &&
      jq ".data.data[0].payload.data.config" channel-artifacts/config_block.json > channel-artifacts/config.json
    `, testNetworkDir);
    console.log('Configuration converted to JSON successfully.');

    // Step 7: Add the Org3 crypto material
    console.log('Adding Org3 crypto material...');
    await executeCommand(`
      export PATH=${binDir}:$PATH &&
      jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"Org3MSP":.[1]}}}}}' channel-artifacts/config.json organizations/peerOrganizations/org3.example.com/org3.json > channel-artifacts/modified_config.json &&
      configtxlator proto_encode --input channel-artifacts/config.json --type common.Config --output channel-artifacts/config.pb &&
      configtxlator proto_encode --input channel-artifacts/modified_config.json --type common.Config --output channel-artifacts/modified_config.pb &&
      configtxlator compute_update --channel_id ${channelName} --original channel-artifacts/config.pb --updated channel-artifacts/modified_config.pb --output channel-artifacts/org3_update.pb &&
      configtxlator proto_decode --input channel-artifacts/org3_update.pb --type common.ConfigUpdate --output channel-artifacts/org3_update.json &&
      echo '{"payload":{"header":{"channel_header":{"channel_id":"${channelName}", "type":2}},"data":{"config_update":'$(cat channel-artifacts/org3_update.json)'}}}' | jq . > channel-artifacts/org3_update_in_envelope.json &&
      configtxlator proto_encode --input channel-artifacts/org3_update_in_envelope.json --type common.Envelope --output channel-artifacts/org3_update_in_envelope.pb
    `, testNetworkDir);
    console.log('Org3 crypto material added successfully.');

    // Check if the org3_update_in_envelope.pb file was created
    const org3UpdateEnvelopePath = path.resolve(testNetworkDir, 'channel-artifacts/org3_update_in_envelope.pb');
    if (!fs.existsSync(org3UpdateEnvelopePath)) {
      throw new Error(`File not found: ${org3UpdateEnvelopePath}`);
    }

    // Step 8: Sign the config update by Org1 Admin
    console.log('Signing the config update by Org1 Admin...');
    await executeCommand(`
      export PATH=${binDir}:$PATH &&
      export FABRIC_CFG_PATH=${configDir} &&
      export CORE_PEER_TLS_ENABLED=true &&
      export CORE_PEER_LOCALMSPID=Org1MSP &&
      export CORE_PEER_TLS_ROOTCERT_FILE=${testNetworkDir}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt &&
      export CORE_PEER_MSPCONFIGPATH=${org1AdminMSP} &&
      export CORE_PEER_ADDRESS=localhost:7051 &&
      peer channel signconfigtx -f channel-artifacts/org3_update_in_envelope.pb
    `, testNetworkDir);
    console.log('Config update signed by Org1 Admin.');

    // Sign the config update by Org2 Admin
    console.log('Signing the config update by Org2 Admin...');
    await executeCommand(`
      export PATH=${binDir}:$PATH &&
      export FABRIC_CFG_PATH=${configDir} &&
      export CORE_PEER_TLS_ENABLED=true &&
      export CORE_PEER_LOCALMSPID=Org2MSP &&
      export CORE_PEER_TLS_ROOTCERT_FILE=${testNetworkDir}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt &&
      export CORE_PEER_MSPCONFIGPATH=${org2AdminMSP} &&
      export CORE_PEER_ADDRESS=localhost:9051 &&
      peer channel signconfigtx -f channel-artifacts/org3_update_in_envelope.pb
    `, testNetworkDir);
    console.log('Config update signed by Org2 Admin.');

    // Sign the config update by Orderer Admin
    console.log('Signing the config update by Orderer Admin...');
    await executeCommand(`
      export PATH=${binDir}:$PATH &&
      export FABRIC_CFG_PATH=${configDir} &&
      export CORE_PEER_TLS_ENABLED=true &&
      export CORE_PEER_LOCALMSPID=OrdererMSP &&
      export CORE_PEER_TLS_ROOTCERT_FILE=${testNetworkDir}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt &&
      export CORE_PEER_MSPCONFIGPATH=${ordererMSP} &&
      export CORE_PEER_ADDRESS=localhost:7050 &&
      peer channel signconfigtx -f channel-artifacts/org3_update_in_envelope.pb
    `, testNetworkDir);
    console.log('Config update signed by Orderer Admin.');

    // Sign the config update by ORG3 Admin
    console.log('Signing the config update by org3 Admin...');
    await executeCommand(`
    export PATH=${binDir}:$PATH &&
    export FABRIC_CFG_PATH=${configDir} &&
    export CORE_PEER_TLS_ENABLED=true &&
    export CORE_PEER_LOCALMSPID=Org3MSP &&
    export CORE_PEER_TLS_ROOTCERT_FILE=${testNetworkDir}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt &&
    export CORE_PEER_MSPCONFIGPATH=${org3AdminMSP} &&
    export CORE_PEER_ADDRESS=localhost:11051 &&
    peer channel signconfigtx -f channel-artifacts/org3_update_in_envelope.pb
    `, testNetworkDir);
    console.log('Config update signed by org3 Admin.');


    // Step 10: Submit the config update
    console.log('Submitting the config update...');
    await executeCommand(`
      export PATH=${binDir}:$PATH &&
      export FABRIC_CFG_PATH=${configDir} &&
      export CORE_PEER_TLS_ENABLED=true &&
      export CORE_PEER_LOCALMSPID=Org2MSP &&
      export CORE_PEER_TLS_ROOTCERT_FILE=${testNetworkDir}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt &&
      export CORE_PEER_MSPCONFIGPATH=${org2AdminMSP} &&
      export CORE_PEER_ADDRESS=localhost:9051 &&
      peer channel update -f channel-artifacts/org3_update_in_envelope.pb -c ${channelName} -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${testNetworkDir}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
    `, testNetworkDir);
    console.log('Config update submitted successfully.');

    // Step 11: Fetch the block using Org1 credentials and have Org3 join the channel
    console.log('Fetching the block using Org1 credentials...');
    await executeCommand(`
      export PATH=${binDir}:$PATH &&
      export FABRIC_CFG_PATH=${configDir} &&
      export CORE_PEER_TLS_ENABLED=true &&
      export CORE_PEER_LOCALMSPID=Org1MSP &&
      export CORE_PEER_TLS_ROOTCERT_FILE=${testNetworkDir}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt &&
      export CORE_PEER_MSPCONFIGPATH=${org1AdminMSP} &&
      export CORE_PEER_ADDRESS=localhost:7051 &&
      peer channel fetch 0 channel-artifacts/${channelName}.block -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c ${channelName} --tls --cafile "${testNetworkDir}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
    `, testNetworkDir);
    console.log('Block fetched successfully.');

    console.log('Joining Org3 to the channel...');
    await executeCommand(`
      export PATH=${binDir}:$PATH &&
      export FABRIC_CFG_PATH=${configDir} &&
      export CORE_PEER_TLS_ENABLED=true &&
      export CORE_PEER_LOCALMSPID=Org3MSP &&
      export CORE_PEER_TLS_ROOTCERT_FILE=${testNetworkDir}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt &&
      export CORE_PEER_MSPCONFIGPATH=${org3AdminMSP} &&
      export CORE_PEER_ADDRESS=localhost:11051 &&
      peer channel join -b channel-artifacts/${channelName}.block
    `, testNetworkDir);
    console.log('Org3 joined to the channel successfully.');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

runAddOrg3();
