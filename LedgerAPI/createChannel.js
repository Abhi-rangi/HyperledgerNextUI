const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const paths = require('./paths.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const absolutePathToTestNetwork = paths.absolutePathToTestNetwork;
//const pathToFabricBinaries = paths.fabricBinPath;

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

async function createChannel(channelName) {
    try {
        const createChannelCommand = `${absolutePathToTestNetwork}/network.sh createChannel -c ${channelName}`;
        console.log(`Creating channel ${channelName}...`);
        const createChannelOutput = await runCommand(createChannelCommand);
        console.log(createChannelOutput);
        console.log(`Channel ${channelName} created successfully.`);
    } catch (error) {
        console.error(`Failed to create channel: ${error}`);
    }
}


rl.question('Enter the channel name: ', async (channelName) => {
    try {
        await createChannel(channelName);
    } catch (error) {
        console.error(`Error during processing: ${error}`);
    } finally {
        rl.close();
    }
});