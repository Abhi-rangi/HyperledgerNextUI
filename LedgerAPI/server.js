const express = require("express");
const { exec } = require('child_process');
const { execSync } = require('child_process');
const { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const cors = require("cors");
const paths = require('./paths.json');
const app = express();
app.use(express.json());
app.use(cors());

const absolutePathToFabricSamples = paths.absolutePathToFabricSamples;
const absolutePathToTestNetwork = paths.absolutePathToTestNetwork;

//"absolutePathToTestNetwork": "/home/cslmach/go/src/github.com/multihost_2org_hyperledger/crypto-config",

const org1Ca = "/home/cslmach/go/src/github.com/multihost_2org_hyperledger/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt";
const ccpPathBase = "/home/cslmach/go/src/github.com/multihost_2org_hyperledger/crypto-config/peerOrganizations";
const org1Adminmsp = "/home/cslmach/go/src/github.com/multihost_2org_hyperledger/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp";
const org2Ca = "/home/cslmach/go/src/github.com/multihost_2org_hyperledger/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt";
const org2Adminmsp = "/home/cslmach/go/src/github.com/multihost_2org_hyperledger/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp";





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

function execCommand(command, cwd = null) {
  try {
      console.log(`Executing: ${command}`);
      exec(command, { stdio: 'inherit', cwd: cwd || process.cwd() });
  } catch (error) {
      console.error(`Command failed: ${command}`);
      console.error(`Error: ${error.message}`);
      throw error;
  }
}

function execCommandWithRetry(command, cwd = null, retries = 3) {
  for (let i = 0; i < retries; i++) {
      try {
          execCommand(command, cwd);
          return;
      } catch (error) {
          console.error(`Retrying command (${i + 1}/${retries}): ${command}`);
          if (i === retries - 1) {
              throw error;
          }
      }
  }
}

function setEnvForPeer(org) {
  if (org === 'org1') {
      process.env.CORE_PEER_TLS_ENABLED = 'true';
      process.env.CORE_PEER_LOCALMSPID = 'Org1MSP';
      process.env.CORE_PEER_TLS_ROOTCERT_FILE = path.resolve(absolutePathToTestNetwork, 'peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt');
      process.env.CORE_PEER_MSPCONFIGPATH = path.resolve(absolutePathToTestNetwork, 'peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp');
      process.env.CORE_PEER_ADDRESS = 'localhost:7051';
  } else if (org === 'org2') {
      process.env.CORE_PEER_TLS_ENABLED = 'true';
      process.env.CORE_PEER_LOCALMSPID = 'Org2MSP';
      process.env.CORE_PEER_TLS_ROOTCERT_FILE = path.resolve(absolutePathToTestNetwork, 'peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt');
      process.env.CORE_PEER_MSPCONFIGPATH = path.resolve(absolutePathToTestNetwork, 'peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp');
      process.env.CORE_PEER_ADDRESS = 'localhost:9051';
  }
}

function getPackageId(chaincodeName, chaincodeVersion) {
  const installedChaincodes = execSync(`peer lifecycle chaincode queryinstalled`).toString();
  console.log("Installed Chaincodes Output:", installedChaincodes);
  
  const pattern = new RegExp(`Package ID: ${chaincodeName}_${chaincodeVersion}:([a-f0-9]{64}), Label: ${chaincodeName}_${chaincodeVersion}`);
  const match = installedChaincodes.match(pattern);
  
  if (!match) {
      throw new Error('Package ID not found');
  }
  
  console.log("Package ID is:", match[1]);
  return match[1];
}


const ordererCA = path.resolve(absolutePathToTestNetwork, 'ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem');
const org1PeerCertFile = path.resolve(absolutePathToTestNetwork, 'peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt');
const org2PeerCertFile = path.resolve(absolutePathToTestNetwork, 'peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt');



async function createChannel() {
  try {
      const createChannelCommand = `${absolutePathToFabricSamples}/mychannelup.sh`;
      console.log(`Creating channel ...`);
      const createChannelOutput = await runCommand(createChannelCommand);
      console.log(createChannelOutput);
      console.log(`Channel created successfully.`);
      return `Channel created successfully.`;
  } catch (error) {
      console.error(`Failed to create channel: ${error}`);
      throw new Error(`Failed to create channel: ${error.message}`);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////edited up to here
async function enrollAdmin(enrollmentID, enrollmentSecret) {
  const ccpPath = path.resolve(
    paths.absolutePathToTestNetwork,
    "peerOrganizations/org1.example.com/connection-org1.yaml"
  );

  const ccp = yaml.load(fs.readFileSync(ccpPath, "utf8"));

  // Setup the CA Client
  const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  const ca = new FabricCAServices(
    caInfo.url,
    {
      trustedRoots: caTLSCACerts,
      verify: false,
    },
    caInfo.caName
  );

  // Create a new wallet : Note that wallet is for managing identities.
  const walletPath = path.join(process.cwd(), `wallet`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

  // Check to see if we've already enrolled the admin user.
  const adminExists = await wallet.get("admin");
  if (adminExists) {
    return { message: 'An identity for the admin user "admin" already exists in the wallet' };
  }

  // Enroll the admin user, and import the new identity into the wallet.
  const enrollment = await ca.enroll({
    enrollmentID,
    enrollmentSecret,
  });

  const identity = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: "Org1MSP",
    type: "X.509",
  };

  await wallet.put("admin", identity);
  return { message: 'Successfully enrolled admin user "admin" and imported it into the wallet' };
}



// Function to connect to gateway
const connectToGateway = async (org, identityName) => {
  try {
    const ccpPath = path.resolve(`${ccpPathBase}/${org}.example.com`, `connection-${org}.yaml`);
    const ccp = yaml.load(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(process.cwd(), `wallet`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get(identityName);

    if (!identity) {
      console.log(`An identity for the user "${identityName}" does not exist in the wallet`);
      console.log("Run the registerUser.js application before retrying");
      return null;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: identityName,
      discovery: { enabled: true, asLocalhost: true },
    });

    return gateway;
  } catch (error) {
    console.error(`Failed to connect to gateway: ${error}`);
    return null;
  }
};

app.post("/enroll-admin", async (req, res) => {
  const { enrollmentID, enrollmentSecret } = req.body;

  if (!enrollmentID || !enrollmentSecret) {
    return res.status(400).json({ message: "Enrollment ID and Secret are required" });
  }

  try {
    const result = await enrollAdmin(enrollmentID, enrollmentSecret);
    res.status(200).json(result);
  } catch (error) {
    console.error(`Failed to enroll admin user: ${error}`);
    res.status(500).json({ message: error.message });
  }
});


// Endpoint to register a user
app.post("/registerUser", async (req, res) => {
  const { org, enrollmentID, affiliation, role } = req.body;

  try {
    const ccpPath = path.resolve(`${ccpPathBase}/${org}.example.com`, `connection-${org}.yaml`);
    const ccp = yaml.load(fs.readFileSync(ccpPath, "utf8"));

    const caInfo = ccp.certificateAuthorities[`ca.${org}.example.com`];
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caInfo.tlsCACerts.pem, verify: false },
      caInfo.caName
    );

    const walletPath = path.join(process.cwd(), `wallet`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const adminIdentity = await wallet.get("admin");
    if (!adminIdentity) {
      return res.status(400).send('Admin identity not found in the wallet. Run the enrollAdmin.js application before retrying');
    }

    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "admin");

    const secret = await ca.register(
      {
        affiliation: affiliation || `${org}.department1`,
        enrollmentID: enrollmentID,
        role: role || "client",
      },
      adminUser
    );
    const enrollment = await ca.enroll({
      enrollmentID: enrollmentID,
      enrollmentSecret: secret,
    });
    const userIdentity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: `${org.charAt(0).toUpperCase() + org.slice(1)}MSP`,
      type: "X.509",
    };
    await wallet.put(enrollmentID, userIdentity);
    res.status(200).send(`Successfully registered and enrolled user ${enrollmentID} and imported it into the wallet`);
  } catch (error) {
    res.status(500).send(`Error in registering or enrolling user: ${error}`);
  }
});
app.post("/checkUser", async (req, res) => {
  const { org, enrollmentID } = req.body;

  try {
    const walletPath = path.join(process.cwd(), `wallet`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const userIdentity = await wallet.get(enrollmentID);
    if (userIdentity) {
      res.status(200).send(`User ${enrollmentID} is already registered`);
    } else {
      res.status(404).send(`User ${enrollmentID} is not registered`);
    }
  } catch (error) {
    res.status(500).send(`Error in checking user registration: ${error}`);
  }
});

// Endpoint to create a patient
app.post("/create-patient", async (req, res) => {
  try {
    const { org, identityName, patientData } = req.body;
    const gateway = await connectToGateway(org, identityName);
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("basic2");

    await contract.submitTransaction(
      "CreatePatient",
      JSON.stringify(patientData)
    );

    await gateway.disconnect();

    res.status(200).json({ message: "Patient record and initial observation have been created." });
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ message: `Failed to create patient: ${error.message}` });
  }
});

