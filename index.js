npm install @azure/identity @azure/keyvault-secrets
//---------------------------------------------------------------------------------------------------------------------------------------------------------------

const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const credential = new DefaultAzureCredential();
const keyVaultName = "your-keyvault-name";
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
const secretClient = new SecretClient(keyVaultUrl, credential);

module.exports = async function (context, req) {
    try {
        // READ secret
        const secretName = "your-secret-name";
        const secret = await secretClient.getSecret(secretName);
        context.log(`Secret value: ${secret.value}`);

        // UPDATE secret
        const updatedSecret = await secretClient.setSecret(secretName, "new-secret-value");
        context.log(`Updated secret version: ${updatedSecret.properties.version}`);

        context.res = {
            status: 200,
            body: {
                readSecret: secret.value,
                updatedVersion: updatedSecret.properties.version
            }
        };
    } catch (err) {
        context.log.error("Error accessing Key Vault", err);
        context.res = {
            status: 500,
            body: `Error: ${err.message}`
        };
    }
};
