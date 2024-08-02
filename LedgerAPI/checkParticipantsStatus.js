const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const paths = require('./paths.json');

const absolutePathToTestNetwork = paths.absolutePathToTestNetwork;
const pathToFabricBinaries = paths.fabricBinPath;

async function runCommand(command, options) {
    return new Promise((resolve, reject) => {
        const exec = require('child_process').exec;
        const child = exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });

        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
    });
}

async function listParticipatingNodes(channelName) {
  try {
      process.chdir(absolutePathToTestNetwork);

      const envScriptPath = path.join(absolutePathToTestNetwork, 'env.sh');
      const envScriptContent = `
      #!/bin/bash
      export PATH=${pathToFabricBinaries}:$PATH
      export FABRIC_CFG_PATH=$PWD/../config/
      export CORE_PEER_TLS_ENABLED=true
      export CORE_PEER_LOCALMSPID=Org1MSP
      export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
      export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
      export CORE_PEER_ADDRESS=localhost:7051
      peer channel fetch config config_block.pb -o localhost:7050 -c ${channelName} --tls --cafile $PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
      `;

      fs.writeFileSync(envScriptPath, envScriptContent);
      fs.chmodSync(envScriptPath, '755');

      const options = {
          env: {
              ...process.env,
              PATH: `${pathToFabricBinaries}:${process.env.PATH}`
          }
      };

      console.log(`Running temporary script to fetch configuration block for channel ${channelName}...`);
      await runCommand(`bash ${envScriptPath}`, options);
      console.log(`Fetched the latest configuration block for channel ${channelName}.`);

      console.log('Converting the configuration block to JSON...');
      await runCommand(`${pathToFabricBinaries}/configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json`, options);
      console.log('Converted the configuration block to JSON.');

      console.log('Extracting the channel configuration...');
      await runCommand(`jq .data.data[0].payload.data.config config_block.json > config.json`, options);
      console.log('Extracted the channel configuration.');

      console.log('Listing the organizations in the channel configuration...');
      const output = await runCommand(`jq -r '.channel_group.groups.Application.groups' config.json`, options);
      console.log('Organizations in the channel:');
      console.log(output);

      fs.unlinkSync(envScriptPath);
  } catch (error) {
      console.error(`Failed to list participating nodes: ${error}`);
  }
}

// Ask user for channel name and call the function
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Please enter the channel name: ', (channelName) => {
    listParticipatingNodes(channelName).then(() => {
        rl.close();
    }).catch((error) => {
        console.error(`Error: ${error}`);
        rl.close();
    });
});