// Endpoint to append observation
app.post("/append-observation", async (req, res) => {
  try {
    const { org, identityName, patientId, observationData } = req.body;
    const timestamp = new Date().toISOString(); // Generate timestamp on server side

    const gateway = await connectToGateway(org, identityName);
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("basic2");

    await contract.submitTransaction(
      "AppendObservation",
      patientId,
      JSON.stringify(observationData),
      // timestamp // Pass the timestamp as a parameter
    );
    await gateway.disconnect();

    res.status(200).json({ message: "Observation has been appended." });
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ message: `Failed to append observation: ${error.message}` });
  }
});

// Endpoint to get a patient
app.get("/get-patient/:id", async (req, res) => {
  try {
    const org = req.headers["org"];
    const identityName = req.headers["identityname"];
    const { id } = req.params;
    const gateway = await connectToGateway(org, identityName);
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("basic2");

    const result = await contract.evaluateTransaction("ReadPatient", id);
    await gateway.disconnect();

    res.status(200).json(JSON.parse(result.toString()));
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ message: `Failed to fetch patient: ${error.message}` });
  }
});

// Endpoint to get all patients
app.get("/get-all-patients", async (req, res) => {
  try {
    const org = req.headers["org"];
    const identityName = req.headers["identityname"];
    const gateway = await connectToGateway(org, identityName);
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("basic2");
const result1 = await contract.evaluateTransaction("getAllKeys");
console.log(`Transaction has been evaluated, result is: ${result1.toString()}`);
    const result = await contract.evaluateTransaction("GetAllPatients");
    await gateway.disconnect();

    res.status(200).json(JSON.parse(result.toString()));
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ message: `Failed to fetch patients: ${error.message}` });
  }
});
// Endpoint to delete a patient
app.delete("/delete-patient", async (req, res) => {
    try {
        const { org, identityName, patientId } = req.body; // Assuming patientId comes in the request body for security reasons

        const gateway = await connectToGateway(org, identityName);
        if (!gateway) {
            res.status(500).send("Failed to connect to gateway.");
            return;
        }
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("basic2");

        // Submit transaction to delete a patient record
        await contract.submitTransaction("DeletePatient", patientId);
        await gateway.disconnect();

        res.status(200).json({ message: `Patient record with ID ${patientId} has been deleted.` });
    } catch (error) {
        console.error(`Failed to delete patient record: ${error}`);
        res.status(500).json({ message: `Failed to delete patient: ${error.message}` });
    }
});
app.get("/asset-history/:assetId", async (req, res) => {
  try {
    const org = req.headers["org"];
    const identityName = req.headers["identityname"];
    const { assetId } = req.params;
    const gateway = await connectToGateway(org, identityName);
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("basic2");

    const history = await contract.evaluateTransaction(
      "GetAssetHistory",
      assetId
    );
    await gateway.disconnect();

    res.status(200).json({ history: JSON.parse(history.toString()) });
  } catch (error) {
    console.error(`Failed to retrieve asset history: ${error}`);
    res
      .status(500)
      .json({ message: `Failed to retrieve asset history: ${error.message}` });
  }
});


