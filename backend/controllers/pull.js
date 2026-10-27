const fs = require("fs").promises;
const path = require("path");
const { ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3, S3_BUCKET } = require("../config/aws-config");

async function pullRepo() {
  const repoPath = path.resolve(process.cwd(), ".apnaGit");

  try {
    let token;

    do {
      const data = await s3.send(
        new ListObjectsV2Command({
          Bucket: S3_BUCKET,
          Prefix: "commits/",
          ContinuationToken: token,
        })
      );

      for (const object of data.Contents ?? []) {
        const key = object.Key;
        if (key.endsWith("/")) continue;

        const filePath = path.join(repoPath, key);
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        const response = await s3.send(
          new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
        );

        await fs.writeFile(filePath, await response.Body.transformToByteArray());
      }

      token = data.NextContinuationToken;
    } while (token);

    console.log("All commits pulled from S3.");
  } catch (err) {
    console.error("Unable to pull : ", err);
  }
}

module.exports = { pullRepo };