app.post('/create-channel', async (req, res) => {
  const channelName = req.body.channelName;

  if (!channelName) {
      return res.status(400).send('Channel name is required');
  }

  try {
      const result = await createChannel(channelName);
      res.status(200).send(result);
  } catch (error) {
      if (error.message == "Failed to create channel: undefined") {
        res.status(500).send(`Channel Already exists!`);
      } else {
      res.status(500).send(`Error creating channel: ${error.message}`);
      };
  }
});


app.post('/deploy-chaincode', async (req, res) => {
  const { chaincodeName, chaincodeVersion, channelName, chaincodePath } = req.body;

  if (!chaincodeName || !chaincodeVersion || !channelName || !chaincodePath) {
      return res.status(400).send('Chaincode name, version, and channel name are required');
  }

  try {
      // Set environment variables for Fabric binaries and configuration
      process.env.FABRIC_CFG_PATH = path.resolve(absolutePathToFabricSamples, 'config');
      process.env.PATH = `${process.env.PATH}:${path.resolve(absolutePathToFabricSamples, 'bin')}`;

      // Install dependencies for the chaincode
      console.log('Installing chaincode dependencies...');
      execCommand(`npm install`, chaincodePath);

      // Package the chaincode
      console.log('Packaging chaincode...');
      execCommand(`peer lifecycle chaincode package ${chaincodeName}.tar.gz --path ${chaincodePath} --lang node --label ${chaincodeName}_${chaincodeVersion}`, absolutePathToFabricSamples);

      // Install the chaincode on peer0.org1
      console.log('Installing chaincode on peer0.org1...');
      setEnvForPeer('org1');
      execCommandWithRetry(`peer lifecycle chaincode install ${chaincodeName}.tar.gz`, absolutePathToFabricSamples);

      // Install the chaincode on peer0.org2
      console.log('Installing chaincode on peer0.org2...');
      setEnvForPeer('org2');
      execCommandWithRetry(`peer lifecycle chaincode install ${chaincodeName}.tar.gz`, absolutePathToFabricSamples);

      // Get the package ID
      const packageId = getPackageId(chaincodeName, chaincodeVersion);

      // Approve the chaincode definition for Org1
      console.log('Approving chaincode definition for Org1...');
      setEnvForPeer('org1');
      execCommandWithRetry(`peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID ${channelName} --name ${chaincodeName} --version ${chaincodeVersion} --package-id ${packageId} --sequence 1 --tls --cafile ${ordererCA}`, absolutePathToFabricSamples);

      // Approve the chaincode definition for Org2
      console.log('Approving chaincode definition for Org2...');
      setEnvForPeer('org2');
      execCommandWithRetry(`peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID ${channelName} --name ${chaincodeName} --version ${chaincodeVersion} --package-id ${packageId} --sequence 1 --tls --cafile ${ordererCA}`, absolutePathToFabricSamples);

      // Commit the chaincode definition
      console.log('Committing chaincode definition...');
      setEnvForPeer('org1');
      execCommandWithRetry(`peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID ${channelName} --name ${chaincodeName} --version ${chaincodeVersion} --sequence 1 --tls --cafile ${ordererCA} --peerAddresses localhost:7051 --tlsRootCertFiles ${org1PeerCertFile} --peerAddresses localhost:9051 --tlsRootCertFiles ${org2PeerCertFile}`, absolutePathToFabricSamples);

      res.status(200).send('Chaincode packaged, approved, and committed successfully.');
  } catch (error) {
      console.error(`Error: ${error.message}`);
      res.status(500).send(`Error deploying chaincode: ${error.message}`);
  }
});



app.listen(3001, () => {
  console.log("Server is listening on port http://localhost:3001");
});
